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
    ['Hedgehog Fibres', 'Skinny Singles', 400, 'Superwash merino', 32], ['Knitting for Olive', 'Merino', 273, 'Merino', 10.5], ['Knitting for Olive', 'Pure Silk', 273, 'Silk', 22], ['Knitting for Olive', 'Compatible Cashmere', 273, 'Cashmere', 24],
    ['Malabrigo', 'Sock', 440, 'Merino', 20], ['Madelinetosh', 'Tosh Merino Light', 420, 'Merino', 27], ['Hedgehog Fibres', 'Sock', 437, 'Merino / nylon', 32],
    ['La Bien Aimée', 'Merino Singles', 400, 'Merino', 32], ['Miss Babs', 'Yummy 2-Ply', 400, 'Merino', 30], ['Neighborhood Fiber Co', 'Studio Sock', 400, 'Merino', 30],
    ['Qing Fibre', 'Merino Singles', 366, 'Merino', 30], ['Brooklyn Tweed', 'Loft', 275, 'Wool', 18],
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
    ['Lion Brand', 'Truboo', 241, 'Rayon from bamboo', 7], ['Paintbox', 'Simply DK', 302, 'Acrylic', 4], ['Rowan', 'Felted Tweed', 191, 'Wool / alpaca / viscose', 15], ['Lion Brand', 'Coboo', 232, 'Cotton / bamboo', 8],
    ['Knit Picks', 'Swish DK', 123, 'Superwash merino', 5], ['West Yorkshire Spinners', 'Bo Peep DK', 245, 'Wool / nylon', 14],
    ['Drops', 'Karisma', 109, 'Wool', 3.5], ['Drops', 'Merino Extra Fine', 115, 'Merino', 4.5], ['Sandnes Garn', 'Double Sunday', 118, 'Merino', 9], ['Sandnes Garn', 'Peer Gynt', 98, 'Wool', 8],
    ['Brooklyn Tweed', 'Arbor', 145, 'Wool', 14], ['Woolfolk', 'Får', 142, 'Merino', 22], ['Malabrigo', 'Arroyo', 335, 'Superwash merino', 18],
    ['De Rerum Natura', 'Gilliatt', 273, 'Merino', 22], ['Lang', 'Merino 120', 131, 'Merino', 8]],
  '4 • Medium / Worsted / Aran': [
    ['Spincycle', 'Dream State', 150, 'Superwash American wool', 32], ['Knitting for Olive', 'Heavy Merino', 136, 'Merino', 10.5], ['Cascade', '220', 220, 'Wool', 11], ['Malabrigo', 'Rios', 210, 'Superwash merino', 18], ['Malabrigo', 'Worsted', 210, 'Merino', 17],
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
// Three catalog corrections above verified with manufacturers on 2026-10-29;
// prices remain undated estimates. Other entries still require a label check.
const TIERS = ['Budget (acrylic)', 'Mid (wool / blends)', 'Premium (indie, merino)'];

function validPrices(p) {
  const metadata = m => m == null || (typeof m === 'object' && (m.checkedAt == null || validPriceDate(m.checkedAt)) && (m.source === undefined || (typeof m.source === 'string' && m.source.length <= 120)));
  if (p?.reviewedAt != null && !validPriceDate(p.reviewedAt)) return false;
  if (p?.weightMeta !== undefined && (!p.weightMeta || typeof p.weightMeta !== 'object' || Array.isArray(p.weightMeta) || !Object.entries(p.weightMeta).every(([w,rows]) => weights.includes(w) && Array.isArray(rows) && rows.length === 3 && rows.every(metadata)))) return false;
  if (Array.isArray(p?.custom) && !p.custom.every(metadata)) return false;
  return !!p && Number.isInteger(p.tier) && p.tier >= 0 && p.tier <= 2 && typeof p.source === 'string' && p.source.length <= 200 && p.perYard && weights.every(w => Array.isArray(p.perYard[w]) && p.perYard[w].length === 3 && p.perYard[w].every(n => Number.isFinite(n) && n > 0 && n < 1000)) && Array.isArray(p.custom) && p.custom.length <= 500 && p.custom.every(c => c && typeof c.name === 'string' && c.name.length <= 80 && Number.isFinite(c.price) && c.price > 0 && c.price < 1000 && Number.isFinite(c.yards) && c.yards > 0 && c.yards < 10000 && weights.includes(c.weight));
}
const validYarn = y => y && typeof y.name === 'string' && y.name.length <= 80 && weights.includes(y.weight) && Number.isFinite(y.yards) && y.yards > 0 && y.yards < 10000;
let prices = readStorage('bow-purl-prices', null);
if (!validPrices(prices)) { if(prices!==null)BPStore.flag('bow-purl-prices','Invalid saved prices were set aside.'); prices = { perYard: structuredClone(DEFAULT_PRICES), custom: [], tier: 1, source: 'Built-in 2026 US Midwest estimates' }; BPStore.stage('bow-purl-prices',prices); }
let myYarns = BPStore.loadList('bow-purl-yarns',validYarn,300);
let stash;
function validStash(s) {
  const quantity = (v, max) => v == null || (Number.isFinite(v) && v >= 0 && v < max);
  return !!s && typeof s.id === 'string' && s.id.length > 0 && s.id.length <= 100 && typeof s.brand === 'string' && s.brand.trim().length > 0 && s.brand.length <= 80 && weights.includes(s.weight) && quantity(s.yards, 10000) && quantity(s.skeins, 1000) && quantity(s.totalYards, 1000000) && optStr(s.color,60) && optStr(s.fiber,200) && optStr(s.dyeLot,80) && optStr(s.ravStatus,80) && quantity(s.priceUSD,1000) && (s.purchasedAt===undefined||s.purchasedAt===''||validPriceDate(s.purchasedAt)) && (s.ravId === undefined || Number.isInteger(s.ravId)) && (s.localQuantities === undefined || typeof s.localQuantities === 'boolean') && (s.localDetails === undefined || typeof s.localDetails === 'boolean');
}
function stashTotal(s) {
  if (s.skeins === 0) return 0;
  if (s.yards > 0 && s.skeins != null) return s.yards * s.skeins;
  return Number.isFinite(s.totalYards) ? s.totalYards : null;
}
function optionalQuantity(v, max) { if (v == null || String(v).trim() === '') return null; const n = Number(v); return Number.isFinite(n) && n >= 0 && n < max ? n : null; }
stash = BPStore.loadList('bow-purl-stash',validStash,500);
function mergeRavelryStash(current, incoming) {
  const next = structuredClone(current); let added = 0, updated = 0, skipped = 0, incomplete = 0;
  for (const r of incoming.slice(0,500)) {
    if (!r || !Number.isInteger(r.id) || typeof r.name !== 'string' || !r.name.trim()) { skipped++; continue; }
    const old = next.find(s => s.ravId === r.id);
    const yards = optionalQuantity(r.yards,10000) || null, skeins = optionalQuantity(r.skeins,1000), totalYards = optionalQuantity(r.totalYards,1000000);
    const item = { brand:r.name.slice(0,80), weight:ravW(r.weight), color:String(r.color || '').slice(0,60), ravId:r.id };
    if(old?.localDetails)Object.assign(item,{brand:old.brand,weight:old.weight,color:old.color||''});
    // Explicit local corrections take precedence; empty upstream fields never erase known amounts.
    const amounts = old?.localQuantities ? { yards:old.yards, skeins:old.skeins, totalYards:old.totalYards ?? null } : { yards:yards ?? old?.yards ?? null, skeins:skeins ?? old?.skeins ?? null, totalYards:totalYards ?? old?.totalYards ?? null };
    Object.assign(item, amounts);
    if(r.unavailable===true){item.ravStatus=String(r.status||'Unavailable').slice(0,80);if(!old?.localQuantities)Object.assign(item,{skeins:0,totalYards:0});}
    else item.ravStatus='';
    if (item.yards == null || item.skeins == null) incomplete++;
    if (old) { Object.assign(old,item); updated++; }
    else { next.push({id:newId(), ...item}); added++; }
  }
  return {next,added,updated,skipped,incomplete};
}
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);

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
  '1 • Super fine / Fingering': [['Patons', 'Kroy Socks', 166, 'Wool / nylon', 6], ['Premier', 'Wool Free Sock', 462, 'Acrylic / nylon', 8], ['Scheepjes', 'Stone Washed', 142, 'Cotton / acrylic', 5]],
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
  if (weights.includes(l.weight)) $('stashWeight').value = l.weight; if (l.yards) { $('stashYards').value = l.yards; $('stashUnit').value='yd'; } if(l.fiber)$('stashFiber').value=l.fiber;
  notify(`${l.name}: ${l.weight.replace(/^\d • /, '')}${l.yards ? `, ${l.yards} yds per skein` : ''}. Check your label.`);
}
$('stashBrand').addEventListener('change', () => applyYarn($('stashBrand').value));
$('yarnPick').onchange = () => { if (!$('yarnPick').value) return; $('stashBrand').value = $('yarnPick').value; $('stashColor').value = ''; applyYarn($('yarnPick').value); $('yarnPick').value = ''; };

// ---------- import stash from Ravelry ----------
$('stashImport').onclick = async () => {
  const conf = readStorage('bow-purl-ravelry', {}) || {};
  if (!conf.user || !connectorURL(conf.url || '')) { notify('Set up Ravelry first: Pattern library → Ravelry username and Connector settings.'); return; }
  const btn = $('stashImport'); btn.disabled = true; btn.textContent = 'Importing…';
  let res = null, data = null;
  try {
    try { ({res,data} = await connectorFetch(conf.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Token': conf.token || '' }, body: JSON.stringify({ action: 'stash', username: conf.user }) })); }
    catch (e) { throw Error(connectorError(e, null, null, 'Stash import')); }
    if (!res.ok) throw Error(connectorError(null, res, data, 'Stash import'));
    if (!Array.isArray(data.stash)) throw Error('Stash import: your Ravelry connector is out of date (it answered with patterns instead of a stash). Paste the newest worker/ravelry-worker.js into Cloudflare and click Deploy.');
    if (!data.stash.length) throw Error('Ravelry returned no stash entries. Check the username and connector access, or add yarn locally. Your existing stash was kept.');
    const { next, added, updated, skipped, incomplete } = mergeRavelryStash(stash, data.stash);
    if (saveStash(next)) { renderStash(); const message = `Ravelry stash: ${added} added, ${updated} updated. ${incomplete ? `${incomplete} entries need amount details; all were kept.` : 'Amount details are complete.'}${skipped ? ` ${skipped} invalid records skipped.` : ''}${data.truncated ? ' Only the first 300 were read.' : ''}${data.failedDetails ? ` ${data.failedDetails} details could not be read; try importing again.` : ''}`; $('stashImportResult').textContent = message; notify(message); }
  } catch (err) { $('stashImportResult').textContent=err.message; notify(err.message); } finally { btn.disabled = false; btn.textContent = '↻ Import stash from Ravelry'; }
};

// ---------- Ravelry yarn search (uses the same connector as the pattern import) ----------
$('yarnSearch').onclick = async () => {
  const q = $('stashBrand').value.trim(), conf = readStorage('bow-purl-ravelry', {}) || {}, box = $('yarnResults');
  if (q.length < 2) { notify('Type a brand or yarn name first, e.g. Knitting for Olive.'); return; }
  if (!connectorURL(conf.url || '')) { notify('Ravelry yarn search uses your Ravelry connector. Set it up in Pattern library → Connector settings.'); return; }
  const btn = $('yarnSearch'); btn.disabled = true; btn.textContent = 'Searching…'; box.replaceChildren();
  try {
    const {res,data} = await connectorFetch(conf.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Token': conf.token || '' }, body: JSON.stringify({ action: 'yarns', query: q }) });
    if (!res.ok) throw Error(data.error || (res.status === 400 ? 'Your Ravelry connector is out of date. Redeploy worker/ravelry-worker.js.' : `Yarn search failed (${res.status}).`));
    const ys = (Array.isArray(data.yarns) ? data.yarns : []).filter(y => typeof y?.name === 'string');
    if (!ys.length) { textNode('p', 'No yarns found on Ravelry. Try just the brand name.', box).className = 'hint'; return; }
    for (const y of ys.slice(0, 25)) {
      const w = ravW(y.weight), yd = Number(y.yards) > 0 && Number(y.yards) < 10000 ? Number(y.yards) : null;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'yarn-hit'; box.append(b);
      textNode('b', y.name.slice(0, 80), b); textNode('span', `${w.replace(/^\d • /, '')}${yd ? ` · ${yd} yds` : ''}${y.grams ? ` / ${y.grams} g` : ''}`, b);
      b.onclick = () => {
        $('stashBrand').value = y.name.slice(0, 80); if (w !== 'Unspecified') $('stashWeight').value = w; if (yd) { $('stashYards').value = yd; $('stashUnit').value='yd'; }
        if (yd && w !== 'Unspecified' && !myYarns.some(m => m.name.toLowerCase() === y.name.toLowerCase())) { const nextYarns = [{ name: y.name.slice(0, 80), weight: w, yards: yd }, ...myYarns].slice(0, 300); if(writeStorage('bow-purl-yarns',nextYarns)){myYarns=nextYarns;fillBrandList();}else{box.replaceChildren();return;} }
        box.replaceChildren(); notify(`${y.name} filled in and saved to your yarn list.`);
      };
    }
  } catch (err) { const message=err instanceof TypeError||err.name==='AbortError'?connectorError(err,null,null,'Yarn search'):err.message; textNode('p',message,box).className='warn'; notify(message); } finally { btn.disabled = false; btn.textContent = 'Search Ravelry'; }
};

// ---------- stash ----------
function saveStash(next) { if (next.length > 500 || !next.every(validStash)) { notify('Check stash details (maximum 500 entries, 1,000 skeins and 10,000 yards per skein).'); return false; } if (writeStorage('bow-purl-stash', next)) { stash = next; fillBrandList(); return true; } return false; }
$('stashForm').onsubmit = e => {
  e.preventDefault();
  const brand = $('stashBrand').value.trim().slice(0, 80), rawYards = optionalQuantity($('stashYards').value,10000), yards=rawYards===null?null:rawYards*($('stashUnit').value==='m'?YD_PER_M:1), skeins = optionalQuantity($('stashSkeins').value,1000);
  if (!brand) { notify('Enter the yarn brand and name.'); return; }
  if (($('stashYards').value.trim()!==''&&rawYards===null)||($('stashSkeins').value.trim()!==''&&skeins===null)) {notify('Enter valid amounts, or leave them blank if unknown.');return;}
  const item = { id: newId(), brand, weight: $('stashWeight').value, yards, skeins, color: $('stashColor').value.trim().slice(0, 60), fiber:$('stashFiber').value.trim(),dyeLot:$('stashLot').value.trim(),priceUSD:$('stashPrice').value.trim()===''?null:Number($('stashPrice').value),purchasedAt:$('stashPurchased').value };
  if (saveStash([...stash, item])) { $('stashForm').reset(); $('stashWeight').value = item.weight; renderStash(); notify('Added to your stash.'); }
};
let editingStashId = null;
function editStashAmounts(s) {
  editingStashId = s.id; $('stashEditTitle').textContent = s.brand;
  $('editStashBrand').value=s.brand;$('editStashWeight').value=s.weight;$('editStashColor').value=s.color||'';$('editStashFiber').value=s.fiber||'';$('editStashLot').value=s.dyeLot||'';$('editStashPrice').value=s.priceUSD??'';$('editStashPurchased').value=s.purchasedAt||'';
  $('editStashYards').value = s.yards ?? ''; $('editStashSkeins').value = s.skeins ?? ''; $('editStashTotal').value = s.totalYards ?? '';
  $('stashEditDialog').showModal();
}
$('cancelStashEdit').onclick = () => $('stashEditDialog').close();
$('stashEditForm').onsubmit = e => {
  e.preventDefault(); const next = structuredClone(stash), item = next.find(s => s.id === editingStashId); if (!item) return;
  const yards = optionalQuantity($('editStashYards').value,10000), skeins = optionalQuantity($('editStashSkeins').value,1000), total = optionalQuantity($('editStashTotal').value,1000000);
  for(const [id,amount]of [['editStashYards',yards],['editStashSkeins',skeins],['editStashTotal',total]])if($(id).value.trim()!==''&&amount===null){notify('Enter valid amounts, or leave them blank if unknown.');return;}
  const quantitiesChanged=yards!==item.yards||skeins!==item.skeins||total!==(item.totalYards??null);
  Object.assign(item, {brand:$('editStashBrand').value.trim(),weight:$('editStashWeight').value,color:$('editStashColor').value.trim(),fiber:$('editStashFiber').value.trim(),dyeLot:$('editStashLot').value.trim(),priceUSD:$('editStashPrice').value.trim()===''?null:Number($('editStashPrice').value),purchasedAt:$('editStashPurchased').value,yards,skeins,totalYards:yards > 0 && skeins != null ? null : total,localQuantities:item.localQuantities||quantitiesChanged});
  if(item.ravId)item.localDetails=true;
  if (saveStash(next)) { $('stashEditDialog').close(); renderStash(); notify('Amounts saved on this device. Re-importing keeps your corrections.'); }
};
function adjustStash(s, amount) {
  if (s.skeins == null || !(s.yards>0) || s.skeins+amount>=1000) return;
  const next = structuredClone(stash), item = next.find(n => n.id === s.id);
  item.skeins = Math.max(0, +(item.skeins + amount).toFixed(2)); item.totalYards = null; item.localQuantities = true;
  if (saveStash(next)) renderStash();
}
let stashVisibleLimit=60;
weights.forEach(w=>{for(const id of ['stashWeightFilter','editStashWeight']){const o=document.createElement('option');o.value=w;o.textContent=w;$(id).append(o);}});
for(const id of ['stashSearch','stashWeightFilter','stashSort'])$(id).addEventListener('input',()=>{stashVisibleLimit=60;renderStash();});
$('stashMore').onclick=()=>{stashVisibleLimit+=60;renderStash();};
function renderStash() {
  const list = $('stashList'), out = $('stashMatches'); list.replaceChildren(); out.replaceChildren();
  const q=$('stashSearch').value.trim().toLowerCase(),w=$('stashWeightFilter').value;
  const visible=stash.filter(s=>(w==='all'||s.weight===w)&&(!q||[s.brand,s.color||'',s.fiber||'',s.dyeLot||''].join(' ').toLowerCase().includes(q)));
  const sort=$('stashSort').value;visible.sort(sort==='yards'?(a,b)=>(stashTotal(b)??-1)-(stashTotal(a)??-1):sort==='unknown'?(a,b)=>(stashTotal(a)!==null)-(stashTotal(b)!==null)||a.brand.localeCompare(b.brand):(a,b)=>a.brand.localeCompare(b.brand));
  $('stashCount').textContent=visible.length+' of '+stash.length+' yarn entries';$('stashMore').hidden=visible.length<=stashVisibleLimit;
  if (!visible.length) { textNode('p', stash.length?'No yarn matches these filters.':'Your stash is empty. Add a yarn above to see what you can make.', list); return; }
  for (const s of visible.slice(0,stashVisibleLimit)) {
    const row = document.createElement('div'); row.className = 'stash-item'; list.append(row);
    const b = document.createElement('div'); row.append(b);
    textNode('b', s.brand + (s.color ? ' · ' + s.color : '') + (s.ravId ? ' ↻' : ''), b);
    const total = stashTotal(s);
    textNode('span', `${s.weight.replace(/^\d • /, '')} · ${s.skeins == null ? 'Skeins unknown' : s.skeins + ' skeins'} · ${s.yards == null ? 'Yards per skein unknown' : s.yards + ' yds/skein'}${total == null ? ' · Total unknown' : ' · ' + fmt(total) + ' yds total'}`, b).className = 'muted';
    if (s.yards == null || s.skeins == null) textNode('span', 'Kept in your stash — add amounts whenever you know them.', b).className = 'hint';
    if (s.localQuantities && s.ravId) textNode('span', 'Your local amounts are kept on re-import.', b).className = 'hint';
    if(s.ravStatus)textNode('span','Ravelry status: '+s.ravStatus+(s.localQuantities?' — check your locally recorded amounts.':''),b).className='warn';
    const details=textNode('details','',row);details.className='stash-entry-details';textNode('summary','Fiber, purchase & adjustments',details);
    if(s.fiber||s.dyeLot)textNode('p',[s.fiber,s.dyeLot?'Dye lot: '+s.dyeLot:''].filter(Boolean).join(' · '),details).className='muted';
    if(s.priceUSD!=null)textNode('p','Recorded purchase: '+money(s.priceUSD)+' per skein'+(s.purchasedAt?' · '+priceDateText(s.purchasedAt):' (undated)'),details).className='hint';
    const act = document.createElement('div'); act.className = 'actions'; row.append(act);
    textNode('button', 'Edit details', act).onclick = () => editStashAmounts(s);
    const minus = textNode('button', '−', act), plus = textNode('button', '+', act);
    details.append(minus,plus);
    minus.setAttribute('aria-label', 'Use one skein of ' + s.brand); plus.setAttribute('aria-label', 'Add one skein of ' + s.brand);
    minus.disabled = s.skeins == null || s.skeins <= 0 || !(s.yards>0); plus.disabled = s.skeins == null || !(s.yards>0) || s.skeins+1>=1000;
    if(s.skeins!=null&&!(s.yards>0))textNode('span','Use Edit details to adjust totals while per-skein yardage is unknown.',b).className='hint';
    minus.onclick = () => adjustStash(s,-1); plus.onclick = () => adjustStash(s,1);
    textNode('button', 'Remove', details).onclick = () => { if (confirm(`Remove ${s.brand} from your stash?`)) { saveStash(stash.filter(x => x.id !== s.id)); renderStash(); } };
  }
  // suggestions: one yarn on its own, or all yarns of a weight combined (colorwork, stripes)
  const combine = $('stashCombine').checked;
  const known = visible.filter(s => stashTotal(s) != null);
  const unknown = visible.length - known.length;
  if (unknown) textNode('p', `${unknown} yarn entries have unknown total yardage. They stay in your stash; add amounts to include them in project estimates.`, out).className = 'hint';
  const groups = combine ? weights.map(w => ({ label: `Known amounts of your ${w.replace(/^\d • /, '')}`, weight: w, total: known.filter(s => s.weight === w).reduce((t,s) => t + stashTotal(s),0) })).filter(g => g.total > 0)
    : known.filter(s=>stashTotal(s)>0).map(s => ({ label:s.brand + (s.color ? ' · ' + s.color : ''), weight:s.weight, total:stashTotal(s), per:s.yards }));
  textNode('p','Yardage suggestions only: check your chosen size, fiber, gauge, colors and dye lots. Combined weights do not establish yarn compatibility. These estimates do not reserve yarn for other projects.',out).className='hint';
  if(groups.length>12)textNode('p','Showing suggestions for the first 12 yarn entries. Narrow your stash filters to see others.',out).className='hint';
  let any = false;
  for (const g of groups.slice(0,12)) {
    const fits = patterns.filter(p => p.weight === g.weight && (p.yardsMin ?? p.yardsMax) != null && (p.yardsMin ?? p.yardsMax) <= g.total)
      .sort((a, b) => (b.yardsMin ?? b.yardsMax) - (a.yardsMin ?? a.yardsMax));
    const sec = document.createElement('section'); sec.className = 'panel'; out.append(sec);
    textNode('h3', `${g.label} — ${fmt(g.total)} yds`, sec);
    if (!fits.length) { textNode('p', `No patterns in your library fit ${fmt(g.total)} yds of ${g.weight.replace(/^\d • /, '')} yet.`, sec).className = 'muted'; continue; }
    any = true;
    for (const p of fits.slice(0,20)) {
      const lo = p.yardsMin ?? p.yardsMax, hi = p.yardsMax ?? lo, all = hi <= g.total;
      const r = document.createElement('div'); r.className = 'stash-match'; sec.append(r);
      const h = p.link ? textNode('a', p.name, r) : textNode('b', p.name, r); if (p.link) { h.href = p.link; h.target = '_blank'; h.rel = 'noopener noreferrer'; }
      textNode('span', `${lo === hi ? fmt(lo) : fmt(lo) + '–' + fmt(hi)} yds · ${all ? 'covers the listed yardage range' : 'covers only the lower yardage estimates'} · ${fmt(g.total - lo)} yds beyond the minimum`, r).className = all ? 'ok' : 'warn';
    }
    if(fits.length>20)textNode('p',(fits.length-20)+' more matches. Filter your Pattern library to compare them.',sec).className='hint';
  }
  if (!any && !patterns.length) textNode('p', 'Import or add patterns in the Pattern library first, then come back here.', out).className = 'hint';
}
$('stashCombine').onchange = renderStash;

// ---------- prices & monthly reviews ----------
function localPriceDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function validPriceDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00'); return Number.isFinite(date.getTime()) && localPriceDate(date) === value;
}
function priceReviewInfo(p, now = new Date()) {
  const today = localPriceDate(now), reviewed = validPriceDate(p.reviewedAt) && p.reviewedAt <= today ? p.reviewedAt : null;
  const next = reviewed ? new Date(Number(reviewed.slice(0,4)), Number(reviewed.slice(5,7)),1,12) : null;
  return {due:!reviewed || reviewed.slice(0,7) !== today.slice(0,7), reviewed, next:next ? localPriceDate(next) : null};
}
function priceDateText(value) { return validPriceDate(value) ? new Date(value+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : 'Not dated'; }
function renderPrices() {
  $('priceTier').value = String(prices.tier); $('priceSource').textContent = prices.source;
  const tb = $('priceTable'); tb.replaceChildren();
  $('priceRows').replaceChildren();
  for (const w of weights.slice(0,8)) {
    const tr = document.createElement('tr'); tb.append(tr); textNode('td', w.replace(/^\d • /,''), tr);
    prices.perYard[w].forEach((v,i) => textNode('td', `$${v.toFixed(3)}/yd`, tr).className = i === prices.tier ? 'on' : '');
    textNode('td', money(prices.perYard[w][prices.tier]*220), tr);
    const meta = prices.weightMeta?.[w]?.[prices.tier];
    const row=textNode('div','',$('priceRows'));row.className='price-row';textNode('strong',w.replace(/^\d • /,''),row);
    textNode('span',money(prices.perYard[w][prices.tier]*220)+' / 220 yds',row).className='price-value';
    textNode('p',`$${prices.perYard[w][prices.tier].toFixed(3)}/yd · ${priceDateText(meta?.checkedAt)}${meta?.source?' · '+meta.source:' · estimate'}`,row).className='hint';
    const date = textNode('td', priceDateText(meta?.checkedAt), tr); if (meta?.source) date.title = meta.source;
  }
  const review = priceReviewInfo(prices);
  $('priceReviewStatus').textContent = review.due ? 'Price review due for ' + new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'}) : 'Your monthly review is recorded.';
  $('priceReviewDates').textContent = review.reviewed ? `Last review: ${priceDateText(review.reviewed)}. Next due: ${priceDateText(review.next)}. Individual price dates are shown separately.` : 'No monthly review recorded yet. Your existing prices are kept until you edit them.';
  $('priceReviewDone').textContent = review.due ? "Finish this month's review" : 'Record review again';
  $('customCount').textContent = `${prices.custom.length} named yarn quote${prices.custom.length === 1 ? '' : 's'} saved for reference. Project cost ranges use the weight estimates above.`;
  const quotes = $('customPrices'); quotes.replaceChildren();
  for (const c of prices.custom) {
    const row = document.createElement('div'); row.className = 'price-quote'; quotes.append(row);
    const body = textNode('div','',row); textNode('b',c.name,body);
    textNode('p',`${money(c.price)} / ${fmt(c.yards)} yds · ${c.weight.replace(/^\d • /,'')}`,body);
    textNode('p',`${priceDateText(c.checkedAt)}${c.source ? ' · '+c.source : ''}`,body).className = 'muted';
    textNode('button','Edit quote',row).onclick = () => {
      $('updatePriceDetails').open=true;
      $('priceUpdateKind').value='yarn'; updatePriceKind(); $('priceUpdateName').value=c.name; $('priceUpdateWeight').value=c.weight; $('priceUpdateCost').value=c.price; $('priceUpdateYards').value=c.yards; $('priceUpdateDate').value=c.checkedAt || localPriceDate(); $('priceUpdateSource').value=c.source || ''; $('priceUpdateName').focus();
    };
  }
}
function commitPrices(next) {
  if (!validPrices(next)) { notify('These price settings are invalid. Your saved prices were kept.'); return false; }
  if (!writeStorage('bow-purl-prices',next)) return false;
  prices=next; renderPrices(); fillBrandList(); if (!$('library').hidden) renderLibrary(); return true;
}
function resolvePriceWeight(name) {
  const text=String(name).trim().toLowerCase();
  return weights.find(w => w.toLowerCase() === text || w.replace(/^\d • /,'').toLowerCase() === text) || ({lace:weights[0],fingering:weights[1],'super fine':weights[1],sport:weights[2],fine:weights[2],dk:weights[3],light:weights[3],worsted:weights[4],aran:weights[4],medium:weights[4],bulky:weights[5],'super bulky':weights[6],jumbo:weights[7]})[text];
}
function parsePriceCSV(text) {
  const rows=[]; let row=[],cell='',quoted=false;
  for (let i=0;i<text.length;i++) {
    const ch=text[i];
    if (ch==='"') { if (quoted && text[i+1]==='"') {cell+='"';i++;} else if (quoted || !cell.trim()) quoted=!quoted; else throw Error('Quote inside an unquoted CSV cell.'); }
    else if (!quoted && ch===',') {row.push(cell.trim());cell='';}
    else if (!quoted && (ch==='\r' || ch==='\n')) { if(ch==='\r' && text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=''; }
    else cell+=ch;
  }
  if (quoted) throw Error('A quoted CSV cell is not closed.');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
function encodePriceCSV(rows) { return rows.map(row=>row.map(v=>{let s=String(v??'');if(typeof v==='string'&&/^(?:\s*[=+\-@]|[\t\r])/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',')).join('\r\n'); }
function priceCSVRows(p) {
  const rows=[['type','name','price','yards','weight','tier','source','checked']];
  for (const w of weights) for (let tier=0;tier<3;tier++) {
    const meta=p.weightMeta?.[w]?.[tier];
    const yards = p.perYard[w][tier]*220 < 1000 ? 220 : 1;
    rows.push(['weight',w,(p.perYard[w][tier]*yards).toFixed(8),yards,w,['budget','mid','premium'][tier],meta?.source || '',meta?.checkedAt || '']);
  }
  for (const c of p.custom) rows.push(['yarn',c.name,c.price,c.yards,c.weight,'',c.source || '',c.checkedAt || '']);
  return rows;
}
function mergePriceCSV(base, rows, knownYarns = [], today = localPriceDate()) {
  const next=structuredClone(base); next.weightMeta ||= {};
  let changedWeights=0,changedYarns=0,skipped=0;
  for (const row of rows) {
    const [rawType,rawName,rawPrice,rawYards,rawWeight,rawTier,rawSource,rawChecked]=row;
    const type=String(rawType||'').toLowerCase(); if(type==='type')continue;
    const name=String(rawName||'').trim(), price=Number(String(rawPrice||'').replace(/^\$/,'')), yards=Number(rawYards);
    const checkedAt=String(rawChecked||'').trim(),source=String(rawSource||'').slice(0,120);
    if (!name || name.length>80 || !['weight','yarn'].includes(type) || !(price>0 && price<1000 && yards>0 && yards<10000) || (checkedAt && (!validPriceDate(checkedAt) || checkedAt>today))) {skipped++;continue;}
    if(type==='weight') {
      const w=resolvePriceWeight(rawWeight || name), tierText=String(rawTier??'').trim().toLowerCase();
      const tier=tierText==='' ? base.tier : ({budget:0,mid:1,'mid-range':1,premium:2,'0':0,'1':1,'2':2})[tierText];
      if(!w || tier===undefined) {skipped++;continue;}
      next.perYard[w][tier]=price/yards;
      next.weightMeta[w] ||= [null,null,null]; next.weightMeta[w][tier]={checkedAt:checkedAt||null,source};changedWeights++;
    } else {
      const index=next.custom.findIndex(c=>c.name.toLowerCase()===name.toLowerCase());
      const weight=rawWeight ? resolvePriceWeight(rawWeight) : next.custom[index]?.weight || knownYarns.find(y=>y.name.toLowerCase()===name.toLowerCase())?.weight || 'Unspecified';
      if (!weight || (index<0 && next.custom.length>=500)) {skipped++;continue;}
      const quote={name,price,yards,weight,checkedAt:checkedAt||null,source};
      index<0 ? next.custom.push(quote) : next.custom[index]=quote;changedYarns++;
    }
  }
  if (changedWeights || changedYarns) next.source='Your saved prices and retained estimates';
  return {next,changedWeights,changedYarns,skipped};
}
weights.forEach(w=>{const o=document.createElement('option');o.value=w;o.textContent=w;$('priceUpdateWeight').append(o);});
$('priceUpdateWeight').value=weights[4];$('priceUpdateTier').value=String(prices.tier);$('priceUpdateDate').value=localPriceDate();$('priceUpdateDate').max=localPriceDate();
function updatePriceKind() { const yarn=$('priceUpdateKind').value==='yarn';$('priceYarnLabel').hidden=!yarn;$('priceUpdateName').required=yarn;$('priceUpdateTier').disabled=yarn; }
$('priceUpdateKind').onchange=updatePriceKind;
$('priceUpdateForm').onsubmit=e=>{
  e.preventDefault();
  const date=$('priceUpdateDate').value;
  if(!validPriceDate(date) || date>localPriceDate()) {notify('Choose a valid date on or before today.');return;}
  const type=$('priceUpdateKind').value, weight=$('priceUpdateWeight').value;
  const rows=[[type,type==='weight'?weight:$('priceUpdateName').value.trim(),$('priceUpdateCost').value,$('priceUpdateYards').value,weight,$('priceUpdateTier').value,$('priceUpdateSource').value,date]];
  const result=mergePriceCSV(prices,rows,allLines());
  if(result.skipped || (!result.changedWeights && !result.changedYarns)) {notify('Enter a yarn name, a price below $1,000 and yardage below 10,000.');return;}
  if(commitPrices(result.next)) notify(type==='weight'?'Weight estimate saved. App cost ranges now use the updated price.':'Yarn quote saved. Weight estimates are edited separately.');
};
$('priceReviewDone').onclick=()=>{if(commitPrices({...prices,reviewedAt:localPriceDate()}))notify('Monthly review recorded. Your next review is due on the first of next month.');};
$('priceTier').onchange=()=>commitPrices({...prices,tier:Number($('priceTier').value)});
$('priceReset').onclick=()=>{if(confirm('Return to built-in estimates and remove saved quotes and review dates?'))commitPrices({perYard:structuredClone(DEFAULT_PRICES),custom:[],tier:prices.tier,source:'Built-in 2026 US Midwest estimates'});};
$('priceExport').onclick=()=>download(new Blob([encodePriceCSV(priceCSVRows(prices))],{type:'text/csv;charset=utf-8'}),'bow-and-purl-prices-'+localPriceDate()+'.csv');
$('priceTemplate').onclick=()=>download(new Blob([encodePriceCSV([['type','name','price','yards','weight','tier','source','checked'],['weight','Fingering','12','400','Fingering','mid','Example only',''],['yarn','Cascade 220','10.99','220','Worsted','','Example only','']])],{type:'text/csv;charset=utf-8'}),'yarn-prices-example.csv');
$('priceImport').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try {
    if(file.size>2*1024*1024)throw Error('Price file is too large (2 MB maximum).');
    const result=mergePriceCSV(prices,parsePriceCSV((await file.text()).replace(/^\uFEFF/,'')),allLines());
    if(!result.changedWeights && !result.changedYarns)throw Error('No valid price rows found. Use the example template and check the column order.');
    if(commitPrices(result.next)){$('priceImportResult').textContent=`Updated ${result.changedWeights} weight/tier estimates and ${result.changedYarns} yarn quotes.${result.skipped?' Skipped '+result.skipped+' invalid rows.':''} Other prices and your review date were kept.`;notify('Price CSV imported. Check the results, then finish your monthly review when ready.');}
  } catch(err){$('priceImportResult').textContent=err.message;notify(err.message);}finally{e.target.value='';}
};
window.addEventListener('focus',()=>{$('priceUpdateDate').max=localPriceDate();renderPrices();});

fillBrandList(); renderPrices();
const _tab = tab; tab = id => { _tab(id); if (id === 'stash') { fillBrandList(); renderStash(); } if (id === 'prices') renderPrices(); };
// The app's navigation handlers resolve the wrapped tab() at click time.
