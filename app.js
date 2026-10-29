'use strict';
const $ = id => document.getElementById(id);
const val = (id, fallback = '') => $(id)?.value ?? fallback; // tolerate an outdated index.html
window.addEventListener('error', () => { if (!$('shopWeight') || !$('ravInclude')) { const s = $('status'); if (s) s.textContent = 'Some app files are out of date. Re-upload ALL files from the latest ZIP, then refresh.'; } });
const weights = ['0 • Lace','1 • Super fine / Fingering','2 • Fine / Sport','3 • Light / DK','4 • Medium / Worsted / Aran','5 • Bulky','6 • Super bulky','7 • Jumbo','Unspecified'];
const HEX = /^#[\da-f]{6}$/i;
let state = { cols: 32, rows: 32, name: 'My heart cardigan', bg: '#fff6f5', fg: '#cc4c76', ac: '#f2b84b', cells: [], row: 1 };
let history = [], future = [], patterns = [], currentId = null, cellW = 16, cellH = 16, drawing = false, lastCell = '', lastImage = null;
let chartCursor = { x: 0, y: 0 };

function newId() { return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'id-' + Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8, '0')).join(''); }
let timer;
function notify(msg) { $('status').textContent = msg; clearTimeout(timer); timer = setTimeout(() => $('status').textContent = '', 5500); }
function readStorage(k, f) { if (BPStore.KEYS.includes(k)) return BPStore.read(k, f); try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } }
function writeStorage(k, v) { if (BPStore.KEYS.includes(k)) return BPStore.commit({ [k]: v }); try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { notify('Settings could not be saved on this device.'); return false; } }
function safeLink(value) { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; } }
function connectorURL(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.hash; } catch { return false; } }
function safeKey(k) { return typeof k === 'string' && k.length > 0 && k.length <= 60 && !['__proto__','constructor','prototype'].includes(k); }
async function connectorFetch(url, options) {
  if (!connectorURL(url)) throw Error('Use a valid https:// connector URL without login details or a fragment.');
  const ctrl = new AbortController(), timeout = setTimeout(() => ctrl.abort(), 90000);
  try { const res = await fetch(url, { ...options, signal: ctrl.signal }); const data = await res.json().catch(() => ({})); return {res, data}; }
  finally { clearTimeout(timeout); }
}

function validChart(s) {
  if (s && s.ac === undefined) s.ac = '#f2b84b'; // charts saved by version 1
  return s && Number.isInteger(s.cols) && s.cols >= 8 && s.cols <= 120 && Number.isInteger(s.rows) && s.rows >= 8 && s.rows <= 160 &&
    Array.isArray(s.cells) && s.cells.length === s.cols * s.rows && s.cells.every(x => x === 0 || x === 1 || x === 2) &&
    HEX.test(s.bg) && HEX.test(s.fg) && HEX.test(s.ac) && typeof s.name === 'string' && s.name.length <= 100 &&
    Number.isInteger(s.row) && s.row >= 1 && s.row <= s.rows;
}
const optNum = v => v === undefined || v === null || (Number.isFinite(v) && v >= 0 && v < 100000);
const optStr = (v, n) => v === undefined || (typeof v === 'string' && v.length <= n);
function validPattern(p) { return p && optNum(p.yardsMin) && optNum(p.yardsMax) && (p.yardsMin == null || p.yardsMax == null || p.yardsMin <= p.yardsMax) && optStr(p.yardageNote, 200) && optStr(p.sizes, 200) && optStr(p.designer, 100) && optStr(p.source, 20) && optStr(p.ravFrom, 20) && (p.localFields === undefined || (Array.isArray(p.localFields) && p.localFields.every(f => ['name','weight','yardsMin','yardsMax','link'].includes(f)))) && (p.yarns === undefined || (Array.isArray(p.yarns) && p.yarns.length <= 3 && p.yarns.every(y => typeof y === 'string' && y.length <= 80))) && (p.photo === undefined || p.photo === '' || (typeof p.photo === 'string' && p.photo.length < 500 && /^https:\/\//.test(p.photo) && safeLink(p.photo))) && typeof p.id === 'string' && p.id.length > 0 && p.id.length <= 100 && typeof p.name === 'string' && p.name.length <= 100 && weights.includes(p.weight) && typeof p.notes === 'string' && p.notes.length <= 10000 && typeof p.link === 'string' && p.link.length <= 2000 && (!p.link || safeLink(p.link)) && (!p.chart || validChart(p.chart)); }

patterns = BPStore.loadList('bow-purl-patterns', validPattern, 3000);

// ---------- dropdowns ----------
weights.forEach(w => ['patternWeight', 'saveWeight', 'filter'].forEach(id => { const o = document.createElement('option'); o.value = w; o.textContent = w; $(id).append(o); }));
{ const all = document.createElement('option'); all.value = 'all'; all.textContent = 'All yarn weights'; $('filter').prepend(all); $('filter').value = 'all'; }
const validMotif = r => Array.isArray(r) && r.length && r.length <= 160 && r.every(x => typeof x === 'string' && /^[012]{1,120}$/.test(x));
let myMotifs = readStorage('bow-purl-motifs', {});
if (!myMotifs || typeof myMotifs !== 'object' || Array.isArray(myMotifs)) { BPStore.flag('bow-purl-motifs', 'Saved motifs have an invalid format.'); myMotifs = {}; }
for (const k of Object.keys(myMotifs)) if (!safeKey(k) || !validMotif(myMotifs[k])) { BPStore.flag('bow-purl-motifs', 'Some motifs have an invalid format.'); delete myMotifs[k]; }
BPStore.stage('bow-purl-motifs',myMotifs);
function buildMotifMenu(keep) {
  const sel = $('motif'); sel.replaceChildren();
  const names = Object.keys(myMotifs).sort();
  if (names.length) { const g = document.createElement('optgroup'); g.label = '♡ My motifs'; for (const n of names) { const o = document.createElement('option'); o.value = 'mine|' + n; o.textContent = n; g.append(o); } sel.append(g); }
  for (const [group, items] of Object.entries(MOTIFS)) {
    const g = document.createElement('optgroup'); g.label = group;
    for (const name of Object.keys(items)) { const o = document.createElement('option'); o.value = group + '|' + name; o.textContent = name; g.append(o); }
    sel.append(g);
  }
  const g = document.createElement('optgroup'); g.label = 'All-over patterns';
  for (const name of Object.keys(PATTERNS)) { const o = document.createElement('option'); o.value = 'pattern|' + name; o.textContent = name; g.append(o); }
  sel.append(g);
  sel.value = keep && [...sel.options].some(o => o.value === keep) ? keep : 'Cute & cozy|Heart';
  const count = Object.values(MOTIFS).reduce((n, m) => n + Object.keys(m).length, 0) + Object.keys(PATTERNS).length + names.length;
  $('deleteMotif').hidden = !sel.value.startsWith('mine|');
  $('motifCount').textContent = `${count} designs`;
}
buildMotifMenu();

// ---------- core helpers ----------
function snapshot() { if (!validChart(state)) return; history.push(JSON.stringify({ state, currentId })); if (history.length > 30) history.shift(); future = []; $('undo').disabled = false; }
function draft() { writeStorage('bow-purl-draft', { ...state, patternId: currentId }); }
function controls() { $('cols').value = state.cols; $('rows').value = state.rows; $('chartName').value = state.name; $('background').value = state.bg; $('foreground').value = state.fg; $('accent').value = state.ac; chartCursor = {x:0,y:state.rows-1}; }
function dimensions() {
  const cols = Number($('cols').value), rows = Number($('rows').value);
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 8 || cols > 120 || rows < 8 || rows > 160) throw Error('Use 8–120 columns and 8–160 rows.');
  return { cols, rows };
}
function freshState(d, name) {
  Object.assign(state, d, { name: $('chartName').value.trim() || name, bg: $('background').value, fg: $('foreground').value, ac: $('accent').value, row: 1, cells: Array(d.cols * d.rows).fill(0) });
  currentId = null;
}
function toGrid(rows) { // pad ragged rows into a numeric matrix
  const w = Math.max(...rows.map(r => r.length));
  return rows.map(r => Array.from(r.padEnd(w, '0'), ch => ch === '2' ? 2 : ch === '1' ? 1 : 0));
}
function transform(grid) {
  let g = grid.map(r => r.slice());
  if ($('mirror').checked) g = g.map(r => r.reverse());
  if ($('flip').checked) g = g.reverse();
  if ($('noAccent').checked) g = g.map(r => r.map(v => v ? 1 : 0));
  return g;
}

// ---------- drawing ----------
function draw() {
  document.body.dataset.chartMode = $('chartMode').value;
  const c = $('chart'), ctx = c.getContext('2d');
  cellW = 16; cellH = $('knitShape').checked ? 12 : 16;
  c.width = state.cols * cellW + 55; c.height = state.rows * cellH + 44;
  ctx.fillStyle = '#fffdfb'; ctx.fillRect(0, 0, c.width, c.height);
  const colors = [state.bg, state.fg, state.ac];
  for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) {
    const color = state.cells[y * state.cols + x];
    ctx.fillStyle = colors[color];
    ctx.fillRect(30 + x * cellW, 10 + y * cellH, cellW, cellH);
    if ($('chartSymbols').checked) {
      const hex = colors[color].slice(1), rgb = [0,2,4].map(i => parseInt(hex.slice(i,i+2),16));
      ctx.fillStyle = rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722 > 145 ? '#171117' : '#ffffff';
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(['·','×','○'][color], 30 + x*cellW + cellW/2, 10 + y*cellH + cellH*.77);
    }
  }
  const hl = state.rows - state.row; // highlight current row
  ctx.strokeStyle = '#9978ba'; ctx.lineWidth = 2; ctx.strokeRect(30, 10 + hl * cellH, state.cols * cellW, cellH);
  ctx.strokeStyle = '#74566155'; ctx.lineWidth = .5; ctx.beginPath();
  for (let x = 0; x <= state.cols; x++) { ctx.moveTo(30 + x * cellW, 10); ctx.lineTo(30 + x * cellW, 10 + state.rows * cellH); }
  for (let y = 0; y <= state.rows; y++) { ctx.moveTo(30, 10 + y * cellH); ctx.lineTo(30 + state.cols * cellW, 10 + y * cellH); }
  ctx.stroke();
  if ($('gridTen').checked) {
    ctx.strokeStyle = '#533744aa'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let x = state.cols; x >= 0; x -= 10) { const px = 30 + x * cellW; ctx.moveTo(px, 10); ctx.lineTo(px, 10 + state.rows * cellH); }
    for (let y = state.rows; y >= 0; y -= 10) { const py = 10 + y * cellH; ctx.moveTo(30, py); ctx.lineTo(30 + state.cols * cellW, py); }
    ctx.stroke();
  }
  if (document.activeElement === c) { ctx.strokeStyle = '#111111'; ctx.lineWidth = 2; ctx.strokeRect(30 + chartCursor.x*cellW, 10 + chartCursor.y*cellH, cellW, cellH); }
  ctx.font = '9px sans-serif'; ctx.fillStyle = '#533744'; ctx.textAlign = 'center';
  for (let y = 0; y < state.rows; y++) { const n = state.rows - y; if (n === 1 || n % 5 === 0) { ctx.fillText(n, 14, 10 + y * cellH + cellH * .75); ctx.fillText(n, 40 + state.cols * cellW, 10 + y * cellH + cellH * .75); } }
  const fromLeft = $('chartDirection').value === 'flat' && state.row % 2 === 0;
  for (let x = 0; x < state.cols; x++) { const n = fromLeft ? x + 1 : state.cols - x; if (n === 1 || n % 5 === 0) ctx.fillText(n, 30 + x * cellW + cellW / 2, 26 + state.rows * cellH); }
  const used = new Set(state.cells).size;
  $('chartTitle').textContent = state.name || 'Untitled chart';
  $('dimensions').textContent = `${state.cols} stitches × ${state.rows} rows • ${used} color${used > 1 ? 's' : ''}`;
  $('rowCount').textContent = `Row ${state.row} of ${state.rows}`;
  $('prevRow').disabled = state.row === 1; $('nextRow').disabled = state.row === state.rows; $('undo').disabled = !history.length;
  $('redo').disabled = !future.length;
  const zoom = Number($('chartZoom').value) || 1;
  c.style.width = Math.round(c.width * zoom) + 'px'; c.style.height = Math.round(c.height * zoom) + 'px';
  const locked = $('chartMode').value === 'knit'; c.classList.toggle('chart-locked', locked);
  $('chartModeHelp').textContent = locked ? 'Knitting mode: the chart is locked. Swipe to pan; use the row buttons to keep your place.' : 'Editing mode: tap or drag to paint. Arrow keys move the cursor; Space paints. Switch to Knitting mode to pan safely.';
  for (const id of ['paint','brush','clearChart','mirrorChart','invertChart']) $(id).disabled = locked;
  $('chartLegend').textContent = `Color key: · background ${state.bg}; × motif ${state.fg}; ○ accent ${state.ac}. Symbols identify yarn colors, not knit/purl stitches.`;
  const row = state.cells.slice((state.rows-state.row)*state.cols,(state.rows-state.row+1)*state.cols);
  if (!fromLeft) row.reverse();
  const runs = []; for (const color of row) { if (runs.length && runs.at(-1).color === color) runs.at(-1).count++; else runs.push({color,count:1}); }
  const rowText = `Row ${state.row}: read ${fromLeft ? 'left to right (wrong side)' : 'right to left'}. ` + runs.map(r => `${r.count} ${['background','motif','accent'][r.color]}`).join(', ') + '.';
  if ($('rowInstructions').textContent !== rowText) $('rowInstructions').textContent = rowText;
  c.setAttribute('aria-label', `Colorwork chart. ${state.cols} stitches, ${state.rows} rows. ${locked ? 'Locked for knitting.' : 'Editable with arrow keys and Space.'}`);
  floatCheck();
}
function floatAnalysis(chart, max, circular) {
  let worst = 0; const flagged = [], threeColor = [];
  for (let y = 0; y < chart.rows; y++) {
    const row = chart.cells.slice(y*chart.cols,(y+1)*chart.cols), colors = new Set(row);
    if (colors.size < 2) continue;
    if (colors.size > 2) threeColor.push(chart.rows-y);
    let longest = 0;
    for (const color of colors) {
      let gap = 0;
      for (const cell of circular ? row.concat(row) : row) { gap = cell === color ? 0 : gap + 1; longest = Math.max(longest, Math.min(gap, chart.cols-1)); }
    }
    worst = Math.max(worst,longest); if (longest > max) flagged.push(chart.rows-y);
  }
  return {worst, flagged:flagged.reverse(), threeColor:threeColor.reverse()};
}
function floatCheck() {
  const max = Number($('floatMax').value) || 7;
  const check = floatAnalysis(state, max, $('chartDirection').value === 'round');
  $('floatSummary').textContent = check.flagged.length ? `${check.flagged.length} rows to review · longest carry ${check.worst} stitches` : `Float review: no carries over ${max} stitches flagged`;
  $('floatInfo').textContent = (check.flagged.length ? `${check.flagged.length} rows have carried-color gaps over ${max} stitches (rows ${check.flagged.slice(0,12).join(', ')}${check.flagged.length>12?', …':''}). Longest: ${check.worst}. Plan float catches.` : `No carried-color gaps over ${max} stitches flagged.`) + (check.threeColor.length ? ` ${check.threeColor.length} rows use three colors; consider two-color revisions.` : '') + ' Counts colors used in each row only; swatch and review yarn carries.';
}
function centerCurrentRow() { const viewport=$('chartViewport'),zoom=Number($('chartZoom').value)||1;viewport.scrollTop=Math.max(0,(10+(state.rows-state.row)*cellH)*zoom-viewport.clientHeight/2); }

// ---------- generator ----------
function validateLayout() {
  if (!['repeat','halfdrop','brick','band','single'].includes($('layout').value) || ![0,1,2,3,4].includes(Number($('scale').value))) throw Error('Choose a valid layout and scale.');
  for (const id of ['gapX','gapY']) { const n = Number($(id).value); if (!Number.isInteger(n) || n < 0 || n > 20) throw Error('Use a whole-number gap from 0 to 20.'); }
}
function stampGrid(g, d) {
  validateLayout();
  const layout = $('layout').value, gapX = Number($('gapX').value), gapY = Number($('gapY').value);
  let scale = Number($('scale').value);
  const mh = g.length, mw = g[0].length;
  if (layout === 'single' && scale === 0) scale = Math.max(1, Math.floor(Math.min((d.cols - 2) / mw, (d.rows - 2) / mh)));
  if (!scale) scale = 1;
  const w = mw * scale, h = mh * scale;
  const put = (ox, oy) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const tx = ox + x, ty = oy + y; if (tx >= 0 && tx < d.cols && ty >= 0 && ty < d.rows) { const v = g[Math.floor(y / scale)][Math.floor(x / scale)]; if (v) state.cells[ty * d.cols + tx] = v; } } };
  if (layout === 'single') { if (w > d.cols || h > d.rows) notify('This motif is cropped. Increase your chart size or lower the scale.'); put(Math.floor((d.cols - w) / 2), Math.floor((d.rows - h) / 2)); return; }
  if (layout === 'band') { const oy = Math.floor((d.rows - h) / 2); for (let x = Math.floor(gapX / 2); x < d.cols; x += w + gapX) put(x, oy); return; }
  const stepX = w + gapX, stepY = h + gapY;
  // centre the repeat so the edges look even
  const nX = Math.max(1, Math.floor((d.cols + gapX) / stepX)), startX = Math.floor((d.cols - (nX * stepX - gapX)) / 2);
  const nY = Math.max(1, Math.floor((d.rows + gapY) / stepY)), startY = Math.floor((d.rows - (nY * stepY - gapY)) / 2);
  let i = 0;
  for (let y = startY - (layout === 'halfdrop' ? stepY : 0); y < d.rows; y += stepY, i++) {
    for (let x = startX, j = 0; x < d.cols; x += stepX, j++) {
      const drop = layout === 'halfdrop' && j % 2 ? Math.floor(stepY / 2) : 0;
      const shift = layout === 'brick' && i % 2 ? Math.floor(stepX / 2) : 0;
      put(x + shift - (shift ? stepX : 0), y + drop);
      if (shift) put(x + shift, y + drop);
    }
  }
}
function addBorder(d) {
  if (!$('border').checked) return;
  const v = $('noAccent').checked ? 1 : 2;
  for (let x = 0; x < d.cols; x++) { if (x % 2 === 0) { state.cells[x] = v; state.cells[(d.rows - 1) * d.cols + x] = v; } }
}
function generate(e) {
  e?.preventDefault();
  try {
    const d = dimensions(), [group, name] = $('motif').value.split('|');
    validateLayout();
    snapshot(); freshState(d, name);
    if (group === 'pattern') {
      const f = PATTERNS[name], s = Math.max(1, Number($('scale').value) || 3);
      for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) { let v = f(x, y, s); if ($('noAccent').checked && v) v = 1; state.cells[y * d.cols + x] = v; }
    } else stampGrid(transform(toGrid(group === 'mine' ? myMotifs[name] : MOTIFS[group][name])), d);
    if ($('invert').checked) state.cells = state.cells.map(v => v === 0 ? 1 : v === 1 ? 0 : 2);
    addBorder(d);
    draw(); draft(); requestAnimationFrame(centerCurrentRow);
  } catch (err) { notify(err.message); }
}
$('generator').onsubmit = generate;
$('surprise').onclick = () => { const opts = [...$('motif').options]; $('motif').value = opts[Math.floor(Math.random() * opts.length)].value; generate(); };

// ---------- my motifs ----------
$('motif').onchange = () => { $('deleteMotif').hidden = !$('motif').value.startsWith('mine|'); };
$('saveMotif').onclick = () => { // crop the chart to its drawn area and keep it as a motif
  let x0 = state.cols, y0 = state.rows, x1 = -1, y1 = -1;
  state.cells.forEach((v, i) => { if (v) { const x = i % state.cols, y = Math.floor(i / state.cols); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } });
  if (x1 < 0) { notify('Draw, type or upload a design first, then save it as a motif.'); return; }
  const name = (window.prompt('Name this motif', state.name || 'My motif') || '').trim().slice(0, 60);
  if (!name) return;
  if (!safeKey(name)) { notify('Choose another motif name.'); return; }
  if (myMotifs[name] && !confirm(`Replace your motif “${name}”?`)) return;
  const rows = []; for (let y = y0; y <= y1; y++) rows.push(state.cells.slice(y * state.cols + x0, y * state.cols + x1 + 1).join(''));
  const next = { ...myMotifs, [name]: rows };
  if (writeStorage('bow-purl-motifs', next)) { myMotifs = next; buildMotifMenu('mine|' + name); notify(`“${name}” added to My motifs (${x1 - x0 + 1} × ${y1 - y0 + 1}).`); }
};
$('deleteMotif').onclick = () => {
  const name = $('motif').value.slice(5); if (!myMotifs[name] || !confirm(`Delete your motif “${name}”?`)) return;
  const next = { ...myMotifs }; delete next[name];
  if (writeStorage('bow-purl-motifs', next)) { myMotifs = next; buildMotifMenu(); notify('Motif deleted.'); }
};

// ---------- manual grid input ----------
$('applyGrid').onclick = () => {
  const lines = $('gridText').value.split(/\r?\n/).map(l => l.replace(/[^012.#xX@]/g, '').replace(/[.]/g, '0').replace(/[#xX]/g, '1').replace(/@/g, '2')).filter(Boolean);
  if (!lines.length) { notify('Type rows of 0 (background), 1 (motif) and 2 (accent). You can also use . # and @.'); return; }
  if (lines.length > 160 || lines.some(l => l.length > 120)) { notify('Keep it to 120 stitches and 160 rows.'); return; }
  try { const d = dimensions(); validateLayout(); const g = toGrid(lines); snapshot(); freshState(d, 'Custom grid'); stampGrid(transform(g), d); draw(); draft(); notify('Your grid was placed on the chart.'); } catch (err) { notify(err.message); }
};
$('exportGrid').onclick = () => {
  const rows = []; for (let y = 0; y < state.rows; y++) rows.push(state.cells.slice(y * state.cols, (y + 1) * state.cols).join(''));
  $('gridText').value = rows.join('\n'); $('gridDetails').open = true; notify('Current chart copied into the grid box.');
};

// ---------- image converter ----------
function convertImage() {
  if (!lastImage) return;
  const d = dimensions(), img = lastImage;
  const c = document.createElement('canvas'); c.width = d.cols; c.height = d.rows;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  // knitted stitches are wider than tall; compensate so the picture is not squashed
  const aspect = $('knitShape').checked ? 4 / 3 : 1;
  const fit = $('fit').value;
  const r = fit === 'fill' ? Math.max(c.width / img.width, c.height / (img.height * aspect)) : Math.min(c.width / img.width, c.height / (img.height * aspect));
  const w = img.width * r, h = img.height * aspect * r;
  if (fit === 'stretch') ctx.drawImage(img, 0, 0, c.width, c.height); else ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
  const px = ctx.getImageData(0, 0, c.width, c.height).data;
  const contrast = Number($('contrast').value) / 100;
  const lum = new Float32Array(d.cols * d.rows);
  for (let i = 0; i < lum.length; i++) { const L = px[i * 4] * .2126 + px[i * 4 + 1] * .7152 + px[i * 4 + 2] * .0722; lum[i] = Math.max(0, Math.min(255, (L - 128) * contrast + 128)); }
  const t = Number($('threshold').value), three = $('imgColors').value === '3', dither = $('dither').checked, inv = $('imgInvert').checked;
  const t2 = three ? t * 0.5 : -1; // darker band becomes accent
  const out = new Array(lum.length);
  for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) {
    const i = y * d.cols + x, L = lum[i];
    let v, target;
    if (three && L < t2) { v = 2; target = 0; } else if (L < t) { v = 1; target = three ? (t + t2) / 2 : 0; } else { v = 0; target = 255; }
    if (dither) { const err = (L - target) * 0.5; // light Floyd–Steinberg, softened so knitting stays clean
      if (x + 1 < d.cols) lum[i + 1] += err * 7 / 16;
      if (y + 1 < d.rows) { if (x) lum[i + d.cols - 1] += err * 3 / 16; lum[i + d.cols] += err * 5 / 16; if (x + 1 < d.cols) lum[i + d.cols + 1] += err / 16; } }
    out[i] = inv && v < 2 ? 1 - v : v;
  }
  if ($('cleanup').checked) for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) { // remove lone stitches
    const i = y * d.cols + x, n = [];
    if (x) n.push(out[i - 1]); if (x + 1 < d.cols) n.push(out[i + 1]); if (y) n.push(out[i - d.cols]); if (y + 1 < d.rows) n.push(out[i + d.cols]);
    if (n.length && n.every(v => v !== out[i]) && n.every(v => v === n[0])) out[i] = n[0];
  }
  freshState(d, 'Image chart'); state.cells = out; draw(); draft();
}
$('image').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 12 * 1024 * 1024) { notify('Please use an image smaller than 12 MB.'); return; }
  try { const image = await createImageBitmap(file); if(image.width*image.height>32000000){image.close();throw Error('Image too large');} lastImage?.close?.(); lastImage = image; snapshot(); convertImage(); $('imageTools').hidden = false; notify('Image converted. Adjust the sliders, then tap squares to refine.'); }
  catch { notify('Could not convert this image. Use a PNG or JPEG under 12 MB and 32 megapixels, and valid chart dimensions.'); } finally { e.target.value = ''; }
};
let imgTimer;
for (const id of ['threshold', 'contrast', 'imgColors', 'dither', 'imgInvert', 'cleanup', 'fit']) $(id).addEventListener('input', () => { $('thresholdVal').textContent = $('threshold').value; $('contrastVal').textContent = $('contrast').value + '%'; clearTimeout(imgTimer); imgTimer = setTimeout(() => { try { convertImage(); } catch (err) { notify(err.message); } }, 60); });

// ---------- AI connector ----------
$('aiEndpoint').value = AI.endpoint(); $('aiToken').value = AI.token();
$('saveAi').onclick = () => { const u = $('aiEndpoint').value.trim(); if (u && !connectorURL(u)) { notify('Use a valid https:// connector URL without login details or a fragment.'); return; } if (AI.setEndpoint(u) && AI.setToken($('aiToken').value.trim())) notify(u ? 'AI connector saved on this device.' : 'AI connector removed.'); else notify('AI settings could not be saved on this device.'); };
$('aiGo').onclick = async () => {
  const prompt = $('aiPrompt').value.trim(); if (!prompt) { notify('Describe what you want to knit first.'); return; }
  const btn = $('aiGo'); btn.disabled = true; btn.textContent = 'Designing…';
  try { const d = dimensions(); const rows = await AI.generate(prompt, d.cols, d.rows); snapshot(); freshState(d, prompt.slice(0, 60)); state.cells = transform(toGrid(rows)).flat(); draw(); draft(); notify('AI chart ready at your selected dimensions. Review gauge, colors and floats before knitting.'); }
  catch (err) { notify(err.message); } finally { btn.disabled = false; btn.textContent = '✦ Design with AI'; }
};

// ---------- editing ----------
$('chartName').oninput = () => { state.name = $('chartName').value; draw(); draft(); };
for (const [id, key] of [['background', 'bg'], ['foreground', 'fg'], ['accent', 'ac']]) $(id).onchange = () => { snapshot(); state[key] = $(id).value; draw(); draft(); };
const chartView = readStorage('bow-purl-view', {});
for (const [id, allowed] of [['chartMode',['edit','knit']],['chartDirection',['round','flat']],['chartZoom',['0.75','1','1.5','2']]]) if (allowed.includes(chartView?.[id])) $(id).value = chartView[id];
$('chartSymbols').checked = chartView?.chartSymbols === true;
function saveChartView() { return writeStorage('bow-purl-view', { chartMode:$('chartMode').value, chartDirection:$('chartDirection').value, chartZoom:$('chartZoom').value, chartSymbols:$('chartSymbols').checked }); }
for (const id of ['knitShape', 'gridTen', 'floatMax','chartMode','chartDirection','chartZoom','chartSymbols']) $(id).onchange = () => { finishPaint(); draw(); saveChartView(); if(id==='chartZoom')centerCurrentRow(); };
$('palette').onchange = () => { const [bg, fg, ac] = $('palette').value.split(','); if (!bg) return; $('background').value = bg; $('foreground').value = fg; $('accent').value = ac; snapshot(); Object.assign(state, { bg, fg, ac }); draw(); draft(); };
function travelHistory(from, to) { if (!from.length) return; to.push(JSON.stringify({state,currentId})); const entry = JSON.parse(from.pop()); state = entry.state; currentId = patterns.some(p=>p.id===entry.currentId) ? entry.currentId : null; controls(); draw(); draft(); }
$('undo').onclick = () => travelHistory(history, future);
$('redo').onclick = () => travelHistory(future, history);
$('clearChart').onclick = () => { snapshot(); state.cells = state.cells.map(() => 0); draw(); draft(); };
$('mirrorChart').onclick = () => { snapshot(); const n = []; for (let y = 0; y < state.rows; y++) n.push(...state.cells.slice(y * state.cols, (y + 1) * state.cols).reverse()); state.cells = n; draw(); draft(); };
$('invertChart').onclick = () => { snapshot(); state.cells = state.cells.map(v => v === 2 ? 2 : 1 - v); draw(); draft(); };
function paint(e) {
  if ($('chartMode').value === 'knit') return;
  const c = $('chart'), r = c.getBoundingClientRect();
  const x = Math.floor(((e.clientX - r.left) * c.width / r.width - 30) / cellW), y = Math.floor(((e.clientY - r.top) * c.height / r.height - 10) / cellH);
  if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return;
  const key = x + ',' + y; if (key === lastCell) return; lastCell = key;
  const v = Number($('paint').value), size = Number($('brush').value);
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) { const tx = x + dx, ty = y + dy; if (tx < state.cols && ty < state.rows) state.cells[ty * state.cols + tx] = v; }
  chartCursor = {x,y}; scheduleDraw();
}
let framePending = false;
function scheduleDraw() { if (!framePending) { framePending = true; requestAnimationFrame(() => { framePending = false; draw(); }); } }
$('chart').onpointerdown = e => { if ($('chartMode').value === 'knit' || (e.button !== undefined && e.button !== 0)) return; snapshot(); drawing = true; lastCell = ''; $('chart').setPointerCapture(e.pointerId); paint(e); };
$('chart').onpointermove = e => { if (drawing) paint(e); };
function finishPaint() { if (drawing) { drawing = false; draft(); } }
$('chart').onpointerup = finishPaint; $('chart').onpointercancel = finishPaint;
$('chart').onlostpointercapture = finishPaint;
$('chart').onfocus = draw; $('chart').onblur = draw;
$('chart').onkeydown = e => {
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
    e.preventDefault(); chartCursor.x = Math.max(0, Math.min(state.cols-1, chartCursor.x + (e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))); chartCursor.y = Math.max(0, Math.min(state.rows-1, chartCursor.y + (e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0))); draw();
    const viewport=$('chartViewport'),zoom=Number($('chartZoom').value)||1;viewport.scrollTop=Math.max(0,(10+chartCursor.y*cellH)*zoom-viewport.clientHeight/2);viewport.scrollLeft=Math.max(0,(30+chartCursor.x*cellW)*zoom-viewport.clientWidth/2);
    $('chartPosition').textContent = `Cursor: row ${state.rows-chartCursor.y}, column ${state.cols-chartCursor.x} from right, ${['background','motif','accent'][state.cells[chartCursor.y*state.cols+chartCursor.x]]}.`;
  } else if (e.key === ' ' && $('chartMode').value === 'edit') { e.preventDefault(); snapshot(); state.cells[chartCursor.y*state.cols+chartCursor.x] = Number($('paint').value); draw(); draft(); }
};

// ---------- export ----------
function download(blob, name) { const a = document.createElement('a'), url = URL.createObjectURL(blob); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
$('png').onclick = () => $('chart').toBlob(b => { if (b) download(b, 'bow-and-purl-chart.png'); });
$('print').onclick = () => window.print();
$('chartSettings').onclick = () => { $('chartMode').value='edit'; draw(); saveChartView(); $('generator').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}); $('chartName').focus({preventScroll:true}); };

// ---------- tabs & library ----------
function tab(id) { if (!$(id) || !['studio','monthly','projects','shop','stash','library','prices','help'].includes(id)) return; for (const el of document.querySelectorAll('main>section')) el.hidden = el.id !== id; document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === id); if (b.dataset.tab === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); $('openMore').classList.toggle('active',!['projects','studio','stash','library'].includes(id)); $('sectionPicker').value = id; document.body.dataset.section = id; if (id === 'studio') requestAnimationFrame(centerCurrentRow); if (id === 'library') renderLibrary(); if (id === 'shop') if ($('shopResults')) renderShop(); document.dispatchEvent(new CustomEvent('studio:tab', { detail: id })); }
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { const fromMore=$('moreDialog').open; if(fromMore)$('moreDialog').close();tab(b.dataset.tab);window.scrollTo({top:0,behavior:'instant'});if(fromMore){const title=$(b.dataset.tab).querySelector('h2');title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true});} });
$('openMore').onclick=()=>$('moreDialog').showModal();$('closeMore').onclick=()=>$('moreDialog').close();
function openDisclosure(id,focusId){$(id).open=true;$(id).scrollIntoView({block:'start',behavior:'instant'});$(focusId)?.focus({preventScroll:true});}
$('openAddYarn').onclick=()=>openDisclosure('addYarnDetails','stashBrand');
$('openStashImport').onclick=()=>openDisclosure('stashImportDetails','stashImport');
$('openPatternImport').onclick=()=>openDisclosure('patternImportDetails','ravUser');
$('openAddPattern').onclick=()=>openDisclosure('addPatternDetails','patternName');
$('openPriceUpdate').onclick=()=>openDisclosure('updatePriceDetails','priceUpdateKind');
$('sectionPicker').onchange = () => tab($('sectionPicker').value);
$('skipNavigation').onclick=e=>{e.preventDefault();(document.querySelector('#studioNavigation button.active')||$('openMore'))?.focus();};
$('saveChart').onclick = () => { const p = patterns.find(p => p.id === currentId); $('saveWeight').value = p?.weight || weights[3]; $('saveNotes').value = p?.notes || ''; $('saveDialog').showModal(); };
$('cancelSave').onclick = () => $('saveDialog').close();
function persist(next) { if (next.length > 3000 || !next.every(validPattern)) { notify('Patterns could not be saved: check names, links and yardage (maximum 3,000 patterns).'); return false; } if (writeStorage('bow-purl-patterns', next)) { patterns = next; return true; } return false; }
$('saveForm').onsubmit = e => { e.preventDefault(); const id = currentId || newId(), old = patterns.find(p=>p.id===id); const item = { ...old, id, name: state.name || 'Untitled chart', weight: $('saveWeight').value, notes: $('saveNotes').value, link: old?.link || '', chart: structuredClone(state) }; const next = [...patterns.filter(p=>p.id!==id),item]; if (next.length>3000 || !next.every(validPattern)) { notify('Check the pattern details before saving.'); return; } if (BPStore.commit({'bow-purl-patterns':next,'bow-purl-draft':{...state,patternId:id}})) { patterns=next; currentId = id; $('saveDialog').close(); notify('Pattern saved to your collection.'); } };
function changeRow(n) { state.row = Math.max(1, Math.min(state.rows, state.row + n)); const next = structuredClone(patterns), p = next.find(p=>p.id===currentId); if (p?.chart) p.chart.row=state.row; const changes = {'bow-purl-draft':{...state,patternId:currentId}}; if (p?.chart) changes['bow-purl-patterns']=next; if(BPStore.commit(changes) && p?.chart) patterns=next; draw(); const viewport=$('chartViewport'), zoom=Number($('chartZoom').value)||1; viewport.scrollTop=Math.max(0,(10+(state.rows-state.row)*cellH)*zoom-viewport.clientHeight/2); }
$('prevRow').onclick = () => changeRow(-1); $('nextRow').onclick = () => changeRow(1); $('resetRow').onclick = () => { if (state.row === 1 || confirm('Return to row 1? Your chart stays the same.')) changeRow(1-state.row); };
function textNode(tag, text, parent) { const el = document.createElement(tag); el.textContent = text; parent.append(el); return el; }
function thumb(chart) { const c = document.createElement('canvas'), s = Math.max(2, Math.floor(200 / Math.max(chart.cols, chart.rows))); c.width = chart.cols * s; c.height = chart.rows * s; const ctx = c.getContext('2d'), col = [chart.bg, chart.fg, chart.ac]; chart.cells.forEach((v, i) => { ctx.fillStyle = col[v]; ctx.fillRect((i % chart.cols) * s, Math.floor(i / chart.cols) * s, s, s); }); c.className = 'thumb'; return c; }
const fmt = n => Math.round(n).toLocaleString();
function yardText(p) { if (p.yardsMin == null && p.yardsMax == null) return ''; const a = p.yardsMin ?? p.yardsMax, b = p.yardsMax ?? a; return a === b ? `${fmt(a)} yds` : `${fmt(a)}–${fmt(b)} yds`; }
function patternCard(p, parent) {
  const card = document.createElement('article'); card.className = 'panel card'; parent.append(card);
  if (p.chart) card.append(thumb(p.chart));
  else if (p.photo) { const im = document.createElement('img'); im.src = p.photo; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.onerror = () => im.remove(); card.append(im); }
  else textNode('div','Bow & Purl',card).className='pattern-placeholder';
  const tag = textNode('span', p.source === 'ravelry' ? ({ library: 'In my Ravelry library', both: 'Favorite · in my library' }[p.ravFrom] || 'Ravelry favorite') : p.source === 'seasonal' ? 'Monthly project idea' : p.chart ? 'Bow & Purl chart' : 'Saved pattern', card); tag.className = 'eyebrow';
  textNode('h2', p.name, card);
  textNode('p',p.weight.replace(/^\d • /,''),card).className='muted';
  if (p.designer) textNode('p', 'by ' + p.designer, card).className = 'muted';
  const y = yardText(p); if (y) textNode('p', 'Yarn: ' + y + (p.yardageNote ? ' · ' + p.yardageNote : ''), card).className = 'yards';
  else textNode('p', 'Yardage not listed — tap Edit details to add it.', card).className = 'muted';
  if (p.sizes) textNode('p', 'Sizes: ' + p.sizes, card).className = 'muted';
  if(p.yarns?.length)textNode('p','Pattern yarn: '+p.yarns.join(', '),card).className='muted';
  const details=textNode('details','',card);details.className='sub pattern-details';textNode('summary','Notes, yarn & details',details);
  if (typeof yarnLines === 'function') { const yl = document.createElement('div'); yl.className = 'yarn-lines'; details.append(yl); yarnLines(p, yl); }
  if (p.chart) textNode('p', `${p.chart.cols} stitches × ${p.chart.rows} rows · Row ${p.chart.row}`, card);
  if (p.notes) textNode('p', p.notes, details);
  if (p.link) { const a = textNode('a', p.source === 'ravelry' ? 'Open on Ravelry ↗' : 'Open pattern ↗', card); a.href = p.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  const actions = document.createElement('div'); actions.className = 'actions'; card.append(actions);
  textNode('button', 'Start project', actions).onclick = () => openProjectForm(p);
  if (p.chart) textNode('button', 'Open chart', actions).onclick = () => { snapshot(); state = structuredClone(p.chart); currentId = p.id; controls(); draw(); draft(); tab('studio'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  textNode('button', 'Edit details', details).onclick = () => openPatternDetails(p);
  textNode('button', 'Delete', details).onclick = () => { if (confirm(`Delete “${p.name}”? Export a backup first if you want to keep it.`) && persist(patterns.filter(x => x.id !== p.id))) { if (currentId === p.id) currentId = null; renderLibrary(); } };
}
function parseYards(t) { const text = String(t).trim(); if (!text) return {yardsMin:null,yardsMax:null}; if (!/^\d[\d,]*(?:\.\d+)?(?:\s*[-–]\s*\d[\d,]*(?:\.\d+)?)?$/.test(text)) throw Error('Enter yardage as 450 or 400–1200, or leave it blank.'); const n=text.split(/\s*[-–]\s*/).map(x=>Number(x.replace(/,/g,''))); if(n.some(x=>!Number.isFinite(x)||x<0||x>=100000)||n.length>1&&n[0]>n[1]) throw Error('Use yardage below 100,000, with the smaller amount first.'); return {yardsMin:n[0],yardsMax:n[1]??n[0]}; }
let editingPatternId = null;
function openPatternDetails(p) { editingPatternId=p.id; $('editPatternName').value=p.name; $('editPatternWeight').value=p.weight; $('editPatternYards').value=p.yardsMin==null&&p.yardsMax==null?'':(p.yardsMin??p.yardsMax)+((p.yardsMax??p.yardsMin)!==(p.yardsMin??p.yardsMax)?'-'+p.yardsMax:''); $('editPatternLink').value=p.link; $('editPatternNotes').value=p.notes; $('patternEditDialog').showModal(); }
weights.forEach(w=>{const o=document.createElement('option');o.value=w;o.textContent=w;$('editPatternWeight').append(o);});
$('cancelPatternEdit').onclick=()=>$('patternEditDialog').close();
$('patternEditForm').onsubmit=e=>{e.preventDefault();try {const next=structuredClone(patterns),p=next.find(p=>p.id===editingPatternId);if(!p)return;const fields={name:$('editPatternName').value.trim()||'Untitled pattern',weight:$('editPatternWeight').value,link:$('editPatternLink').value.trim(),...parseYards($('editPatternYards').value)};if(fields.link&&!safeLink(fields.link))throw Error('Enter a valid http:// or https:// pattern link.');const local=new Set(p.localFields||[]);for(const [k,v] of Object.entries(fields))if(p[k]!==v)local.add(k);Object.assign(p,fields,{notes:$('editPatternNotes').value,localFields:[...local]});if(p.chart)p.chart.name=p.name;if(persist(next)){if(currentId===p.id){state.name=p.name;controls();draw();draft();}$('patternEditDialog').close();renderLibrary();notify('Pattern details saved. Your edits are kept on re-import.');}}catch(err){notify(err.message);}};
let libraryLimits = Object.create(null);
function renderLibrary() {
  const parent = $('patterns'), summary = $('weightSummary'); parent.replaceChildren(); summary.replaceChildren();
  const q = $('search').value.trim().toLowerCase(), src = $('sourceFilter').value;
  $('summaryWrap').hidden = true;
  const shown = patterns.filter(p => ($('filter').value === 'all' || p.weight === $('filter').value) && (src === 'all' || (src === 'mine' ? p.source !== 'ravelry' : p.source === 'ravelry' && (src === 'ravelry' || p.ravFrom === src || p.ravFrom === 'both' || (!p.ravFrom && src === 'favorite')))) && (!q || (p.name + ' ' + (p.designer || '') + ' ' + p.notes).toLowerCase().includes(q)));
  $('libraryResultCount').textContent=shown.length+' matching patterns · '+patterns.length+' in your library';
  if (!shown.length) { textNode('p', patterns.length ? 'No patterns match these filters.' : 'Your collection is waiting for its first pattern. Import your Ravelry favorites, save a chart, or add a pattern below.', parent); return; }
  const sort = $('sortBy').value;
  const key = p => p.yardsMax ?? p.yardsMin ?? (sort === 'yardsAsc' ? Infinity : -1);
  shown.sort(sort === 'name' ? (a, b) => a.name.localeCompare(b.name) : sort === 'yardsAsc' ? (a, b) => key(a) - key(b) : (a, b) => key(b) - key(a));
  if(!$('groupPatterns').checked){
    const cards=textNode('div','',parent);cards.className='cards';const limit=libraryLimits.all||24;
    shown.slice(0,limit).forEach(p=>patternCard(p,cards));
    if(shown.length>limit){const more=textNode('button','Show '+Math.min(24,shown.length-limit)+' more patterns',parent);more.id='library-more-all';more.onclick=()=>{libraryLimits.all=limit+24;renderLibrary();$('library-more-all')?.focus({preventScroll:true});};}
    return;
  }
  for (const w of weights) {
    const group = shown.filter(p => p.weight === w); if (!group.length) continue;
    const known = group.filter(p => p.yardsMin != null || p.yardsMax != null);
    const lo = known.reduce((t, p) => t + (p.yardsMin ?? p.yardsMax), 0), hi = known.reduce((t, p) => t + (p.yardsMax ?? p.yardsMin), 0);
    const avg = known.length ? known.reduce((t, p) => t + ((p.yardsMin ?? p.yardsMax) + (p.yardsMax ?? p.yardsMin)) / 2, 0) / known.length : 0;
    const anchor = 'w' + weights.indexOf(w);
    // summary table row
    const tr = document.createElement('tr'); summary.append(tr);
    const td = document.createElement('td'); const a = textNode('a', w, td); a.href = '#' + anchor; tr.append(td);
    textNode('td', group.length, tr); textNode('td', known.length ? (lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`) : '—', tr); textNode('td', known.length ? fmt(avg) : '—', tr);
    // section
    const sec = document.createElement('section'); sec.className = 'weight-group'; sec.id = anchor; parent.append(sec);
    const h = document.createElement('div'); h.className = 'weight-head'; sec.append(h);
    textNode('h2', w, h);
    textNode('span', `${group.length} pattern${group.length > 1 ? 's' : ''}` + (known.length ? ` · ${lo === hi ? fmt(lo) : fmt(lo) + '–' + fmt(hi)} yds for all${known.length < group.length ? ` (${group.length - known.length} without yardage)` : ''}` : ''), h).className = 'pill';
    const cards = document.createElement('div'); cards.className = 'cards'; sec.append(cards);
    const limit=libraryLimits[w]||24;
    group.slice(0,limit).forEach(p => patternCard(p, cards));
    if(group.length>limit){const more=textNode('button','Show '+Math.min(24,group.length-limit)+' more patterns',sec);more.id='library-more-'+weights.indexOf(w);more.setAttribute('aria-label','Show more '+w+' patterns');more.onclick=()=>{libraryLimits[w]=limit+24;renderLibrary();$(more.id)?.focus({preventScroll:true});};}
  }
  $('summaryWrap').hidden = !summary.children.length;
}
function filterLibrary(){libraryLimits=Object.create(null);renderLibrary();}
for (const id of ['filter', 'sourceFilter', 'sortBy','groupPatterns']) $(id).onchange = filterLibrary; $('search').oninput = filterLibrary;
$('addPattern').onsubmit = e => { e.preventDefault(); try { const link = $('patternLink').value.trim(); if (link && !safeLink(link)) throw Error('Use a valid https:// or http:// pattern link.'); const item = { id: newId(), name: $('patternName').value.trim() || 'Untitled pattern', weight: $('patternWeight').value, notes: $('patternNotes').value, link, ...parseYards($('patternYards').value) }; if (persist([...patterns, item])) { $('addPattern').reset(); renderLibrary(); notify('Pattern added.'); } } catch(err){notify(err.message);} };
// ---------- Ravelry favorites ----------
const RAV_WEIGHT = { thread: 0, cobweb: 0, lace: 0, 'light fingering': 1, fingering: 1, sport: 2, dk: 3, worsted: 4, aran: 4, bulky: 5, 'super bulky': 6, jumbo: 7 };
function ravWeight(name) { const k = String(name).toLowerCase().replace(/\s*\(.*\)/, '').trim(); return k in RAV_WEIGHT ? weights[RAV_WEIGHT[k]] : 'Unspecified'; }
const rav = readStorage('bow-purl-ravelry', {});
$('ravUser').value = rav?.user || ''; $('ravUrl').value = rav?.url || ''; $('ravToken').value = rav?.token || '';
const saveRavSettings = () => writeStorage('bow-purl-ravelry', { user: $('ravUser').value.trim(), url: $('ravUrl').value.trim(), token: $('ravToken').value.trim() });
for (const id of ['ravUser', 'ravUrl', 'ravToken']) $(id).addEventListener('input', saveRavSettings);
// turn a failed request into a message that says what to fix
function connectorError(err, res, data, what) {
  if (err && err.name === 'AbortError') return `${what} took too long. Try again.`;
  if (err && err instanceof TypeError) return `${what}: could not reach your connector. Check the Connector URL, and that ALLOWED_ORIGIN in Cloudflare exactly matches this site's address (https://name.github.io, no trailing slash).`;
  if (res && data && data.error) return `${what}: ${data.error}`;
  if (res && res.status === 401) return `${what}: the app token doesn't match APP_TOKEN in Cloudflare.`;
  if (res && res.status === 403) return `${what}: the connector refused this site. ALLOWED_ORIGIN in Cloudflare must exactly match this site's address.`;
  if (res && res.status === 500) return `${what}: the connector isn't configured. Set ALLOWED_ORIGIN and a 16+ character APP_TOKEN in Cloudflare.`;
  return err ? `${what}: ${err.message}` : `${what} failed (${res ? res.status : 'no response'}).`;
}
$('ravSync').onclick = async () => {
  const user = $('ravUser').value.trim(), url = $('ravUrl').value.trim(), token = $('ravToken').value.trim();
  if (!user) { notify('Enter your Ravelry username.'); return; }
  if (!connectorURL(url)) { notify('Add a valid Ravelry connector URL (https://…). See the README.'); $('ravSettings').open = true; return; }
  writeStorage('bow-purl-ravelry', { user, url, token });
  const btn = $('ravSync'); btn.disabled = true; btn.textContent = 'Importing…';
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 90000);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Token': token }, body: JSON.stringify({ username: user, include: val('ravInclude', 'both') }), signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Error(data.error || `The Ravelry connector returned an error (${res.status}).`);
    if (!Array.isArray(data.patterns)) throw Error('The Ravelry connector returned an unexpected response.');
    let added = 0, updated = 0; const next = structuredClone(patterns);
    for (const r of data.patterns.slice(0, 2000)) {
      if (!Number.isInteger(r.id)) continue;
      const num = v => Number.isFinite(v) && v >= 0 && v < 100000 ? v : null, str = (v, n) => String(v || '').slice(0, n);
      const fields = { name: str(r.name, 100) || 'Untitled pattern', weight: ravWeight(r.weight), yardsMin: num(r.yardsMin), yardsMax: num(r.yardsMax), yardageNote: str(r.yardageNote, 200), sizes: str(r.sizes, 200), designer: str(r.designer, 100), link: /^https:\/\/www\.ravelry\.com\//.test(r.url) ? r.url : '', photo: /^https:\/\//.test(r.photo || '') ? str(r.photo, 499) : '', yarns: Array.isArray(r.yarns) ? r.yarns.filter(y => typeof y === 'string').slice(0, 3).map(y => y.slice(0, 80)) : [], source: 'ravelry', ravFrom: Array.isArray(r.from) && r.from.includes('library') ? (r.from.includes('favorite') ? 'both' : 'library') : 'favorite' };
      const id = 'rav-' + r.id, old = next.find(p => p.id === id);
      if (old) { // keep the knitter's own notes and any yardage they typed in
        const keepYards = old.yardsMin != null && fields.yardsMin == null;
        const was = old.ravFrom || 'favorite';
        if (val('ravInclude', 'both') !== 'both' && was !== fields.ravFrom) fields.ravFrom = 'both'; // a partial import never removes a tag
        for (const key of old.localFields || []) fields[key] = old[key];
        Object.assign(old, fields, keepYards ? { yardsMin: old.yardsMin, yardsMax: old.yardsMax } : {}); updated++;
      } else { next.push({ id, notes: '', ...fields }); added++; }
    }
    if (persist(next)) { $('filter').value = 'all'; $('sourceFilter').value = 'all'; renderLibrary(); const message=`Ravelry: ${added} new and ${updated} updated patterns.` + (data.note ? ' ' + String(data.note).slice(0, 250) : '') + (data.truncated ? ' Import limit reached; this is a partial import.' : ''); $('ravImportResult').textContent=message; notify(message); renderShop(); }
  } catch (err) { const message=err instanceof TypeError || err.name === 'AbortError' ? connectorError(err, null, null, 'Import') : err.message; $('ravImportResult').textContent=message; notify(message); }
  finally { clearTimeout(t); btn.disabled = false; btn.textContent = '↻ Import from Ravelry'; }
};

// ---------- yarn shop ----------
const YD_PER_M = 1 / 0.9144;
function skeinYards() { const n = Number($('shopLen').value); if (!(n > 0 && n < 100000)) return 0; return $('shopUnit').value === 'm' ? n * YD_PER_M : n; }
function renderShop() {
  if (!$('shopResults')) return;
  const list = $('shopResults'); list.replaceChildren();
  const w = $('shopWeight').value, per = skeinYards(), haveInput = Number($('shopHave').value), have = Number.isFinite(haveInput)&&haveInput>=0?haveInput:0;
  const matches = patterns.filter(p => p.weight === w || ($('shopUnspec').checked && p.weight === 'Unspecified'));
  const rows = matches.map(p => {
    const lo = p.yardsMin ?? p.yardsMax, hi = p.yardsMax ?? p.yardsMin;
    const sk = lo == null || !per ? null : [Math.ceil(lo / per), Math.ceil(hi / per)];
    return { p, lo, hi, sk };
  });
  const shown = rows.filter(r => !$('shopFits').checked || (r.sk && r.sk[0] <= have) || !have);
  shown.sort((a, b) => (a.lo == null) - (b.lo == null) || (a.lo ?? 0) - (b.lo ?? 0) || a.p.name.localeCompare(b.p.name));
  const withYds = rows.filter(r => r.lo != null).length;
  $('shopCount').textContent = matches.length ? `${shown.length} pattern${shown.length === 1 ? '' : 's'} for ${w.replace(/^\d • /, '')}${withYds < matches.length ? ` · ${matches.length - withYds} without yardage` : ''}` : '';
  if (!matches.length) { textNode('p', patterns.length ? 'No patterns in your library use this weight yet.' : 'Import your Ravelry favorites and library first (Pattern library tab).', list); return; }
  for (const { p, lo, hi, sk } of shown) {
    const row = document.createElement('article'); row.className = 'shop-row' + (have && sk && sk[0] > have ? ' short' : ''); list.append(row);
    if (p.photo) { const im = document.createElement('img'); im.src = p.photo; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.onerror = () => im.remove(); row.append(im); }
    const body = document.createElement('div'); body.className = 'shop-body'; row.append(body);
    const h = p.link ? textNode('a', p.name, body) : textNode('b', p.name, body); if (p.link) { h.href = p.link; h.target = '_blank'; h.rel = 'noopener noreferrer'; } h.className = 'shop-name';
    if (p.designer) textNode('span', p.designer, body).className = 'muted';
    textNode('span', lo == null ? 'Yardage not listed' : (lo === hi ? `${fmt(lo)} yds` : `${fmt(lo)}–${fmt(hi)} yds`) + (p.sizes ? ' · ' + p.sizes : ''), body).className = 'muted';
    const badge = textNode('div', sk ? (sk[0] === sk[1] ? `${sk[0]}` : `${sk[0]}–${sk[1]}`) : per ? 'Yardage unknown' : 'Enter skein length', row); badge.className = sk ? 'skeins' : 'skeins prompt';
    if(sk)textNode('small',sk[1] === 1 ? 'skein' : 'skeins',badge);
    if (typeof costText === 'function' && lo != null) { const c = costText(p.weight, lo, hi); if (c) textNode('span', c + ' est.', body).className = 'cost'; }
    if (have && sk && sk[0] <= have && sk[1] > have) textNode('span', `Smaller sizes only with ${have}`, body).className = 'warn';
    if (have && sk && sk[0] > have) textNode('span', `Need ${sk[0] - have} more skein${sk[0] - have > 1 ? 's' : ''} for the smallest size`, body).className = 'warn';
  }
}
if ($('shopWeight')) {
weights.forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; $('shopWeight').append(o); });
const shopPrefs = readStorage('bow-purl-shop', {}) || {};
$('shopWeight').value = weights.includes(shopPrefs.w) ? shopPrefs.w : weights[1]; $('shopLen').value = shopPrefs.len || ''; $('shopUnit').value = shopPrefs.unit === 'm' ? 'm' : 'yd';
for (const id of ['shopWeight', 'shopLen', 'shopUnit', 'shopHave', 'shopUnspec', 'shopFits']) $(id).addEventListener('input', () => { writeStorage('bow-purl-shop', { w: $('shopWeight').value, len: $('shopLen').value, unit: $('shopUnit').value }); renderShop(); });
}

// kitten photos: hide any slot whose file hasn't been added yet
document.querySelectorAll('img.kitten').forEach(img => { img.onerror = () => img.closest('figure').classList.add('empty'); if (img.complete && !img.naturalWidth) img.onerror(); });

const saved = readStorage('bow-purl-draft', null);
if (validChart(saved)) { state = saved; currentId = patterns.some(p=>p.id===saved.patternId) ? saved.patternId : null; controls(); draw(); } else { if (saved != null) BPStore.flag('bow-purl-draft', 'The chart draft could not be opened.'); generate(); }

requestAnimationFrame(centerCurrentRow);
