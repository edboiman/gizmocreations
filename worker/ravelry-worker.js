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


function sameToken(a,b) { a=String(a);b=String(b);if(a.length>512)return false;let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0; }
async function limitedJSON(req) {
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('Content-Type')||''))throw Object.assign(Error('Send application/json.'),{status:415});
  if(Number(req.headers.get('Content-Length')||0)>8192)throw Object.assign(Error('Request too large.'),{status:413});
  const reader=req.body?.getReader();if(!reader)throw Object.assign(Error('Invalid JSON object.'),{status:400});
  const chunks=[];let length=0;
  try{while(true){const{done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();throw Object.assign(Error('Request too large.'),{status:413});}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Object.assign(Error('Invalid JSON object.'),{status:400});}
  if(!body||typeof body!=='object'||Array.isArray(body))throw Object.assign(Error('Invalid JSON object.'),{status:400});return body;
}

// Unknown quantities stay null. Partial pack totals must not look complete.
function stashAmounts(st) {
  const packs = Array.isArray(st.packs) ? st.packs : [];
  const number = v => v == null || String(v).trim() === '' || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v);
  const catalog = number(st.yarn?.yardage);
  const rows = packs.map(p => ({ skeins:number(p?.skeins), yards:number(p?.yards_per_skein) || catalog || null, total:number(p?.total_yards) }));
  const sumKnown = values => values.length && values.every(v => v != null) ? values.reduce((a,b) => a+b,0) : null;
  const skeins = sumKnown(rows.map(p => p.skeins));
  const totalYards = sumKnown(rows.map(p => p.total ?? (p.skeins != null && p.yards != null ? p.skeins*p.yards : null)));
  const per = rows.map(p => p.yards ?? (p.skeins > 0 && p.total != null ? p.total / p.skeins : null));
  const yards = !rows.length ? catalog : per.every(v => v > 0 && v === per[0]) ? per[0] : null;
  return { yards, skeins, totalYards };
}

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
    if (req.method !== 'POST' && req.method !== 'OPTIONS') return reply({ error: 'POST only' }, 405);
    // Fail closed: both settings are required, so a misconfigured Worker can't become an open proxy.
    if (!env.ALLOWED_ORIGIN || !env.APP_TOKEN || (String(env.APP_TOKEN).length < 16 || String(env.APP_TOKEN).length > 512)) return reply({ error: 'Connector not configured: set ALLOWED_ORIGIN and an APP_TOKEN of 16+ characters.' }, 500);
    if (req.headers.get('Origin') !== env.ALLOWED_ORIGIN) return reply({ error: 'Origin not allowed' }, 403);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (!sameToken(req.headers.get('X-App-Token') || '', env.APP_TOKEN)) return reply({ error: 'Invalid app token' }, 401);
    let body; try { body = await limitedJSON(req); } catch(e) { return reply({error:e.status?e.message:'Invalid request.'},e.status||400); }
    if (!env.RAVELRY_USER || !env.RAVELRY_PASS) return reply({error:'Set RAVELRY_USER and RAVELRY_PASS in Worker secrets.'},500);
    if (body.action !== undefined && !['yarns','stash'].includes(body.action)) return reply({error:'Unknown action.'},400);
    const deadline=Date.now()+70000;
    const fetchAPI=async (url,options) => { const remaining=Math.min(15000,deadline-Date.now());if(remaining<=0)throw Error('Ravelry import timed out.');return fetch(url,{...options,signal:AbortSignal.timeout(remaining)}); };
    const auth0 = 'Basic ' + btoa(`${env.RAVELRY_USER}:${env.RAVELRY_PASS}`);
    // Yarn search: {action:'yarns', query:'knitting for olive'} -> Ravelry's yarn database
    if (body.action === 'yarns') {
      const q = String(body.query || '').trim().slice(0, 80);
      if (q.length < 2) return reply({ error: 'Type at least 2 letters.' }, 400);
      try {
      const r = await fetchAPI(`${API}/yarns/search.json?query=${encodeURIComponent(q)}&page_size=25&sort=best`, { headers: { Authorization: auth0 } });
      if (!r.ok) return reply({ error: `Ravelry yarn search failed (${r.status}).` }, 502);
      const j = await r.json();
      return reply({ yarns: (j.yarns || []).filter(y => !y.discontinued).map(y => ({
        name: `${y.yarn_company_name || ''} ${y.name || ''}`.trim().slice(0, 80),
        weight: y.yarn_weight?.name || '', yards: Number.isFinite(y.yardage) ? y.yardage : null,
        grams: Number.isFinite(y.grams) ? y.grams : null, machineWashable: !!y.machine_washable,
        url: y.permalink ? `https://www.ravelry.com/yarns/library/${y.permalink}` : ''
      })) });
      } catch { return reply({error:'Could not reach Ravelry yarn search. Try again.'},502); }
    }
    const username = String(body.username || '').trim();
    if (!/^[A-Za-z0-9_\-.]{1,40}$/.test(username)) return reply({ error: 'Enter a valid Ravelry username.' }, 400);

    if (env.ALLOWED_USERNAME && username.toLowerCase() !== String(env.ALLOWED_USERNAME).toLowerCase()) return reply({error:'This connector is restricted to its configured Ravelry username.'},403);

    // Stash: {action:'stash', username} -> the user's Ravelry stash with skeins, yardage and colorway
    if (body.action === 'stash') {
      const H = { headers: { Authorization: auth0 } }, u = encodeURIComponent(username);
      try {
        const ids = []; let listTruncated = false;
        for (let page = 1; page <= 5; page++) {
          const r = await fetchAPI(`${API}/people/${u}/stash/list.json?page_size=100&page=${page}`, H);
          if (r.status === 401) return reply({ error: 'Ravelry rejected the connector credentials (RAVELRY_USER / RAVELRY_PASS).' }, 502);
          if (r.status === 403) return reply({ error: 'Ravelry did not allow this stash request. Check the connector’s API permissions and the username. Keep private data private; you can add yarn locally instead.' }, 403);
          if (r.status === 404) return reply({ error: 'Ravelry could not find that username, or its stash is private. Check the spelling in Pattern library, and your stash privacy setting.' }, 404);
          if (!r.ok) return reply({ error: `Ravelry stash error (${r.status}).` }, 502);
          const j = await r.json();
          for (const st of j.stash || []) if (Number.isInteger(st.id)) ids.push(st.id);
          if (page===5 && j.paginator?.last_page>page) listTruncated=true;
          if (!j.paginator || page >= j.paginator.last_page) break;
        }
        const uniqueIds=[...new Set(ids)];
        const out = []; let failedDetails = 0;
        for (let i = 0; i < Math.min(uniqueIds.length, 300); i += 10) { // details in small parallel batches
          const batch = await Promise.all(uniqueIds.slice(i, i + 10).map(id => fetchAPI(`${API}/people/${u}/stash/${id}.json`, H).then(r => r.ok ? r.json() : null).catch(() => null)));
          for (const j of batch) {
            const st = j?.stash; if (!st) { failedDetails++; continue; }
            const y = st.yarn || {}, pk = (st.packs || [])[0] || {};
            const stat = st.stash_status?.name || st.status_name || '';
            const unavailable=/used up|gifted|traded|sold/i.test(stat);
            const amounts = stashAmounts(st);
            out.push({
              id: st.id,
              name: `${y.yarn_company_name || st.yarn_company_name || ''} ${y.name || st.name || ''}`.trim().slice(0, 80),
              weight: y.yarn_weight?.name || pk.yarn_weight?.name || '',
              ...amounts,
              unavailable, status:String(stat).slice(0,80),
              color: String(st.colorway_name || pk.colorway || '').slice(0, 60)
            });
          }
        }
        return reply({ stash: out, truncated: listTruncated || uniqueIds.length > 300, failedDetails });
      } catch { return reply({ error: 'Could not reach Ravelry.' }, 502); }
    }

    const auth = 'Basic ' + btoa(`${env.RAVELRY_USER}:${env.RAVELRY_PASS}`);
    const get = async path => {
      const r = await fetchAPI(API + path, { headers: { Authorization: auth } });
      if (r.status === 404) throw Object.assign(Error('Ravelry user not found, or their favorites are private.'), { code: 404 });
      if (r.status === 401 || r.status === 403) throw Object.assign(Error('Ravelry refused access. Check the connector credentials, and that favorites are visible to you.'), { code: 502 });
      if (!r.ok) throw Object.assign(Error(`Ravelry error (${r.status}).`), { code: 502 });
      return r.json();
    };

    try {
      const want = body.include === 'favorites' || body.include === 'library' ? body.include : 'both';
      let listTruncated=false;
      const from = new Map(); // pattern id -> Set('favorite','library')
      const mark = (id, tag) => { if (!Number.isInteger(id)) return; if (!from.has(id)) from.set(id, new Set()); from.get(id).add(tag); };
      const user = encodeURIComponent(username);
      // 1a. favorited patterns (up to 1000)
      if (want !== 'library') for (let page = 1; page <= 10; page++) {
        const j = await get(`/people/${user}/favorites/list.json?types=pattern&page_size=100&page=${page}`);
        for (const f of j.favorites || []) mark(f.favorited?.id, 'favorite');
        if(page===10 && j.paginator?.last_page>page)listTruncated=true;
        if (!j.paginator || page >= j.paginator.last_page) break;
      }
      // 1b. patterns in their Ravelry library (purchased / saved pattern PDFs; up to 1000)
      let libraryNote = '';
      if (want !== 'favorites') {
        try {
          for (let page = 1; page <= 10; page++) {
            const j = await get(`/people/${user}/library/search.json?page_size=100&page=${page}`);
            for (const v of j.volumes || []) mark(v.pattern_id, 'library');
            if(page===10 && j.paginator?.last_page>page)listTruncated=true;
            if (!j.paginator || page >= j.paginator.last_page) break;
          }
        } catch (e) { if (e.code === 404) libraryNote = want === 'library' ? 'The library was not available to this connector.' : 'The library was not available; only favorites were imported.'; else throw e; }
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
      return reply({ patterns: out, note: libraryNote, truncated:listTruncated || from.size>1500 });
    } catch (e) {
      return reply({ error: e.code ? e.message : 'Could not reach Ravelry.' }, e.code || 502);
    }
  }
};
