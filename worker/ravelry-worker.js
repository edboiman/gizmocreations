// Bow & Purl Ravelry connector — Cloudflare Worker.
// Reads a Ravelry user's favorited patterns and returns name, yarn weight, yardage and link.
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
      // 1. favorited pattern ids (up to 500)
      const ids = [];
      for (let page = 1; page <= 5; page++) {
        const j = await get(`/people/${encodeURIComponent(username)}/favorites/list.json?types=pattern&page_size=100&page=${page}`);
        for (const f of j.favorites || []) if (f.favorited?.id) ids.push(f.favorited.id);
        if (!j.paginator || page >= j.paginator.last_page) break;
      }
      // 2. full pattern details in batches
      const out = [];
      for (let i = 0; i < ids.length; i += 50) {
        const j = await get(`/patterns.json?ids=${ids.slice(i, i + 50).join('+')}`);
        for (const p of Object.values(j.patterns || {})) {
          out.push({
            id: p.id,
            name: String(p.name || 'Untitled').slice(0, 100),
            weight: p.yarn_weight?.name || p.yarn_weight_description || '',
            yardsMin: Number.isFinite(p.yardage) ? p.yardage : null,
            yardsMax: Number.isFinite(p.yardage_max) ? p.yardage_max : null,
            yardageNote: String(p.yardage_description || '').slice(0, 200),
            sizes: String(p.sizes_available || '').slice(0, 200),
            designer: String(p.pattern_author?.name || '').slice(0, 100),
            url: `https://www.ravelry.com/patterns/library/${p.permalink}`,
            photo: p.photos?.[0]?.small_url || p.photos?.[0]?.square_url || ''
          });
        }
      }
      return reply({ patterns: out });
    } catch (e) {
      return reply({ error: e.code ? e.message : 'Could not reach Ravelry.' }, e.code || 502);
    }
  }
};
