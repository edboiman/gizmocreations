'use strict';
// Original, curated project briefs. No network requests or generated patterns.
const IDEA_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const IDEA_SKILLS = { beginner: 'Beginner', confident: 'Confident beginner', intermediate: 'Intermediate' };
// title, weight index, skill, planning yards min/max, motif, brief, next step
const IDEA_SEASONS = [
  ['Deep winter', 'Small comforts for chilly days.', '#fff6f5,#506f89,#c9a34b', [
    ['Snow-day cowl',5,'confident',160,260,'Snowflake','A soft, close-fitting cowl with a little snowy colorwork.','Choose a wool blend; swatch the stranded section in the round.'],
    ['First garter scarf',6,'beginner',220,350,'Stripes','A squishy scarf in two generous blocks of color.','Knit a rectangle in garter stitch; choose a scarf width from a swatch.'],
    ['Winter mug mat',4,'beginner',35,65,'Star','A small square for the table beside your knitting.','Use washable cotton and a textured stitch; add a duplicate-stitch star.']
  ]],
  ['Winter light', 'Warm hands, soft colors and satisfying small finishes.', '#fff4f4,#b75076,#cc9f55', [
    ['Rosebud headband',4,'beginner',80,130,'Flower','A rosy garter band with a simple seam.','Swatch for the head circumference and allow for stretch before seaming.'],
    ['Little wrist warmers',3,'confident',140,220,'Heart','A pair of fingerless mitts with a tiny heart detail.','Use a tested thumb-opening pattern; add the motif with duplicate stitch.'],
    ['Soft sofa cushion',6,'beginner',280,450,'Checks','A textured cushion cover in warm, gentle colors.','Measure your insert and knit two swatched rectangles to seam.']
  ]],
  ['Early spring', 'Lighter layers and the first little garden motifs.', '#f6f3dc,#66815a,#d5a4b2', [
    ['New-leaf neckerchief',2,'confident',180,280,'Leaf','A small triangular scarf for changeable weather.','Choose a tested increase pattern; try a cotton-wool blend for drape.'],
    ['Seed-stitch washcloths',4,'beginner',70,110,'Flower','A cheerful cotton square for everyday use.','Alternate knit and purl stitches; check whether the yarn is machine washable.'],
    ['Garden ankle socks',1,'intermediate',220,350,'Tulip','Short socks with a tiny flower at the cuff.','Use a sock pattern with your gauge and a durable sock yarn.']
  ]],
  ['Spring garden', 'Fresh colors, cotton yarn and useful little makes.', '#f4f4e4,#688d78,#dc8fa9', [
    ['Tulip cushion',4,'confident',300,480,'Tulip','A spring cushion with a narrow band of flowers.','Work from the insert measurements and keep a plain back.'],
    ['Light market bag',3,'intermediate',250,400,'Diamond','A compact shopping bag with a textured or openwork body.','Use strong cotton or linen and a tested handle construction.'],
    ['Rainy-day bookmark',2,'beginner',20,40,'Leaf','A slim, flat bookmark that uses a little leftover yarn.','Choose a non-curling border and block it flat; skip bulky tassels.']
  ]],
  ['Late spring', 'Small botanical details and projects to take outside.', '#fff4e3,#a24f6a,#73966e', [
    ['Blossom bandana',1,'confident',180,300,'Flower','An airy neck scarf in a favorite garden color.','Pick a triangular pattern and swatch for a light, comfortable fabric.'],
    ['Cotton picnic squares',4,'beginner',70,120,'Checks','Reusable cotton cloths in a mix of cheerful colors.','Make a simple square with a garter border; weave ends securely.'],
    ['Wildflower summer top',3,'intermediate',650,1100,'Tulip','A simple summer top with one flower band at the hem.','Choose a garment pattern for your measurements; check its size-specific yardage.']
  ]],
  ['Early summer', 'Portable projects and lighter fibers.', '#fffae6,#4f8490,#df9b57', [
    ['Sunny sunglasses sleeve',3,'beginner',45,80,'Sun','A small knitted sleeve for glasses, with a bright sun detail.','Knit a rectangle and seam it; add soft lining to protect the lenses.'],
    ['Linen summer wrap',0,'confident',600,900,'Stripes','A simple, loose wrap for cool evenings.','Swatch a loose fabric with stable edges; block before measuring length.'],
    ['Strawberry sock cuffs',1,'intermediate',350,450,'Strawberry','Light socks with berries around the top.','Follow a sock pattern and swatch the colorwork cuff for stretch.']
  ]],
  ['High summer', 'Keep the project small and the colors playful.', '#fff5df,#bd5663,#80a79b', [
    ['Cherry drink coasters',4,'beginner',30,55,'Cherries','A little set of cotton squares with cherry details.','Knit plain squares and duplicate-stitch the fruit after blocking.'],
    ['Breezy cotton headband',2,'beginner',70,110,'Stripes','A light garter band for warm days.','Choose soft cotton; swatch and check the fit because cotton has little bounce.'],
    ['Seaside tote',4,'intermediate',350,550,'Zigzag','A sturdy striped tote for a book and a small project.','Use a tested bag construction with reinforced handles; consider a fabric lining.']
  ]],
  ['Late summer', 'A little stash clearing before the next season.', '#fff2e1,#a96855,#8e9d69', [
    ['Scrap-yarn bunting',3,'confident',100,180,'Diamond','Little knitted triangles in leftover summer colors.','Use matching yarn weights; sew triangles securely to fabric tape for display.'],
    ['Pocket project pouch',4,'beginner',100,180,'Cat face','A small seamed pouch for stitch markers and notions.','Knit a rectangle, fold and seam; line it so small notions cannot slip through.'],
    ['Transition shawlette',1,'intermediate',350,500,'Leaf','A compact shawl to start before the evenings cool.','Use a tested shawl pattern and plan the border before using the last of the yarn.']
  ]],
  ['Early autumn', 'Start a comfortable layer while there is time to enjoy it.', '#fff0de,#a06045,#7c8753', [
    ['First cool-day beanie',4,'confident',170,260,'Leaf','A ribbed hat with a simple leaf band.','Use a tested hat pattern for the crown shaping and your head measurement.'],
    ['Moss-stitch scarf',5,'beginner',300,450,'Checks','A warm textured scarf in an earthy shade.','Swatch moss stitch and choose a non-curling edge; measure the width as you go.'],
    ['Woodland cardigan',3,'intermediate',1100,1700,'Mushroom','A cardigan idea with small woodland details at the pockets.','Choose a garment pattern for your size; verify yardage and fit before buying yarn.']
  ]],
  ['Autumn evenings', 'Rich colors, warm hands and a little woodland whimsy.', '#fff0db,#99553f,#bb8c42', [
    ['Mushroom wrist warmers',3,'confident',150,230,'Mushroom','Little mitts with a woodland band at the wrists.','Use a tested mitt pattern; duplicate stitch is an easy way to add the motif.'],
    ['Harvest table squares',4,'beginner',70,120,'Leaf','Cotton table mats in ochre, rust and cream.','Knit small garter or seed-stitch squares and block them to the same size.'],
    ['Woodland colorwork cowl',4,'intermediate',220,350,'Pine tree','A warm circular cowl with a line of little trees.','Swatch the colorwork; keep the floats loose and check the circumference.']
  ]],
  ['Late autumn', 'Useful gifts and warm layers that are easy to pick up again.', '#f5eee4,#795b78,#bc965b', [
    ['Giftable ribbed hat',5,'confident',130,210,'Star','A quick hat in a versatile color.','Use a tested ribbed hat pattern; check the recipient’s head size and fiber preferences.'],
    ['Tea-break mug cozy',3,'beginner',35,65,'Teacup','A small removable band for a favorite mug.','Measure around the mug; keep the band below the rim and away from the handle.'],
    ['Chunky reading blanket',7,'beginner',450,750,'Checks','A lap blanket built from simple textured blocks.','Swatch and weigh a sample to estimate yarn for your chosen dimensions.']
  ]],
  ['Winter gathering', 'Small keepsakes and cozy projects for the end of the year.', '#fff5e6,#496b5b,#b74e58', [
    ['Snowflake mittens',4,'intermediate',200,320,'Snowflake','Warm mittens with a small snowy panel on the back.','Use a tested mitten pattern; check thumb placement and the colorwork gauge.'],
    ['Tiny tree decorations',3,'confident',20,45,'Pine tree','Small flat knitted decorations made from scraps.','Use a shaped ornament pattern or knit a square and embroider the tree.'],
    ['Evening garter cowl',6,'beginner',130,220,'Stripes','A thick, soft cowl in one or two calming colors.','Knit a swatched rectangle and seam it into a loop at a comfortable circumference.']
  ]]
];
const IDEA_CALENDAR = [
  ['New-year stash squares',4,'beginner',60,100,'Checks','Turn a few leftovers into squares for a future blanket.','Pick one finished square size and one yarn weight so the pieces will join neatly.'],
  ['Little heart keepsake',3,'confident',25,50,'Heart','A tiny February keepsake or heart-decorated square.','Knit a small square and duplicate-stitch a heart; add it to a card or gift.'],
  ['Lucky green bookmark',2,'beginner',20,40,'Leaf','A small green bookmark for a March reading project.','Use a stable, non-curling stitch and add a small leaf motif.'],
  ['Earth-month cleaning cloth',4,'beginner',70,110,'Leaf','A reusable cotton cloth to replace a disposable one.','Use washable cotton and texture for scrubbing; make a loop for drying.'],
  ['A handmade thank-you',3,'confident',40,75,'Flower','A little flower-decorated pouch for someone you appreciate.','Knit and seam a small rectangle; add a lining if it will hold small items.'],
  ['Rainbow pocket square',3,'beginner',60,100,'Stripes','A June celebration of favorite colors, one stripe at a time.','Use scraps of the same weight and make a small garter square or patch.'],
  ['Summer memory patch',2,'confident',25,50,'Sun','A tiny sun patch to remember a happy July day.','Make a small swatch with a garter border, then add a duplicate-stitch sun.'],
  ['Cat-day notions pouch',4,'beginner',100,170,'Cat face','Celebrate August’s cat theme with a pouch for your knitting tools.','Knit a rectangle, seam it, add a lining, then stitch a little cat face.'],
  ['Get-ahead gift set',4,'beginner',150,230,'Heart','Start a small set of cotton gift cloths before the year gets busy.','Choose three matching colors and make a set with the same finished dimensions.'],
  ['Little ghost garland',3,'confident',50,100,'Ghost','A playful October decoration in cream and charcoal.','Knit small rectangular flags, add ghost motifs and sew them onto display tape.'],
  ['Gratitude leaf square',4,'beginner',55,90,'Leaf','A small November square to pair with a handwritten thank-you.','Make a textured cotton square and add a duplicate-stitch leaf.'],
  ['Year-end gift tags',2,'confident',20,40,'Star','Reusable little knitted tags for a December gift.','Knit a small rectangle with stable edges; add a star and a fabric hanging loop.']
];
const ideaPrefs = readStorage('bow-purl-season-prefs', {});
$('ideaHemisphere').value = ideaPrefs?.hemisphere === 'south' ? 'south' : 'north';
IDEA_MONTHS.forEach((m, i) => { const o = document.createElement('option'); o.value = i; o.textContent = m; $('ideaMonth').append(o); });
weights.slice(0,8).forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; $('ideaWeight').append(o); });
let ideaFollowsClock = true;
$('ideaMonth').value = new Date().getMonth();
function ideaEntry(row, id, calendar) {
  const [name, wi, skill, lo, hi, motif, brief, step] = row;
  return { id, name, weight: weights[wi], skill, lo, hi, motif, brief, step, calendar };
}
function ideasFor(month, south) {
  const season = (month + (south ? 6 : 0)) % 12;
  return [...IDEA_SEASONS[season][3].map((r,i) => ideaEntry(r, `season-${season}-${i}`, false)), ideaEntry(IDEA_CALENDAR[month], `calendar-${month}`, true)];
}
function ideaStashMatch(idea) {
  return stash.filter(s => s.weight === idea.weight && stashTotal(s) != null && stashTotal(s) >= Math.ceil(idea.hi * 1.1));
}
function renderIdeas() {
  const month = Number($('ideaMonth').value), south = $('ideaHemisphere').value === 'south';
  const profile = IDEA_SEASONS[(month + (south ? 6 : 0)) % 12];
  $('ideaSeason').textContent = profile[0];
  $('ideaHeading').textContent = `${IDEA_MONTHS[month]}, one stitch at a time.`;
  $('ideaIntro').textContent = profile[1];
  const shown = ideasFor(month, south).filter(i => ($('ideaWeight').value === 'all' || i.weight === $('ideaWeight').value) && ($('ideaSkill').value === 'all' || i.skill === $('ideaSkill').value) && (!$('ideaStash').checked || ideaStashMatch(i).length));
  const box = $('ideaCards'); box.replaceChildren();
  $('ideaCount').textContent = `${shown.length} of 4 ideas for ${IDEA_MONTHS[month]} · curated and available offline`;
  if (!shown.length) {
    const empty = textNode('div', '', box); empty.className = 'panel idea-empty';
    textNode('h3', 'A different stitch might fit.', empty);
    textNode('p', 'Try another month, widen your filters, or add a yarn to My stash. Stash matches use one yarn entry and the upper yardage estimate plus 10%; colors and fiber still need checking.', empty);
    textNode('button', 'Clear filters', empty).onclick = () => { $('ideaWeight').value = 'all'; $('ideaSkill').value = 'all'; $('ideaStash').checked = false; renderIdeas(); };
  }
  for (const idea of shown) {
    const card = document.createElement('article'); card.className = 'panel idea-card'; box.append(card);
    const top = textNode('div', '', card); top.className = 'idea-card-top';
    const preview = document.createElement('canvas'); preview.width = 104; preview.height = 80; preview.className = 'idea-preview'; preview.setAttribute('aria-hidden', 'true');
    const group = Object.keys(MOTIFS).find(g => Object.hasOwn(MOTIFS[g], idea.motif));
    const grid = group ? toGrid(MOTIFS[group][idea.motif]) : Array.from({length:8},(_,y) => Array.from({length:12},(_,x) => (PATTERNS[idea.motif] || PATTERNS.Stripes)(x,y,2)));
    const colors = profile[2].split(','), ctx = preview.getContext('2d'); ctx.fillStyle = colors[0]; ctx.fillRect(0,0,104,80);
    const unit = Math.min(8,Math.floor(88/grid[0].length),Math.floor(64/grid.length));
    grid.forEach((r,y) => r.forEach((v,x) => { ctx.fillStyle = colors[v]; ctx.fillRect((104-r.length*unit)/2+x*unit,(80-grid.length*unit)/2+y*unit,unit-1,unit-1); })); top.append(preview);
    const meta = textNode('div', '', top); textNode('span', idea.calendar ? 'THIS MONTH’S LITTLE EXTRA' : profile[0].toUpperCase(), meta).className = 'eyebrow'; textNode('h3', idea.name, meta);
    textNode('p', idea.brief, card);
    const tags = textNode('div', '', card); tags.className = 'idea-tags';
    [idea.weight.replace(/^\d • /,''), IDEA_SKILLS[idea.skill], `≈ ${idea.lo}–${idea.hi} yds`].forEach(t => textNode('span',t,tags));
    textNode('p', idea.step, card).className = 'idea-step';
    const matches = ideaStashMatch(idea);
    if (matches.length) textNode('p', `Stash to check: ${matches[0].brand} (${fmt(stashTotal(matches[0]))} yds). Enough for this estimate plus 10%; verify fiber, colors and gauge.`, card).className = 'idea-stash';
    const actions = textNode('div', '', card); actions.className = 'actions';
    const saved = patterns.some(p => p.id === 'idea-' + idea.id), save = textNode('button', saved ? '✓ Saved to library' : '♡ Save idea', actions); save.disabled = saved; save.className = 'primary';
    save.onclick = () => {
      const item = { id: 'idea-' + idea.id, name: idea.name, source: 'seasonal', weight: idea.weight, yardsMin: idea.lo, yardsMax: idea.hi, yardageNote: 'Project planning estimate; verify your size and gauge', link: '', notes: `${IDEA_MONTHS[month]} idea · ${IDEA_SKILLS[idea.skill]}\n${idea.brief}\n${idea.step}\nMotif idea: ${idea.motif}. This is a project brief, not a complete knitting pattern. Yardage is approximate; allow for your size, gauge and swatching.` };
      if (persist([...patterns.filter(p => p.id !== item.id), item])) { renderIdeas(); notify('Idea saved to your Pattern library.'); }
    };
    textNode('button', 'Set up chart', actions).onclick = () => {
      const motifKey = group ? group + '|' + idea.motif : 'pattern|' + (Object.hasOwn(PATTERNS, idea.motif) ? idea.motif : 'Stripes');
      $('motif').value = motifKey; $('chartName').value = idea.name; $('cols').value = 40; $('rows').value = 40;
      $('layout').value = 'single'; $('scale').value = '1'; $('gapX').value = 3; $('gapY').value = 3;
      for (const id of ['mirror','flip','invert','noAccent','border']) $(id).checked = false;
      ['background','foreground','accent'].forEach((id,i) => $(id).value = colors[i]); $('palette').value = '';
      $('deleteMotif').hidden = true;
      tab('studio'); $('generator').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
      notify('Studio controls are ready. Tap Generate chart to replace your current chart; Undo can bring it back.');
    };
  }
}
for (const id of ['ideaMonth','ideaHemisphere','ideaWeight','ideaSkill','ideaStash']) $(id).addEventListener('change', () => {
  if (id === 'ideaMonth') ideaFollowsClock = false;
  if (id === 'ideaHemisphere') writeStorage('bow-purl-season-prefs', { hemisphere: $('ideaHemisphere').value });
  renderIdeas();
});
$('ideaNow').onclick = () => { ideaFollowsClock = true; $('ideaMonth').value = new Date().getMonth(); renderIdeas(); };
document.addEventListener('studio:tab', e => { if (e.detail === 'monthly') { if (ideaFollowsClock) $('ideaMonth').value = new Date().getMonth(); renderIdeas(); } });
renderIdeas();
