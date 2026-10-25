'use strict';
// Yarn brands, stash and prices. Loaded after app.js and shares its globals (weights, patterns, $, notify…).
//
// YARN_BRANDS: widely sold yarns for each standard weight. Yardage is per skein from the usual put-up;
// prices are rough 2026 US retail estimates (USD per skein). Always check the ball band and your shop.
// [brand, yarn, yards per skein, fiber, est. USD per skein]. Values marked in README as approximate;
// Knitting for Olive Merino (273 yd) and Heavy Merino (136 yd) confirmed from retailer listings, Oct 2026.
const YARN_BRANDS = {
  '0 • Lace': [
    ['Knitting for Olive', 'Soft Silk Mohair', 245, 'Mohair / silk', 16], ['Malabrigo', 'Lace', 470, 'Merino', 15],
    ['Knit Picks', 'Shadow', 440, 'Merino', 8], ['Drops', 'Kid-Silk', 229, 'Mohair / silk', 7], ['Sandnes Garn', 'Tynn Silk Mohair', 232, 'Mohair / silk', 13],
    ['Isager', 'Silk Mohair', 232, 'Mohair / silk', 16], ['Rowan', 'Kidsilk Haze', 229, 'Mohair / silk', 15], ['Lana Grossa', 'Silkhair', 229, 'Mohair / silk', 12],
    ['La Bien Aimée', 'Mohair Silk', 459, 'Mohair / silk', 32], ['Cascade', 'Heritage Silk Lace', 875, 'Merino / silk', 16]],
  '1 • Super fine / Fingering': [
    ['Knitting for Olive', 'Merino', 273, 'Merino', 10.5], ['Knitting for Olive', 'Pure Silk', 273, 'Silk', 22], ['Knitting for Olive', 'Compatible Cashmere', 273, 'Cashmere', 24],
    ['Malabrigo', 'Sock', 440, 'Merino', 20], ['Madelinetosh', 'Tosh Merino Light', 420, 'Merino', 27], ['Hedgehog Fibres', 'Sock', 437, 'Merino / nylon', 32],
    ['La Bien Aimée', 'Merino Singles', 400, 'Merino', 32], ['Miss Babs', 'Yummy 2-Ply', 400, 'Merino', 30], ['Neighborhood Fiber Co', 'Studio Sock', 400, 'Merino', 30],
    ['Qing Fibre', 'Merino Singles', 366, 'Merino', 30], ['Spincycle', 'Dream State', 465, 'Wool / mohair', 32], ['Brooklyn Tweed', 'Loft', 275, 'Wool', 18],
    ['Sandnes Garn', 'Sunday', 257, 'Merino', 9], ['Sandnes Garn', 'Tynn Peer Gynt', 224, 'Wool', 8], ['Drops', 'Alpaca', 182, 'Alpaca', 4], ['Drops', 'Fabel', 224, 'Wool / nylon', 3.5],
    ['Holst Garn', 'Supersoft', 314, 'Wool', 6], ['Rauma', 'Finull', 191, 'Wool', 7], ['Biches & Bûches', 'Le Petit Lambswool', 284, 'Lambswool', 14],
    ['Jamieson & Smith', '2 Ply Jumper Weight', 125, 'Shetland wool', 6], ['Jamieson’s', 'Spindrift', 115, 'Shetland wool', 6], ['Tukuwool', 'Fingering', 191, 'Wool', 9],
    ['Cascade', 'Heritage', 437, 'Merino / nylon', 15], ['Knit Picks', 'Stroll', 231, 'Merino / nylon', 7], ['Knit Picks', 'Palette', 231, 'Wool', 4.5],
    ['Lang', 'Jawoll', 230, 'Wool / nylon', 9], ['West Yorkshire Spinners', 'Signature 4 Ply', 437, 'Wool / nylon', 16], ['Regia', '4-fädig', 459, 'Wool / nylon', 12]],
  '2 • Fine / Sport': [
    ['Drops', 'Baby Merino', 191, 'Merino', 5], ['Sandnes Garn', 'Tynn Merinoull', 191, 'Merino', 8], ['Knit Picks', 'Brava Sport', 273, 'Acrylic', 4],
    ['Cascade', '220 Sport', 164, 'Wool', 8], ['Berroco', 'Ultra Wool Fine', 433, 'Wool', 16], ['Brooklyn Tweed', 'Peerie', 210, 'Merino', 14],
    ['Biches & Bûches', 'Le Gros Lambswool', 185, 'Lambswool', 16], ['Purl Soho', 'Linen Quill', 439, 'Wool / alpaca / linen', 26]],
  '3 • Light / DK': [
    ['Paintbox', 'Simply DK', 302, 'Acrylic', 4], ['Rowan', 'Felted Tweed', 191, 'Wool / alpaca / viscose', 15], ['Lion Brand', 'Coboo', 232, 'Cotton / bamboo', 8],
    ['Knit Picks', 'Swish DK', 123, 'Superwash merino', 5], ['West Yorkshire Spinners', 'Bo Peep DK', 245, 'Wool / nylon', 14],
    ['Drops', 'Karisma', 109, 'Wool', 3.5], ['Drops', 'Merino Extra Fine', 115, 'Merino', 4.5], ['Sandnes Garn', 'Double Sunday', 118, 'Merino', 9], ['Sandnes Garn', 'Peer Gynt', 98, 'Wool', 8],
    ['Brooklyn Tweed', 'Arbor', 145, 'Wool', 14], ['Woolfolk', 'Får', 142, 'Merino', 22], ['Malabrigo', 'Arroyo', 335, 'Superwash merino', 18],
    ['Hedgehog Fibres', 'Skinny Singles', 400, 'Merino', 32], ['De Rerum Natura', 'Gilliatt', 273, 'Merino', 22], ['Lang', 'Merino 120', 131, 'Merino', 8]],
  '4 • Medium / Worsted / Aran': [
    ['Knitting for Olive', 'Heavy Merino', 136, 'Merino', 10.5], ['Cascade', '220', 220, 'Wool', 11], ['Malabrigo', 'Rios', 210, 'Superwash merino', 18], ['Malabrigo', 'Worsted', 210, 'Merino', 17],
    ['Brooklyn Tweed', 'Shelter', 140, 'Wool', 14], ['Madelinetosh', 'Tosh Vintage', 200, 'Superwash merino', 28], ['Drops', 'Nepal', 82, 'Wool / alpaca', 4],
    ['Purl Soho', 'Worsted Twist', 164, 'Merino', 22], ['Plymouth', 'Encore', 200, 'Acrylic / wool', 7], ['Lion Brand', 'Wool-Ease', 197, 'Acrylic / wool', 6.5],
    ['Red Heart', 'Super Saver', 364, 'Acrylic', 5], ['Knit Picks', 'Wool of the Andes', 110, 'Wool', 4], ['Berroco', 'Vintage', 217, 'Acrylic / wool / nylon', 10],
    ['Lion Brand', 'Pound of Love', 1020, 'Acrylic', 12], ['Hobbii', 'Rainbow Cotton 8/8', 87, 'Cotton', 2.5]],
  '5 • Bulky': [
    ['Malabrigo', 'Chunky', 104, 'Merino', 16], ['Cascade', '128 Superwash', 128, 'Superwash wool', 11], ['Lion Brand', 'Hue + Me', 137, 'Acrylic / wool', 7], ['Bernat', 'Softee Chunky', 108, 'Acrylic', 5],
    ['Drops', 'Andes', 98, 'Wool / alpaca', 7], ['Brooklyn Tweed', 'Quarry', 200, 'Wool', 22], ['Sandnes Garn', 'Alpakka Ull', 109, 'Alpaca / wool', 9]],
  '6 • Super bulky': [
    ['Lion Brand', 'Wool-Ease Thick & Quick', 106, 'Acrylic / wool', 9], ['Malabrigo', 'Rasta', 90, 'Merino', 19], ['Bernat', 'Blanket', 220, 'Polyester', 10],
    ['Wool and the Gang', 'Crazy Sexy Wool', 87, 'Wool', 30], ['We Are Knitters', 'The Wool', 87, 'Wool', 28], ['Drops', 'Polaris', 40, 'Wool', 6], ['Drops', 'Snow', 54, 'Wool', 4]],
  '7 • Jumbo': [
    ['Bernat', 'Blanket Extra Thick', 72, 'Polyester', 13], ['Lion Brand', 'Go For Faux Thick & Quick', 24, 'Polyester', 10]]
};

// Average price per yard by weight, 2026 US (Midwest) estimate, in three tiers.
const DEFAULT_PRICES = {
  '0 • Lace': [0.012, 0.03, 0.06], '1 • Super fine / Fingering': [0.02, 0.04, 0.07], '2 • Fine / Sport': [0.02, 0.045, 0.08],
  '3 • Light / DK': [0.02, 0.05, 0.09], '4 • Medium / Worsted / Aran': [0.017, 0.05, 0.10], '5 • Bulky': [0.04, 0.08, 0.15],
  '6 • Super bulky': [0.07, 0.10, 0.20], '7 • Jumbo': [0.12, 0.18, 0.30], 'Unspecified': [0.02, 0.05, 0.09]
};
const TIERS = ['Budget (acrylic)', 'Mid (wool / blends)', 'Premium (indie, merino)'];

let prices = readStorage('bow-purl-prices', null);
if (!prices || typeof prices.perYard !== 'object') prices = { perYard: structuredClone(DEFAULT_PRICES), custom: [], tier: 1, source: 'Built-in 2026 US Midwest estimates' };
let myYarns = readStorage('bow-purl-yarns', []);
if (!Array.isArray(myYarns)) myYarns = [];
myYarns = myYarns.filter(y => y && typeof y.name === 'string' && y.name.length <= 80 && weights.includes(y.weight) && y.yards > 0 && y.yards < 10000).slice(0, 300);
let stash = readStorage('bow-purl-stash', []);
if (!Array.isArray(stash)) stash = [];
const money = n => '$' + (n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(2));

// ---------- helpers other screens use ----------
function brandsFor(weight) { // yarns you've saved first, then the built-in list
  return [...myYarns.filter(y => y.weight === weight).map(y => [y.name, '', y.yards, '', 0]), ...(YARN_BRANDS[weight] || [])];
}
function brandText(weight, n = 3) { return brandsFor(weight).slice(0, n).map(r => `${r[0]} ${r[1]}`.trim()).join(', '); }
function pricePerYard(weight, brandLine) {
  if (brandLine) { const c = prices.custom.find(c => c.name.toLowerCase() === brandLine.toLowerCase()); if (c && c.yards) return c.price / c.yards; }
  return (prices.perYard[weight] || DEFAULT_PRICES.Unspecified)[prices.tier];
}
function costText(weight, lo, hi, brandLine) {
  if (lo == null) return '';
  const p = pricePerYard(weight, brandLine), a = lo * p, b = (hi ?? lo) * p;
  return Math.round(a) === Math.round(b) ? `≈ ${money(a)}` : `≈ ${money(a)}–${money(b)}`;
}
function yarnLines(p, parent) { // designer's yarn + other suggestions + cost, used on cards and shop rows
  if (Array.isArray(p.yarns) && p.yarns.length) textNode('span', 'Designer used: ' + p.yarns.join(', '), parent).className = 'muted';
  const alt = brandText(p.weight); if (alt) textNode('span', 'Try: ' + alt, parent).className = 'muted';
  const lo = p.yardsMin ?? p.yardsMax, hi = p.yardsMax ?? p.yardsMin, c = costText(p.weight, lo, hi);
  if (c) textNode('span', `${c} est. (${TIERS[prices.tier].split(' (')[0].toLowerCase()} yarn)`, parent).className = 'cost';
}

const RAV_W = { thread: 0, cobweb: 0, lace: 0, 'light fingering': 1, fingering: 1, sport: 2, dk: 3, worsted: 4, aran: 4, bulky: 5, 'super bulky': 6, jumbo: 7 };
const ravW = n => { const k = String(n).toLowerCase().replace(/\s*\(.*\)/, '').trim(); return k in RAV_W ? weights[RAV_W[k]] : 'Unspecified'; };

// ---------- more widely sold yarns (big-box and craft-store staples; approximate) ----------
const MORE_YARNS = {
  '1 • Super fine / Fingering': [['Lion Brand', 'Truboo', 241, 'Rayon from bamboo', 7], ['Patons', 'Kroy Socks', 166, 'Wool / nylon', 6], ['Premier', 'Wool Free Sock', 462, 'Acrylic / nylon', 8], ['Scheepjes', 'Stone Washed', 142, 'Cotton / acrylic', 5]],
  '2 • Fine / Sport': [['Lion Brand', 'Ice Cream', 503, 'Acrylic', 9], ['Scheepjes', 'Catona', 137, 'Cotton', 3.5], ['Patons', 'Astra', 133, 'Acrylic', 3]],
  '3 • Light / DK': [['Caron', 'Simply Soft Light', 330, 'Acrylic', 6], ['Lion Brand', 'Mandala', 590, 'Acrylic', 10], ['Bernat', 'Softee Baby', 362, 'Acrylic', 6],
    ['Loops & Threads', 'Snuggly Wuggly', 339, 'Acrylic / nylon', 6], ['Stylecraft', 'Special DK', 322, 'Acrylic', 4.5], ['Scheepjes', 'Colour Crafter', 328, 'Acrylic', 5], ['Cascade', '220 Superwash Merino', 220, 'Superwash merino', 12]],
  '4 • Medium / Worsted / Aran': [['Caron', 'Simply Soft', 315, 'Acrylic', 6], ['Caron', 'One Pound', 812, 'Acrylic', 13], ['Bernat', 'Super Value', 426, 'Acrylic', 5],
    ['Lion Brand', "Vanna's Choice", 170, 'Acrylic', 5], ['Lion Brand', 'Basic Stitch', 185, 'Acrylic', 4], ['Lion Brand', 'Heartland', 251, 'Acrylic', 6],
    ['Red Heart', 'Soft', 256, 'Acrylic', 5], ['Red Heart', 'With Love', 370, 'Acrylic', 6], ['Loops & Threads', 'Impeccable', 285, 'Acrylic', 5],
    ['Premier', 'Everyday Worsted', 180, 'Acrylic', 4.5], ['Patons', 'Classic Wool Worsted', 194, 'Wool', 8], ['Lily', "Sugar'n Cream", 120, 'Cotton', 3],
    ['Knit Picks', 'Brava Worsted', 218, 'Acrylic', 4], ['Cascade', '220 Superwash', 220, 'Superwash wool', 12], ['Lion Brand', 'Wool-Ease Heathers', 197, 'Acrylic / wool', 6.5],
    ['Paintbox', 'Simply Aran', 197, 'Acrylic', 4.5], ['Lion Brand', 'Jeans', 246, 'Acrylic', 7]],
  '5 • Bulky': [['Lion Brand', 'Hometown', 64, 'Acrylic', 4.5], ['Caron', 'Big Cakes', 328, 'Acrylic', 11], ['Bernat', 'Softee Chunky Twist', 108, 'Acrylic', 5],
    ['Lion Brand', 'Wool-Ease Chunky', 153, 'Acrylic / wool', 8], ['Loops & Threads', 'Charisma', 109, 'Acrylic', 4.5], ['Knit Picks', 'Brava Bulky', 136, 'Acrylic', 5]],
  '6 • Super bulky': [['Bernat', 'Blanket Big Ball', 220, 'Polyester', 14], ['Lion Brand', 'Wool-Ease Thick & Quick Bonus Bundle', 212, 'Acrylic / wool', 17], ['Loops & Threads', 'Cozy Wool', 90, 'Acrylic / wool', 6], ['Red Heart', 'Grande', 46, 'Acrylic / wool', 7]],
  '7 • Jumbo': [['Bernat', 'Alize Blanket-EZ', 7, 'Polyester', 12], ['Loops & Threads', 'Chunky Wool', 20, 'Wool', 15]]
};
for (const [w, rows] of Object.entries(MORE_YARNS)) YARN_BRANDS[w].push(...rows);

// ---------- yarn menu, ordered by what you actually use ----------
const lc = s => String(s).toLowerCase().trim();
function usedYarns() { // yarns in your stash, then yarns designers used in your saved patterns (with counts)
  const stashed = new Map(), inPatterns = new Map();
  for (const s of stash) stashed.set(lc(s.brand), { name: s.brand, weight: s.weight, yards: s.yards });
  for (const p of patterns) for (const y of p.yarns || []) { const k = lc(y); if (!stashed.has(k)) { const e = inPatterns.get(k) || { name: y, weight: p.weight, count: 0 }; e.count++; inPatterns.set(k, e); } }
  return { stashed: [...stashed.values()], inPatterns: [...inPatterns.values()].sort((a, b) => b.count - a.count) };
}
function allLines() {
  const out = [], seen = new Set(), add = (l, group) => { const k = lc(l.name); if (seen.has(k)) return; seen.add(k); const b = YARN_INDEX.get(k); out.push({ ...b, ...Object.fromEntries(Object.entries(l).filter(([, v]) => v)), group }); };
  const u = usedYarns();
  u.stashed.forEach(l => add(l, 'In your stash'));
  u.inPatterns.forEach(l => add({ name: l.name, weight: l.weight }, 'Used in your patterns'));
  myYarns.forEach(l => add(l, 'Saved from Ravelry'));
  prices.custom.forEach(c => add(c, 'From your price list'));
  for (const w of weights) for (const r of YARN_BRANDS[w] || []) add({ name: `${r[0]} ${r[1]}`, weight: w, yards: r[2], fiber: r[3], price: r[4] }, w);
  return out;
}
const YARN_INDEX = new Map(); for (const [w, rows] of Object.entries(YARN_BRANDS)) for (const r of rows) YARN_INDEX.set(lc(`${r[0]} ${r[1]}`), { name: `${r[0]} ${r[1]}`, weight: w, yards: r[2], fiber: r[3], price: r[4] });
function fillBrandList() {
  const lines = allLines(), dl = $('brandList'), sel = $('yarnPick'); dl.replaceChildren(); sel.replaceChildren();
  const first = document.createElement('option'); first.value = ''; first.textContent = `Choose from ${lines.length} yarns…`; sel.append(first);
  let group = null, g;
  for (const l of lines) {
    if (l.group !== group) { group = l.group; g = document.createElement('optgroup'); g.label = /^\d •/.test(group) ? group : '★ ' + group; sel.append(g); }
    const o = document.createElement('option'); o.value = l.name; o.textContent = l.name + (l.yards ? ` · ${l.yards} yd` : ''); g.append(o);
    const d = document.createElement('option'); d.value = l.name; dl.append(d);
  }
}
// common color names; colors you've used before for a yarn are suggested first
const COMMON_COLORS = ['Natural', 'Ecru', 'Cream', 'White', 'Oatmeal', 'Light Grey', 'Charcoal', 'Black', 'Navy', 'Denim', 'Sky Blue', 'Teal', 'Forest Green', 'Sage', 'Olive', 'Mustard', 'Gold', 'Rust', 'Terracotta', 'Brick Red', 'Burgundy', 'Dusty Rose', 'Blush', 'Hot Pink', 'Lavender', 'Plum', 'Chocolate', 'Camel', 'Variegated', 'Speckled'];
function colorsFor(name) {
  const k = lc(name), mine = stash.filter(s => lc(s.brand) === k && s.color).map(s => s.color), anyMine = stash.filter(s => s.color).map(s => s.color);
  const counts = new Map(); for (const c of [...mine, ...mine, ...anyMine]) counts.set(c, (counts.get(c) || 0) + 1);
  return [...new Set([...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]), ...COMMON_COLORS])];
}
function fillColors(name) {
  const dl = $('colorList'), list = colorsFor(name); dl.replaceChildren();
  for (const c of list.slice(0, 60)) { const o = document.createElement('option'); o.value = c; dl.append(o); }
  const mine = stash.filter(s => lc(s.brand) === lc(name) && s.color);
  if (!$('stashColor').value && mine.length) $('stashColor').value = mine[mine.length - 1].color; // last color you had of this yarn
  else if (!$('stashColor').value) $('stashColor').placeholder = list[0];
}
weights.forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; $('stashWeight').append(o); }); $('stashWeight').value = weights[4];
function applyYarn(name) {
  const l = allLines().find(l => lc(l.name) === lc(name)); fillColors(name); if (!l) return;
  if (weights.includes(l.weight)) $('stashWeight').value = l.weight; if (l.yards) $('stashYards').value = l.yards;
  notify(`${l.name}: ${l.weight.replace(/^\d • /, '')}${l.yards ? `, ${l.yards} yds per skein` : ''}. Check your label.`);
}
$('stashBrand').addEventListener('change', () => applyYarn($('stashBrand').value));
$('yarnPick').onchange = () => { if (!$('yarnPick').value) return; $('stashBrand').value = $('yarnPick').value; $('stashColor').value = ''; applyYarn($('yarnPick').value); $('yarnPick').value = ''; };

// ---------- import stash from Ravelry ----------
$('stashImport').onclick = async () => {
  const conf = readStorage('bow-purl-ravelry', {});
  if (!conf.user || !/^https:\/\//i.test(conf.url || '')) { notify('Set up Ravelry first: Pattern library → Ravelry username and Connector settings.'); return; }
  const btn = $('stashImport'); btn.disabled = true; btn.textContent = 'Importing…';
  try {
    const res = await fetch(conf.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Token': conf.token || '' }, body: JSON.stringify({ action: 'stash', username: conf.user }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Error(data.error || `Stash import failed (${res.status}).`);
    if (!Array.isArray(data.stash)) throw Error('Your Ravelry connector is out of date. Redeploy worker/ravelry-worker.js.');
    const next = structuredClone(stash); let added = 0, updated = 0, skipped = 0;
    for (const r of data.stash.slice(0, 500)) {
      if (!Number.isInteger(r.id) || typeof r.name !== 'string' || !r.name.trim()) { skipped++; continue; }
      let yards = Number(r.yards), skeins = Number(r.skeins);
      if (!(skeins > 0) && Number(r.totalYards) > 0 && yards > 0) skeins = Math.round(Number(r.totalYards) / yards * 4) / 4;
      if (!(yards > 0 && yards < 10000) || !(skeins > 0 && skeins < 1000)) { skipped++; continue; } // missing quantity on Ravelry
      const item = { brand: r.name.slice(0, 80), weight: ravW(r.weight), yards: Math.round(yards), skeins: Math.round(skeins * 100) / 100, color: String(r.color || '').slice(0, 60), ravId: r.id };
      const old = next.find(s => s.ravId === r.id);
      if (old) { Object.assign(old, item); updated++; } else { next.push({ id: crypto.randomUUID(), ...item }); added++; }
    }
    if (saveStash(next)) { fillBrandList(); renderStash(); notify(`Ravelry stash: ${added} added, ${updated} updated${skipped ? `, ${skipped} skipped (no yardage or skein count on Ravelry)` : ''}${data.truncated ? '. Only the first 300 were read.' : '.'}`); }
  } catch (err) { notify(err.message); } finally { btn.disabled = false; btn.textContent = '↻ Import stash from Ravelry'; }
};

// ---------- Ravelry yarn search (uses the same connector as the pattern import) ----------
$('yarnSearch').onclick = async () => {
  const q = $('stashBrand').value.trim(), conf = readStorage('bow-purl-ravelry', {}), box = $('yarnResults');
  if (q.length < 2) { notify('Type a brand or yarn name first, e.g. Knitting for Olive.'); return; }
  if (!/^https:\/\//i.test(conf.url || '')) { notify('Ravelry yarn search uses your Ravelry connector. Set it up in Pattern library → Connector settings.'); return; }
  const btn = $('yarnSearch'); btn.disabled = true; btn.textContent = 'Searching…'; box.replaceChildren();
  try {
    const res = await fetch(conf.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Token': conf.token || '' }, body: JSON.stringify({ action: 'yarns', query: q }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Error(data.error || (res.status === 400 ? 'Your Ravelry connector is out of date. Redeploy worker/ravelry-worker.js.' : `Yarn search failed (${res.status}).`));
    const ys = (Array.isArray(data.yarns) ? data.yarns : []).filter(y => typeof y.name === 'string');
    if (!ys.length) { textNode('p', 'No yarns found on Ravelry. Try just the brand name.', box).className = 'hint'; return; }
    for (const y of ys.slice(0, 25)) {
      const w = ravW(y.weight), yd = Number(y.yards) > 0 && Number(y.yards) < 10000 ? Number(y.yards) : null;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'yarn-hit'; box.append(b);
      textNode('b', y.name.slice(0, 80), b); textNode('span', `${w.replace(/^\d • /, '')}${yd ? ` · ${yd} yds` : ''}${y.grams ? ` / ${y.grams} g` : ''}`, b);
      b.onclick = () => {
        $('stashBrand').value = y.name.slice(0, 80); if (w !== 'Unspecified') $('stashWeight').value = w; if (yd) $('stashYards').value = yd;
        if (yd && w !== 'Unspecified' && !myYarns.some(m => m.name.toLowerCase() === y.name.toLowerCase())) { myYarns = [{ name: y.name.slice(0, 80), weight: w, yards: yd }, ...myYarns].slice(0, 300); writeStorage('bow-purl-yarns', myYarns); fillBrandList(); }
        box.replaceChildren(); notify(`${y.name} filled in and saved to your yarn list.`);
      };
    }
  } catch (err) { notify(err.message); } finally { btn.disabled = false; btn.textContent = '🔍 Ravelry'; }
};

// ---------- stash ----------
function saveStash(next) { if (writeStorage('bow-purl-stash', next)) { stash = next; fillBrandList(); return true; } return false; }
$('stashForm').onsubmit = e => {
  e.preventDefault();
  const brand = $('stashBrand').value.trim().slice(0, 80), yards = Number($('stashYards').value), skeins = Number($('stashSkeins').value);
  if (!brand) { notify('Enter the yarn brand and name.'); return; }
  if (!(yards > 0 && yards < 10000) || !(skeins > 0 && skeins < 1000)) { notify('Enter yards per skein and how many skeins you have.'); return; }
  const item = { id: crypto.randomUUID(), brand, weight: $('stashWeight').value, yards, skeins, color: $('stashColor').value.trim().slice(0, 60) };
  if (saveStash([...stash, item])) { $('stashForm').reset(); $('stashWeight').value = item.weight; renderStash(); notify('Added to your stash.'); }
};
function renderStash() {
  const list = $('stashList'), out = $('stashMatches'); list.replaceChildren(); out.replaceChildren();
  if (!stash.length) { textNode('p', 'Your stash is empty. Add a yarn above to see what you can make.', list); return; }
  for (const s of stash) {
    const row = document.createElement('div'); row.className = 'stash-item'; list.append(row);
    const b = document.createElement('div'); row.append(b);
    textNode('b', s.brand + (s.color ? ' · ' + s.color : '') + (s.ravId ? ' ↻' : ''), b);
    textNode('span', `${s.weight.replace(/^\d • /, '')} · ${s.skeins} × ${s.yards} yds = ${fmt(s.skeins * s.yards)} yds`, b).className = 'muted';
    const act = document.createElement('div'); act.className = 'actions'; row.append(act);
    textNode('button', '−', act).onclick = () => { const next = structuredClone(stash), n = next.find(x => x.id === s.id); n.skeins = Math.max(0, +(n.skeins - 1).toFixed(2)); saveStash(next.filter(x => x.skeins > 0)); renderStash(); };
    textNode('button', '+', act).onclick = () => { const next = structuredClone(stash); next.find(x => x.id === s.id).skeins++; saveStash(next); renderStash(); };
    textNode('button', 'Remove', act).onclick = () => { if (confirm(`Remove ${s.brand} from your stash?`)) { saveStash(stash.filter(x => x.id !== s.id)); renderStash(); } };
  }
  // suggestions: one yarn on its own, or all yarns of a weight combined (colorwork, stripes)
  const combine = $('stashCombine').checked;
  const groups = combine ? weights.map(w => ({ label: `All your ${w.replace(/^\d • /, '')}`, weight: w, total: stash.filter(s => s.weight === w).reduce((t, s) => t + s.yards * s.skeins, 0) })).filter(g => g.total)
    : stash.map(s => ({ label: s.brand + (s.color ? ' · ' + s.color : ''), weight: s.weight, total: s.yards * s.skeins, per: s.yards }));
  let any = false;
  for (const g of groups) {
    const fits = patterns.filter(p => p.weight === g.weight && (p.yardsMin ?? p.yardsMax) != null && (p.yardsMin ?? p.yardsMax) <= g.total)
      .sort((a, b) => (b.yardsMin ?? b.yardsMax) - (a.yardsMin ?? a.yardsMax));
    const sec = document.createElement('section'); sec.className = 'panel'; out.append(sec);
    textNode('h3', `${g.label} — ${fmt(g.total)} yds`, sec);
    if (!fits.length) { textNode('p', `No patterns in your library fit ${fmt(g.total)} yds of ${g.weight.replace(/^\d • /, '')} yet.`, sec).className = 'muted'; continue; }
    any = true;
    for (const p of fits) {
      const lo = p.yardsMin ?? p.yardsMax, hi = p.yardsMax ?? lo, all = hi <= g.total;
      const r = document.createElement('div'); r.className = 'stash-match'; sec.append(r);
      const h = p.link ? textNode('a', p.name, r) : textNode('b', p.name, r); if (p.link) { h.href = p.link; h.target = '_blank'; h.rel = 'noopener noreferrer'; }
      textNode('span', `${lo === hi ? fmt(lo) : fmt(lo) + '–' + fmt(hi)} yds · ${all ? 'every size fits' : 'smaller sizes fit'} · ${fmt(g.total - lo)} yds left over at smallest size`, r).className = all ? 'ok' : 'warn';
    }
  }
  if (!any && !patterns.length) textNode('p', 'Import or add patterns in the Pattern library first, then come back here.', out).className = 'hint';
}
$('stashCombine').onchange = renderStash;

// ---------- prices ----------
function renderPrices() {
  $('priceTier').value = String(prices.tier); $('priceSource').textContent = prices.source;
  const tb = $('priceTable'); tb.replaceChildren();
  for (const w of weights.slice(0, 8)) {
    const tr = document.createElement('tr'); tb.append(tr); textNode('td', w.replace(/^\d • /, ''), tr);
    prices.perYard[w].forEach((v, i) => textNode('td', `$${v.toFixed(3)}/yd`, tr).className = i === prices.tier ? 'on' : '');
    textNode('td', money(prices.perYard[w][prices.tier] * 220), tr);
  }
  $('customCount').textContent = prices.custom.length ? `${prices.custom.length} imported yarn prices in use.` : '';
}
function savePrices() { writeStorage('bow-purl-prices', prices); renderPrices(); if (!$('library').hidden) renderLibrary(); }
$('priceTier').onchange = () => { prices.tier = Number($('priceTier').value); savePrices(); };
$('priceReset').onclick = () => { if (!confirm('Go back to the built-in price estimates? Imported prices will be removed.')) return; prices = { perYard: structuredClone(DEFAULT_PRICES), custom: [], tier: prices.tier, source: 'Built-in 2026 US Midwest estimates' }; savePrices(); fillBrandList(); };
$('priceTemplate').onclick = () => {
  const rows = [['type', 'name or weight', 'price', 'yards per skein'], ['weight', 'Fingering', '12', '400'], ['yarn', 'Cascade 220', '10.99', '220'], ['yarn', 'Malabrigo Rios', '17.50', '210']];
  download(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }), 'yarn-prices-template.csv');
};
$('priceImport').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    if (f.size > 2 * 1024 * 1024) throw Error('Price file is too large (2 MB max).');
    const lines = (await f.text()).split(/\r?\n/).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))).filter(r => r.length >= 4);
    let w = 0, y = 0; const custom = [...prices.custom], per = structuredClone(prices.perYard);
    for (const [type, name, price, yards] of lines) {
      const pr = Number(String(price).replace(/[$]/g, '')), yd = Number(yards); if (!(pr > 0 && pr < 1000 && yd > 0 && yd < 10000)) continue;
      if (/^weight$/i.test(type)) { const wt = weights.find(x => x.toLowerCase().includes(name.toLowerCase())); if (wt && wt !== 'Unspecified') { per[wt] = per[wt].slice(); per[wt][prices.tier] = pr / yd; w++; } }
      else if (/^yarn$/i.test(type) && name) { const n = name.slice(0, 80), i = custom.findIndex(c => c.name.toLowerCase() === n.toLowerCase()); const known = allLines().find(l => l.name.toLowerCase() === n.toLowerCase()); const item = { name: n, price: pr, yards: yd, weight: known?.weight || 'Unspecified' }; i >= 0 ? custom[i] = item : custom.push(item); y++; }
    }
    if (!w && !y) throw Error('No prices found. Download the template to see the format.');
    prices = { ...prices, perYard: per, custom: custom.slice(0, 500), source: `Imported ${new Date().toLocaleDateString()} (${f.name.slice(0, 40)})` };
    savePrices(); fillBrandList(); notify(`Imported ${w} weight averages and ${y} yarn prices.`);
  } catch (err) { notify(err.message); } finally { e.target.value = ''; }
};

fillBrandList(); renderPrices();
const _tab = tab; tab = id => { _tab(id); if (id === 'stash') { fillBrandList(); renderStash(); } if (id === 'prices') renderPrices(); };
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => tab(b.dataset.tab));
