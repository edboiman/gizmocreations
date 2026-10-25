// Bow & Purl AI connector — Cloudflare Worker (free tier is fine).
// Turns a plain-language prompt into chart rows using Claude (default) or OpenAI.
//
// Secrets / variables (Cloudflare dashboard → Worker → Settings → Variables):
//   ANTHROPIC_API_KEY  (secret)  required when PROVIDER is "anthropic" (default)
//   OPENAI_API_KEY     (secret)  required when PROVIDER is "openai"
//   PROVIDER           "anthropic" or "openai"          (optional, default anthropic)
//   MODEL              model name                        (optional for anthropic, required for openai)
//   ALLOWED_ORIGIN     e.g. https://yourname.github.io   (required)
//   APP_TOKEN          (secret) random string, 16+ chars (required; enter the same value in the app's AI settings)
// Add a Cloudflare rate-limiting rule as well to cap spend.

const SYSTEM = `You design two- or three-color stranded knitting charts.
Return ONLY JSON: {"rows":["...","..."]}.
Each row is a string of the same length using 0 (background), 1 (main color), 2 (accent color).
Row 0 of the array is the TOP of the chart. Keep shapes bold and readable at small sizes,
avoid single isolated stitches where possible, and avoid color runs longer than 7 stitches.
Designs must be original: do not reproduce trademarked logos, emblems or copyrighted characters;
if asked for one, create an original design in a similar spirit instead.`;


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
    const reply = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: cors });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
    // Fail closed: both settings are required, so a misconfigured Worker can't become an open proxy.
    if (!env.ALLOWED_ORIGIN || !env.APP_TOKEN || String(env.APP_TOKEN).length < 16) return reply({ error: 'Connector not configured: set ALLOWED_ORIGIN and an APP_TOKEN of 16+ characters.' }, 500);
    if (req.headers.get('Origin') !== env.ALLOWED_ORIGIN) return reply({ error: 'Origin not allowed' }, 403);
    if (!sameToken(req.headers.get('X-App-Token') || '', env.APP_TOKEN)) return reply({ error: 'Invalid app token' }, 401);
    if (Number(req.headers.get('Content-Length') || 0) > 8192) return reply({ error: 'Request too large' }, 413);

    let body;
    try { body = await req.json(); } catch { return reply({ error: 'Invalid JSON' }, 400); }
    const prompt = String(body.prompt || '').slice(0, 400).trim();
    const cols = Math.min(60, Math.max(8, parseInt(body.cols) || 24));
    const rows = Math.min(60, Math.max(8, parseInt(body.rows) || 24));
    if (!prompt) return reply({ error: 'Describe what you want to knit.' }, 400);
    const user = `Design a motif about ${cols} stitches wide and at most ${rows} rows tall for: ${prompt}`;

    try {
      let text;
      if ((env.PROVIDER || 'anthropic') === 'openai') {
        if (!env.MODEL) return reply({ error: 'Set MODEL for the OpenAI provider.' }, 500);
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: env.MODEL, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] })
        });
        const j = await r.json();
        if (!r.ok) return reply({ error: 'AI provider error' }, 502);
        text = j.choices?.[0]?.message?.content || '';
      } else {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: env.MODEL || 'claude-sonnet-5-5', max_tokens: 4000, system: SYSTEM, messages: [{ role: 'user', content: user }] })
        });
        const j = await r.json();
        if (!r.ok) return reply({ error: 'AI provider error' }, 502);
        text = (j.content || []).map(c => c.text || '').join('');
      }
      const match = text.match(/\{[\s\S]*\}/);
      const out = match ? JSON.parse(match[0]) : null;
      const valid = out && Array.isArray(out.rows) && out.rows.length && out.rows.length <= rows &&
        out.rows.every(s => typeof s === 'string' && /^[012]+$/.test(s) && s.length <= cols && s.length === out.rows[0].length);
      if (!valid) return reply({ error: 'The AI returned an unusable chart. Try rewording.' }, 502);
      return reply({ rows: out.rows });
    } catch {
      return reply({ error: 'AI request failed.' }, 502);
    }
  }
};
