// Bow & Purl Ravelry connector — Cloudflare Worker.
// Also searches Ravelry's yarn database ({action:'yarns'}).
// Reads a Ravelry user's favorited patterns AND the single patterns in their Ravelry library, and returns name, yarn weight, yardage and link.
//
// Variables (Cloudflare dashboard → Worker → Settings → Variables):
//   RAVELRY_USER   (secret)  "Username" from your Ravelry read-only API credentials
//   RAVELRY_PASS   (secret)  "Password" from those credentials (NOT your Ravelry login password)
//   ALLOWED_ORIGIN           e.g. https://yourname.github.io
//   APP_TOKEN      (secret)  random string, 16+ chars (required); enter the same value in the app
// Get credentials at https://www.ravelry.com/pro/developer → create app → "Basic Auth: read only".

const API = 'https://api.ravelry.com';


// Constant-time comparison so the token can't be guessed by timing responses.
function sameToken(a, b) { a = String(a); b = String(b); let d = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return d === 0; }

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
      'Content-Type': 'application/json',
      'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'
    };
    const reply = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: cors });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
    // Fail closed: both settings are required, so a misconfigured Worker can't become an open proxy.
    if (!env.ALLOWED_ORIGIN || !env.APP_TOKEN || String(env.APP_TOKEN).length < 16) return reply({ error: 'Connector not configured: set ALLOWED_ORIGIN and an APP_TOKEN of 16+ characters.' }, 500);
    if (req.headers.get('Origin') !== env.ALLOWED_ORIGIN) return reply({ error: 'Origin not allowed' }, 403);
    if (!sameToken(req.headers.get('X-App-Token') || '', env.APP_TOKEN)) return reply({ error: 'Invalid app token' }, 401);
    if (Number(req.headers.get('Content-Length') || 0) > 8192) return reply({ error: 'Request too large' }, 413);

    let body; try { body = await req.json(); } catch { return reply({ error: 'Invalid JSON' }, 400); }
    const auth0 = 'Basic ' + btoa(`${env.RAVELRY_USER}:${env.RAVELRY_PASS}`);
    // Yarn search: {action:'yarns', query:'knitting for olive'} -> Ravelry's yarn database
    if (body.action === 'yarns') {
      const q = String(body.query || '').trim().slice(0, 80);
      if (q.length < 2) return reply({ error: 'Type at least 2 letters.' }, 400);
      const r = await fetch(`${API}/yarns/search.json?query=${encodeURIComponent(q)}&page_size=25&sort=best`, { headers: { Authorization: auth0 } });
      if (!r.ok) return reply({ error: `Ravelry yarn search failed (${r.status}).` }, 502);
      const j = await r.json();
      return reply({ yarns: (j.yarns || []).filter(y => !y.discontinued).map(y => ({
        name: `${y.yarn_company_name || ''} ${y.name || ''}`.trim().slice(0, 80),
        weight: y.yarn_weight?.name || '', yards: Number.isFinite(y.yardage) ? y.yardage : null,
        grams: Number.isFinite(y.grams) ? y.grams : null, machineWashable: !!y.machine_washable,
        url: y.permalink ? `https://www.ravelry.com/yarns/library/${y.permalink}` : ''
      })) });
    }
    const username = String(body.username || '').trim();
    if (!/^[A-Za-z0-9_\-.]{1,40}$/.test(username)) return reply({ error: 'Enter a valid Ravelry username.' }, 400);

    // Stash: {action:'stash', username} -> the user's Ravelry stash with skeins, yardage and colorway
    if (body.action === 'stash') {
      const H = { headers: { Authorization: auth0 } }, u = encodeURIComponent(username);
      try {
        const ids = [];
        for (let page = 1; page <= 5; page++) {
          const r = await fetch(`${API}/people/${u}/stash/list.json?page_size=100&page=${page}`, H);
          if (r.status === 404 || r.status === 403) return reply({ error: 'Ravelry stash not found or private.' }, 404);
          if (!r.ok) return reply({ error: `Ravelry stash error (${r.status}).` }, 502);
          const j = await r.json();
          for (const st of j.stash || []) if (Number.isInteger(st.id)) ids.push(st.id);
          if (!j.paginator || page >= j.paginator.last_page) break;
        }
        const out = [];
        for (let i = 0; i < Math.min(ids.length, 300); i += 10) { // details in small parallel batches
          const batch = await Promise.all(ids.slice(i, i + 10).map(id => fetch(`${API}/people/${u}/stash/${id}.json`, H).then(r => r.ok ? r.json() : null).catch(() => null)));
          for (const j of batch) {
            const st = j?.stash; if (!st) continue;
            const y = st.yarn || {}, pk = (st.packs || [])[0] || {};
            if (st.status_name && /used up|gifted|traded|sold/i.test(st.status_name)) continue;
            const skeins = (st.packs || []).reduce((t, k) => t + (Number(k.skeins) || 0), 0);
            out.push({
              id: st.id,
              name: `${y.yarn_company_name || st.yarn_company_name || ''} ${y.name || st.name || ''}`.trim().slice(0, 80),
              weight: y.yarn_weight?.name || pk.yarn_weight?.name || '',
              yards: Number(pk.yards_per_skein) || Number(y.yardage) || (skeins && Number(pk.total_yards) ? Number(pk.total_yards) / skeins : null),
              skeins: skeins || null,
              totalYards: (st.packs || []).reduce((t, k) => t + (Number(k.total_yards) || 0), 0) || null,
              color: String(st.colorway_name || pk.colorway || '').slice(0, 60)
            });
          }
        }
        return reply({ stash: out, truncated: ids.length > 300 });
      } catch { return reply({ error: 'Could not reach Ravelry.' }, 502); }
    }

    const auth = 'Basic ' + btoa(`${env.RAVELRY_USER}:${env.RAVELRY_PASS}`);
    const get = async path => {
      const r = await fetch(API + path, { headers: { Authorization: auth } });
      if (r.status === 404) throw Object.assign(Error('Ravelry user not found, or their favorites are private.'), { code: 404 });
      if (r.status === 401 || r.status === 403) throw Object.assign(Error('Ravelry refused access. Check the connector credentials, and that favorites are visible to you.'), { code: 502 });
      if (!r.ok) throw Object.assign(Error(`Ravelry error (${r.status}).`), { code: 502 });
      return r.json();
    };

    try {
      const want = body.include === 'favorites' || body.include === 'library' ? body.include : 'both';
      const from = new Map(); // pattern id -> Set('favorite','library')
      const mark = (id, tag) => { if (!Number.isInteger(id)) return; if (!from.has(id)) from.set(id, new Set()); from.get(id).add(tag); };
      const user = encodeURIComponent(username);
      // 1a. favorited patterns (up to 1000)
      if (want !== 'library') for (let page = 1; page <= 10; page++) {
        const j = await get(`/people/${user}/favorites/list.json?types=pattern&page_size=100&page=${page}`);
        for (const f of j.favorites || []) mark(f.favorited?.id, 'favorite');
        if (!j.paginator || page >= j.paginator.last_page) break;
      }
      // 1b. patterns in their Ravelry library (purchased / saved pattern PDFs; up to 1000)
      let libraryNote = '';
      if (want !== 'favorites') {
        try {
          for (let page = 1; page <= 10; page++) {
            const j = await get(`/people/${user}/library/search.json?page_size=100&page=${page}`);
            for (const v of j.volumes || []) mark(v.pattern_id, 'library');
            if (!j.paginator || page >= j.paginator.last_page) break;
          }
        } catch (e) { if (e.code === 404) libraryNote = 'Library is private or empty, so only favorites were imported.'; else throw e; }
      }
      const ids = [...from.keys()].slice(0, 1500);
      // 2. full pattern details in batches
      const out = [];
      for (let i = 0; i < ids.length; i += 50) {
        const j = await get(`/patterns.json?ids=${ids.slice(i, i + 50).join('+')}`);
        for (const p of Object.values(j.patterns || {})) {
          out.push({
            id: p.id,
            from: [...(from.get(p.id) || [])],
            name: String(p.name || 'Untitled').slice(0, 100),
            weight: p.yarn_weight?.name || p.yarn_weight_description || '',
            yardsMin: Number.isFinite(p.yardage) ? p.yardage : null,
            yardsMax: Number.isFinite(p.yardage_max) ? p.yardage_max : null,
            yardageNote: String(p.yardage_description || '').slice(0, 200),
            sizes: String(p.sizes_available || '').slice(0, 200),
            designer: String(p.pattern_author?.name || '').slice(0, 100),
            url: `https://www.ravelry.com/patterns/library/${p.permalink}`,
            yarns: (p.packs || []).map(k => [k.yarn?.yarn_company_name, k.yarn?.name || k.yarn_name].filter(Boolean).join(' ')).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).map(v => v.slice(0, 80)),
            photo: p.photos?.[0]?.small_url || p.photos?.[0]?.square_url || ''
          });
        }
      }
      return reply({ patterns: out, note: libraryNote });
    } catch (e) {
      return reply({ error: e.code ? e.message : 'Could not reach Ravelry.' }, e.code || 502);
    }
  }
};
