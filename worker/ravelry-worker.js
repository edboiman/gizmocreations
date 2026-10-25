// Bow & Purl Ravelry connector — Cloudflare Worker.
// Reads a Ravelry user's favorited patterns AND the single patterns in their Ravelry library, and returns name, yarn weight, yardage and link.
//
// Variables (Cloudflare dashboard → Worker → Settings → Variables):
//   RAVELRY_USER   (secret)  "Username" from your Ravelry read-only API credentials
//   RAVELRY_PASS   (secret)  "Password" from those credentials (NOT your Ravelry login password)
//   ALLOWED_ORIGIN           e.g. https://yourname.github.io
//   APP_TOKEN      (secret)  any random phrase; enter the same value in the app
// Get credentials at https://www.ravelry.com/pro/developer → create app → "Basic Auth: read only".

const API = 'https://api.ravelry.com';

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
      'Content-Type': 'application/json'
    };
    const reply = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: cors });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
    if (env.ALLOWED_ORIGIN && req.headers.get('Origin') !== env.ALLOWED_ORIGIN) return reply({ error: 'Origin not allowed' }, 403);
    if (!env.APP_TOKEN || req.headers.get('X-App-Token') !== env.APP_TOKEN) return reply({ error: 'Invalid app token' }, 401);

    let body; try { body = await req.json(); } catch { return reply({ error: 'Invalid JSON' }, 400); }
    const username = String(body.username || '').trim();
    if (!/^[A-Za-z0-9_\-.]{1,40}$/.test(username)) return reply({ error: 'Enter a valid Ravelry username.' }, 400);

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
