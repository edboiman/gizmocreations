'use strict';
const $ = id => document.getElementById(id);
const val = (id, fallback = '') => $(id)?.value ?? fallback; // tolerate an outdated index.html
window.addEventListener('error', () => { if (!$('shopWeight') || !$('ravInclude')) { const s = $('status'); if (s) s.textContent = 'Some app files are out of date. Re-upload ALL files from the latest ZIP, then refresh.'; } });
const weights = ['0 • Lace','1 • Super fine / Fingering','2 • Fine / Sport','3 • Light / DK','4 • Medium / Worsted / Aran','5 • Bulky','6 • Super bulky','7 • Jumbo','Unspecified'];
const HEX = /^#[\da-f]{6}$/i;
let state = { cols: 32, rows: 32, name: 'My heart cardigan', bg: '#fff6f5', fg: '#cc4c76', ac: '#f2b84b', cells: [], row: 1 };
let history = [], patterns = [], currentId = null, cellW = 16, cellH = 16, drawing = false, lastCell = '', lastImage = null;

let timer;
function notify(msg) { $('status').textContent = msg; clearTimeout(timer); timer = setTimeout(() => $('status').textContent = '', 5500); }
function readStorage(k, f) { try { return JSON.parse(localStorage.getItem(k)) || f; } catch { return f; } }
function writeStorage(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { notify('Storage is unavailable or full. Export your backup and download your chart.'); return false; } }

function validChart(s) {
  if (s && s.ac === undefined) s.ac = '#f2b84b'; // charts saved by version 1
  return s && Number.isInteger(s.cols) && s.cols >= 8 && s.cols <= 120 && Number.isInteger(s.rows) && s.rows >= 8 && s.rows <= 160 &&
    Array.isArray(s.cells) && s.cells.length === s.cols * s.rows && s.cells.every(x => x === 0 || x === 1 || x === 2) &&
    HEX.test(s.bg) && HEX.test(s.fg) && HEX.test(s.ac) && typeof s.name === 'string' && s.name.length <= 100 &&
    Number.isInteger(s.row) && s.row >= 1 && s.row <= s.rows;
}
const optNum = v => v === undefined || v === null || (Number.isFinite(v) && v >= 0 && v < 100000);
const optStr = (v, n) => v === undefined || (typeof v === 'string' && v.length <= n);
function validPattern(p) { return p && optNum(p.yardsMin) && optNum(p.yardsMax) && optStr(p.yardageNote, 200) && optStr(p.sizes, 200) && optStr(p.designer, 100) && optStr(p.source, 20) && optStr(p.ravFrom, 20) && (p.photo === undefined || p.photo === '' || (typeof p.photo === 'string' && p.photo.length < 500 && /^https:\/\//.test(p.photo))) && typeof p.id === 'string' && typeof p.name === 'string' && p.name.length <= 100 && weights.includes(p.weight) && typeof p.notes === 'string' && p.notes.length <= 10000 && typeof p.link === 'string' && (!p.link || /^https?:\/\//i.test(p.link)) && (!p.chart || validChart(p.chart)); }

patterns = readStorage('bow-purl-patterns', []);
if (!Array.isArray(patterns) || !patterns.every(validPattern)) patterns = [];

// ---------- dropdowns ----------
weights.forEach(w => ['patternWeight', 'saveWeight', 'filter'].forEach(id => { const o = document.createElement('option'); o.value = w; o.textContent = w; $(id).append(o); }));
{ const all = document.createElement('option'); all.value = 'all'; all.textContent = 'All yarn weights'; $('filter').prepend(all); $('filter').value = 'all'; }
const validMotif = r => Array.isArray(r) && r.length && r.length <= 160 && r.every(x => typeof x === 'string' && /^[012]{1,120}$/.test(x));
let myMotifs = readStorage('bow-purl-motifs', {});
if (typeof myMotifs !== 'object' || Array.isArray(myMotifs)) myMotifs = {};
for (const k of Object.keys(myMotifs)) if (k.length > 60 || !validMotif(myMotifs[k])) delete myMotifs[k];
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
function snapshot() { history.push(JSON.stringify(state)); if (history.length > 30) history.shift(); $('undo').disabled = false; }
function draft() { writeStorage('bow-purl-draft', state); }
function controls() { $('cols').value = state.cols; $('rows').value = state.rows; $('chartName').value = state.name; $('background').value = state.bg; $('foreground').value = state.fg; $('accent').value = state.ac; }
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
  const c = $('chart'), ctx = c.getContext('2d');
  cellW = 16; cellH = $('knitShape').checked ? 12 : 16;
  c.width = state.cols * cellW + 55; c.height = state.rows * cellH + 44;
  ctx.fillStyle = '#fffdfb'; ctx.fillRect(0, 0, c.width, c.height);
  const colors = [state.bg, state.fg, state.ac];
  for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) {
    ctx.fillStyle = colors[state.cells[y * state.cols + x]];
    ctx.fillRect(30 + x * cellW, 10 + y * cellH, cellW, cellH);
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
  ctx.font = '9px sans-serif'; ctx.fillStyle = '#533744'; ctx.textAlign = 'center';
  for (let y = 0; y < state.rows; y++) { const n = state.rows - y; if (n === 1 || n % 5 === 0) { ctx.fillText(n, 14, 10 + y * cellH + cellH * .75); ctx.fillText(n, 40 + state.cols * cellW, 10 + y * cellH + cellH * .75); } }
  for (let x = 0; x < state.cols; x++) { const n = state.cols - x; if (n === 1 || n % 5 === 0) ctx.fillText(n, 30 + x * cellW + cellW / 2, 26 + state.rows * cellH); }
  const used = new Set(state.cells).size;
  $('chartTitle').textContent = state.name || 'Untitled chart';
  $('dimensions').textContent = `${state.cols} stitches × ${state.rows} rows • ${used} color${used > 1 ? 's' : ''}`;
  $('rowCount').textContent = `Row ${state.row} of ${state.rows}`;
  $('prevRow').disabled = state.row === 1; $('nextRow').disabled = state.row === state.rows; $('undo').disabled = !history.length;
  floatCheck();
}
function floatCheck() { // longest same-color run per row, for stranded knitting
  const max = Number($('floatMax').value) || 7; let worst = 0, rowsOver = 0;
  for (let y = 0; y < state.rows; y++) {
    const counts = {}; let run = 0, prev = -1, rowOver = false;
    for (let x = 0; x < state.cols; x++) { const v = state.cells[y * state.cols + x]; run = v === prev ? run + 1 : 1; prev = v; counts[v] = 1; if (run > worst) worst = run; if (run > max && Object.keys(counts).length > 1) rowOver = true; }
    if (rowOver) rowsOver++;
  }
  $('floatInfo').textContent = rowsOver ? `${rowsOver} row${rowsOver > 1 ? 's have' : ' has'} a color run over ${max} stitches — catch floats there.` : `No floats over ${max} stitches.`;
}

// ---------- generator ----------
function stampGrid(g, d) {
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
    snapshot(); freshState(d, name);
    if (group === 'pattern') {
      const f = PATTERNS[name], s = Math.max(1, Number($('scale').value) || 3);
      for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) { let v = f(x, y, s); if ($('noAccent').checked && v) v = 1; state.cells[y * d.cols + x] = v; }
    } else stampGrid(transform(toGrid(group === 'mine' ? myMotifs[name] : MOTIFS[group][name])), d);
    if ($('invert').checked) state.cells = state.cells.map(v => v === 0 ? 1 : v === 1 ? 0 : 2);
    addBorder(d);
    draw(); draft();
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
  try { const d = dimensions(); const g = toGrid(lines); snapshot(); freshState(d, 'Custom grid'); stampGrid(transform(g), d); draw(); draft(); notify('Your grid was placed on the chart.'); } catch (err) { notify(err.message); }
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
  const aspect = $('knitShape').checked ? 0.75 : 1;
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
  try { lastImage?.close?.(); lastImage = await createImageBitmap(file); snapshot(); convertImage(); $('imageTools').hidden = false; notify('Image converted. Adjust the sliders, then tap squares to refine.'); }
  catch { notify('Could not read this image. Try a PNG or JPEG.'); } finally { e.target.value = ''; }
};
let imgTimer;
for (const id of ['threshold', 'contrast', 'imgColors', 'dither', 'imgInvert', 'cleanup', 'fit']) $(id).addEventListener('input', () => { $('thresholdVal').textContent = $('threshold').value; $('contrastVal').textContent = $('contrast').value + '%'; clearTimeout(imgTimer); imgTimer = setTimeout(() => { try { convertImage(); } catch (err) { notify(err.message); } }, 60); });

// ---------- AI connector ----------
$('aiEndpoint').value = AI.endpoint(); $('aiToken').value = AI.token();
$('saveAi').onclick = () => { const u = $('aiEndpoint').value.trim(); if (u && !/^https:\/\//i.test(u)) { notify('The connector URL must start with https://'); return; } AI.setEndpoint(u); AI.setToken($('aiToken').value.trim()); notify(u ? 'AI connector saved on this device.' : 'AI connector removed.'); };
$('aiGo').onclick = async () => {
  const prompt = $('aiPrompt').value.trim(); if (!prompt) { notify('Describe what you want to knit first.'); return; }
  const btn = $('aiGo'); btn.disabled = true; btn.textContent = 'Designing…';
  try { const d = dimensions(); const rows = await AI.generate(prompt, d.cols, d.rows); snapshot(); freshState(d, prompt.slice(0, 60)); const sc = $('scale').value; $('scale').value = $('layout').value === 'single' ? '1' : sc; stampGrid(transform(toGrid(rows)), d); $('scale').value = sc; draw(); draft(); notify('AI chart ready. Review it before knitting.'); }
  catch (err) { notify(err.message); } finally { btn.disabled = false; btn.textContent = '✦ Design with AI'; }
};

// ---------- editing ----------
$('chartName').oninput = () => { state.name = $('chartName').value; draw(); draft(); };
for (const [id, key] of [['background', 'bg'], ['foreground', 'fg'], ['accent', 'ac']]) $(id).onchange = () => { snapshot(); state[key] = $(id).value; draw(); draft(); };
for (const id of ['knitShape', 'gridTen', 'floatMax']) $(id).onchange = draw;
$('palette').onchange = () => { const [bg, fg, ac] = $('palette').value.split(','); if (!bg) return; $('background').value = bg; $('foreground').value = fg; $('accent').value = ac; snapshot(); Object.assign(state, { bg, fg, ac }); draw(); draft(); };
$('undo').onclick = () => { if (!history.length) return; state = JSON.parse(history.pop()); controls(); draw(); draft(); };
$('clearChart').onclick = () => { snapshot(); state.cells = state.cells.map(() => 0); draw(); draft(); };
$('mirrorChart').onclick = () => { snapshot(); const n = []; for (let y = 0; y < state.rows; y++) n.push(...state.cells.slice(y * state.cols, (y + 1) * state.cols).reverse()); state.cells = n; draw(); draft(); };
$('invertChart').onclick = () => { snapshot(); state.cells = state.cells.map(v => v === 2 ? 2 : 1 - v); draw(); draft(); };
function paint(e) {
  const c = $('chart'), r = c.getBoundingClientRect();
  const x = Math.floor(((e.clientX - r.left) * c.width / r.width - 30) / cellW), y = Math.floor(((e.clientY - r.top) * c.height / r.height - 10) / cellH);
  if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return;
  const key = x + ',' + y; if (key === lastCell) return; lastCell = key;
  const v = Number($('paint').value), size = Number($('brush').value);
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) { const tx = x + dx, ty = y + dy; if (tx < state.cols && ty < state.rows) state.cells[ty * state.cols + tx] = v; }
  draw();
}
$('chart').onpointerdown = e => { snapshot(); drawing = true; lastCell = ''; $('chart').setPointerCapture(e.pointerId); paint(e); };
$('chart').onpointermove = e => { if (drawing) paint(e); };
function finishPaint() { if (drawing) { drawing = false; draft(); } }
$('chart').onpointerup = finishPaint; $('chart').onpointercancel = finishPaint;

// ---------- export ----------
function download(blob, name) { const a = document.createElement('a'), url = URL.createObjectURL(blob); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
$('png').onclick = () => $('chart').toBlob(b => { if (b) download(b, 'bow-and-purl-chart.png'); });
$('print').onclick = () => window.print();

// ---------- tabs & library ----------
function tab(id) { for (const el of document.querySelectorAll('main>section:not(.hero)')) el.hidden = el.id !== id; document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === id)); if (id === 'library') renderLibrary(); if (id === 'shop') if ($('shopResults')) renderShop(); }
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => tab(b.dataset.tab));
$('saveChart').onclick = () => { const p = patterns.find(p => p.id === currentId); $('saveWeight').value = p?.weight || weights[3]; $('saveNotes').value = p?.notes || ''; $('saveDialog').showModal(); };
$('cancelSave').onclick = () => $('saveDialog').close();
function persist(next) { if (writeStorage('bow-purl-patterns', next)) { patterns = next; return true; } return false; }
$('saveForm').onsubmit = e => { e.preventDefault(); const id = currentId || crypto.randomUUID(); const item = { id, name: state.name || 'Untitled chart', weight: $('saveWeight').value, notes: $('saveNotes').value, link: '', chart: structuredClone(state) }; if (persist([...patterns.filter(p => p.id !== id), item])) { currentId = id; $('saveDialog').close(); notify('Pattern saved to your collection.'); } };
function changeRow(n) { state.row = Math.max(1, Math.min(state.rows, state.row + n)); draw(); draft(); if (currentId) { const next = structuredClone(patterns), p = next.find(p => p.id === currentId); if (p) { p.chart.row = state.row; persist(next); } } }
$('prevRow').onclick = () => changeRow(-1); $('nextRow').onclick = () => changeRow(1); $('resetRow').onclick = () => changeRow(1 - state.row);
function textNode(tag, text, parent) { const el = document.createElement(tag); el.textContent = text; parent.append(el); return el; }
function thumb(chart) { const c = document.createElement('canvas'), s = Math.max(2, Math.floor(200 / Math.max(chart.cols, chart.rows))); c.width = chart.cols * s; c.height = chart.rows * s; const ctx = c.getContext('2d'), col = [chart.bg, chart.fg, chart.ac]; chart.cells.forEach((v, i) => { ctx.fillStyle = col[v]; ctx.fillRect((i % chart.cols) * s, Math.floor(i / chart.cols) * s, s, s); }); c.className = 'thumb'; return c; }
const fmt = n => Math.round(n).toLocaleString();
function yardText(p) { if (p.yardsMin == null && p.yardsMax == null) return ''; const a = p.yardsMin ?? p.yardsMax, b = p.yardsMax ?? a; return a === b ? `${fmt(a)} yds` : `${fmt(a)}–${fmt(b)} yds`; }
function patternCard(p, parent) {
  const card = document.createElement('article'); card.className = 'panel card'; parent.append(card);
  if (p.chart) card.append(thumb(p.chart));
  else if (p.photo) { const im = document.createElement('img'); im.src = p.photo; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.onerror = () => im.remove(); card.append(im); }
  const tag = textNode('span', p.source === 'ravelry' ? ({ library: 'In my Ravelry library', both: 'Favorite · in my library' }[p.ravFrom] || 'Ravelry favorite') : p.chart ? 'Bow & Purl chart' : 'Saved pattern', card); tag.className = 'eyebrow';
  textNode('h2', p.name, card);
  if (p.designer) textNode('p', 'by ' + p.designer, card).className = 'muted';
  const y = yardText(p); if (y) textNode('p', '🧶 ' + y + (p.yardageNote ? ' · ' + p.yardageNote : ''), card).className = 'yards';
  else textNode('p', 'Yardage not listed — tap Edit details to add it.', card).className = 'muted';
  if (p.sizes) textNode('p', 'Sizes: ' + p.sizes, card).className = 'muted';
  if (p.chart) textNode('p', `${p.chart.cols} stitches × ${p.chart.rows} rows · Row ${p.chart.row}`, card);
  if (p.notes) textNode('p', p.notes, card);
  if (p.link) { const a = textNode('a', p.source === 'ravelry' ? 'Open on Ravelry ↗' : 'Open pattern ↗', card); a.href = p.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  const actions = document.createElement('div'); actions.className = 'actions'; card.append(actions);
  if (p.chart) textNode('button', 'Open chart', actions).onclick = () => { snapshot(); state = structuredClone(p.chart); currentId = p.id; controls(); draw(); draft(); tab('studio'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  textNode('button', 'Edit details', actions).onclick = () => {
    const name = window.prompt('Pattern name', p.name); if (name === null) return;
    const yd = window.prompt('Yards needed (e.g. 450 or 400-1200; blank if unknown)', yardText(p).replace(/[^\d–-]/g, '').replace('–', '-')); if (yd === null) return;
    const notes = window.prompt('Pattern notes', p.notes); if (notes === null) return;
    const next = structuredClone(patterns), n = next.find(x => x.id === p.id);
    n.name = name.slice(0, 100) || 'Untitled pattern'; n.notes = notes.slice(0, 10000); Object.assign(n, parseYards(yd)); if (n.chart) n.chart.name = n.name;
    if (persist(next)) renderLibrary();
  };
  textNode('button', 'Delete', actions).onclick = () => { if (confirm(`Delete “${p.name}”? Export a backup first if you want to keep it.`) && persist(patterns.filter(x => x.id !== p.id))) { if (currentId === p.id) currentId = null; renderLibrary(); } };
}
function parseYards(t) { const n = String(t).match(/\d[\d,]*/g)?.map(x => Number(x.replace(/,/g, ''))).filter(x => x < 100000) || []; return { yardsMin: n.length ? n[0] : null, yardsMax: n.length ? (n[1] ?? n[0]) : null }; }
function renderLibrary() {
  const parent = $('patterns'), summary = $('weightSummary'); parent.replaceChildren(); summary.replaceChildren();
  const q = $('search').value.trim().toLowerCase(), src = $('sourceFilter').value;
  const shown = patterns.filter(p => ($('filter').value === 'all' || p.weight === $('filter').value) && (src === 'all' || (src === 'mine' ? p.source !== 'ravelry' : p.source === 'ravelry' && (src === 'ravelry' || p.ravFrom === src || p.ravFrom === 'both' || (!p.ravFrom && src === 'favorite')))) && (!q || (p.name + ' ' + (p.designer || '') + ' ' + p.notes).toLowerCase().includes(q)));
  if (!shown.length) { textNode('p', patterns.length ? 'No patterns match these filters.' : 'Your collection is waiting for its first pattern. Import your Ravelry favorites, save a chart, or add a pattern below.', parent); return; }
  const sort = $('sortBy').value;
  const key = p => p.yardsMax ?? p.yardsMin ?? (sort === 'yardsAsc' ? Infinity : -1);
  shown.sort(sort === 'name' ? (a, b) => a.name.localeCompare(b.name) : sort === 'yardsAsc' ? (a, b) => key(a) - key(b) : (a, b) => key(b) - key(a));
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
    group.forEach(p => patternCard(p, cards));
  }
  $('summaryWrap').hidden = !summary.children.length;
}
for (const id of ['filter', 'sourceFilter', 'sortBy']) $(id).onchange = renderLibrary; $('search').oninput = renderLibrary;
$('addPattern').onsubmit = e => { e.preventDefault(); const link = $('patternLink').value.trim(); if (link && !/^https?:\/\//i.test(link)) { notify('Use an https:// or http:// pattern link.'); return; } const item = { id: crypto.randomUUID(), name: $('patternName').value.trim() || 'Untitled pattern', weight: $('patternWeight').value, notes: $('patternNotes').value, link, ...parseYards($('patternYards').value) }; if (persist([...patterns, item])) { $('addPattern').reset(); renderLibrary(); notify('Pattern added.'); } };
$('backup').onclick = () => download(new Blob([JSON.stringify({ app: 'bow-and-purl', version: 2, patterns, motifs: myMotifs }, null, 2)], { type: 'application/json' }), 'bow-and-purl-backup.json');
$('restore').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    if (f.size > 10 * 1024 * 1024) throw Error('Backup too large (maximum 10 MB).');
    const data = JSON.parse(await f.text());
    if (data.app !== 'bow-and-purl' || ![1, 2].includes(data.version) || !Array.isArray(data.patterns) || data.patterns.length > 3000 || !data.patterns.every(validPattern)) throw Error('This is not a valid Bow & Purl backup.');
    const ids = new Set(patterns.map(p => p.id)); const added = data.patterns.filter(p => { if (ids.has(p.id)) return false; ids.add(p.id); return true; });
    let m = 0; const motifs = data.motifs && typeof data.motifs === 'object' ? data.motifs : {};
    const nextM = { ...myMotifs }; for (const [k, r] of Object.entries(motifs)) if (k.length <= 60 && validMotif(r) && !nextM[k]) { nextM[k] = r; m++; }
    if (m && writeStorage('bow-purl-motifs', nextM)) { myMotifs = nextM; buildMotifMenu($('motif').value); }
    if (persist([...patterns, ...added])) { renderLibrary(); notify(`Restored ${added.length} new patterns and ${m} motifs. Existing items were kept.`); }
  } catch (err) { notify(err.message); } finally { e.target.value = ''; }
};

// ---------- Ravelry favorites ----------
const RAV_WEIGHT = { thread: 0, cobweb: 0, lace: 0, 'light fingering': 1, fingering: 1, sport: 2, dk: 3, worsted: 4, aran: 4, bulky: 5, 'super bulky': 6, jumbo: 7 };
function ravWeight(name) { const k = String(name).toLowerCase().replace(/\s*\(.*\)/, '').trim(); return k in RAV_WEIGHT ? weights[RAV_WEIGHT[k]] : 'Unspecified'; }
const rav = readStorage('bow-purl-ravelry', {});
$('ravUser').value = rav.user || ''; $('ravUrl').value = rav.url || ''; $('ravToken').value = rav.token || '';
$('ravSync').onclick = async () => {
  const user = $('ravUser').value.trim(), url = $('ravUrl').value.trim(), token = $('ravToken').value.trim();
  if (!user) { notify('Enter your Ravelry username.'); return; }
  if (!/^https:\/\//i.test(url)) { notify('Add your Ravelry connector URL (https://…). See the README.'); $('ravSettings').open = true; return; }
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
      const fields = { name: str(r.name, 100) || 'Untitled pattern', weight: ravWeight(r.weight), yardsMin: num(r.yardsMin), yardsMax: num(r.yardsMax), yardageNote: str(r.yardageNote, 200), sizes: str(r.sizes, 200), designer: str(r.designer, 100), link: /^https:\/\/www\.ravelry\.com\//.test(r.url) ? r.url : '', photo: /^https:\/\//.test(r.photo || '') ? str(r.photo, 499) : '', source: 'ravelry', ravFrom: Array.isArray(r.from) && r.from.includes('library') ? (r.from.includes('favorite') ? 'both' : 'library') : 'favorite' };
      const id = 'rav-' + r.id, old = next.find(p => p.id === id);
      if (old) { // keep the knitter's own notes and any yardage they typed in
        const keepYards = old.yardsMin != null && fields.yardsMin == null;
        const was = old.ravFrom || 'favorite';
        if (val('ravInclude', 'both') !== 'both' && was !== fields.ravFrom) fields.ravFrom = 'both'; // a partial import never removes a tag
        Object.assign(old, fields, keepYards ? { yardsMin: old.yardsMin, yardsMax: old.yardsMax } : {}); updated++;
      } else { next.push({ id, notes: '', ...fields }); added++; }
    }
    if (persist(next)) { $('filter').value = 'all'; $('sourceFilter').value = 'all'; renderLibrary(); notify(`Ravelry: ${added} new and ${updated} updated patterns.` + (data.note ? ' ' + String(data.note).slice(0, 120) : '')); renderShop(); }
  } catch (err) { notify(err.name === 'AbortError' ? 'Ravelry took too long. Try again.' : err.message); }
  finally { clearTimeout(t); btn.disabled = false; btn.textContent = '↻ Import from Ravelry'; }
};

// ---------- yarn shop ----------
const YD_PER_M = 1.0936;
function skeinYards() { const n = Number($('shopLen').value); if (!(n > 0 && n < 100000)) return 0; return $('shopUnit').value === 'm' ? n * YD_PER_M : n; }
function renderShop() {
  if (!$('shopResults')) return;
  const list = $('shopResults'); list.replaceChildren();
  const w = $('shopWeight').value, per = skeinYards(), have = Number($('shopHave').value) || 0;
  const matches = patterns.filter(p => p.weight === w || ($('shopUnspec').checked && p.weight === 'Unspecified'));
  const rows = matches.map(p => {
    const lo = p.yardsMin ?? p.yardsMax, hi = p.yardsMax ?? p.yardsMin;
    const sk = lo == null || !per ? null : [Math.ceil(lo / per), Math.ceil(hi / per)];
    return { p, lo, hi, sk };
  });
  const ok = r => !have || !r.sk || r.sk[0] <= have;
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
    const badge = textNode('div', sk ? (sk[0] === sk[1] ? `${sk[0]}` : `${sk[0]}–${sk[1]}`) : '?', row); badge.className = 'skeins';
    textNode('small', sk ? (sk[1] === 1 ? 'skein' : 'skeins') : per ? 'no yardage' : 'enter skein size', badge);
    if (have && sk && sk[0] <= have && sk[1] > have) textNode('span', `Smaller sizes only with ${have}`, body).className = 'warn';
    if (have && sk && sk[0] > have) textNode('span', `Need ${sk[0] - have} more skein${sk[0] - have > 1 ? 's' : ''} for the smallest size`, body).className = 'warn';
  }
}
if ($('shopWeight')) {
weights.forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; $('shopWeight').append(o); });
const shopPrefs = readStorage('bow-purl-shop', {});
$('shopWeight').value = weights.includes(shopPrefs.w) ? shopPrefs.w : weights[1]; $('shopLen').value = shopPrefs.len || ''; $('shopUnit').value = shopPrefs.unit === 'm' ? 'm' : 'yd';
for (const id of ['shopWeight', 'shopLen', 'shopUnit', 'shopHave', 'shopUnspec', 'shopFits']) $(id).addEventListener('input', () => { writeStorage('bow-purl-shop', { w: $('shopWeight').value, len: $('shopLen').value, unit: $('shopUnit').value }); renderShop(); });
}

// kitten photos: hide any slot whose file hasn't been added yet
document.querySelectorAll('img.kitten').forEach(img => { img.onerror = () => img.closest('figure').classList.add('empty'); if (img.complete && !img.naturalWidth) img.onerror(); });

const saved = readStorage('bow-purl-draft', null);
if (validChart(saved)) { state = saved; controls(); draw(); } else generate();
