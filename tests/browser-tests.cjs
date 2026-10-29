// Optional browser QA: install playwright for development, then
// node tests/browser-tests.cjs. The app itself has no npm dependency/build step.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),qa=process.env.BOW_PURL_QA_DIR;
const passed=[],failed=[];
let browser,server,base,launchConfig;
const openedBrowsers=[];
const pattern=(over={})=>({id:'fixture-pattern',name:'Fixture sweater',weight:'3 • Light / DK',notes:'Needles: 4 mm',link:'https://example.test/pattern',yardsMin:400,yardsMax:600,...over});
const chart=(over={})=>({cols:8,rows:8,name:'Fixture heart',bg:'#fff6f5',fg:'#cc4c76',ac:'#f2b84b',cells:Array(64).fill(0),row:1,...over});
const stashItem=(over={})=>({id:'fixture-yarn',brand:'Fixture wool',weight:'3 • Light / DK',yards:220,skeins:3,color:'Rose',...over});
const project=(over={})=>({id:'session-one',name:'Woodland cardigan',patternId:null,stashId:null,status:'active',row:47,goal:160,repeatLength:12,notes:'Work row 48, then decrease at the start of row 49.',needles:'4 mm circular',gauge:'22 sts / 10 cm',section:'Left sleeve',started:'2026-10-01',updated:'2026-10-28T18:00:00Z',completed:null,yardsNeeded:1200,counters:[{name:'Decreases',value:3}],history:[],...over});
async function fresh(seed={},options={}){
  browser=await chromium.launch(launchConfig);openedBrowsers.push(browser);
  const context=await browser.newContext({viewport:{width:1280,height:900},timezoneId:'America/Detroit',...options});
  context.setDefaultTimeout(10000);
  await context.addInitScript(entries=>{if(location.protocol==='http:'&&location.hostname==='127.0.0.1'&&!sessionStorage.getItem('fixture-seeded')){for(const[k,v]of Object.entries(entries))localStorage.setItem(k,JSON.stringify(v));sessionStorage.setItem('fixture-seeded','yes');}},seed);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#dimensions')?.textContent.includes('stitches'));
  return {context,page,errors};
}
async function run(name,fn){
  try{await fn();passed.push(name);console.log('PASS '+name);}
  catch(e){failed.push({name,error:e.stack});console.error('FAIL '+name+'\n'+e.stack);}
  finally{for(const b of openedBrowsers.splice(0))await b.close().catch(()=>{});}
}
const read=(page,expr)=>page.evaluate(expr);
const jsonClone=v=>JSON.parse(JSON.stringify(v));
async function screenshot(page,name){if(qa){fs.mkdirSync(qa,{recursive:true});await page.screenshot({path:path.join(qa,name+'.png'),fullPage:true});}}
(async()=>{
  server=http.createServer((req,res)=>{
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(requested==='/bow-and-purl/__qa_axe.js'&&process.env.BOW_PURL_AXE_PATH){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(process.env.BOW_PURL_AXE_PATH));return;}
    const file=path.resolve(root,'.'+requested.replace(/^\/bow-and-purl/,''));
    if(!file.startsWith(root+path.sep)&&file!==root){res.statusCode=403;res.end();return;}
    let target=file;try{if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');const ext=path.extname(target);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream');res.end(fs.readFileSync(target));}catch{res.statusCode=404;res.end('Not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port+'/bow-and-purl/';
  const launch={headless:true};
  if(process.env.CHROMIUM_PATH){launch.executablePath=process.env.CHROMIUM_PATH;launch.args=['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--font-render-hinting=none'];}
  launchConfig=launch;

  await run('all sections initialize without JavaScript errors',async()=>{
    const t=await fresh();for(const section of ['projects','monthly','shop','stash','library','prices','help','studio']){await t.page.evaluate(id=>tab(id),section);assert(await t.page.locator('#'+section).isVisible());}
    assert.deepEqual(t.errors,[]);await screenshot(t.page,'desktop-studio');await t.context.close();
  });
  await run('existing v3 data migrates, and one bad pattern preserves the rest',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern(),{invalid:true}],'bow-purl-stash':[stashItem({yards:null,skeins:null})]});
    assert.equal(await read(t.page,()=>patterns.length),1);assert.equal(await read(t.page,()=>stash.length),1);assert.equal(await read(t.page,()=>BPStore.status().recoveryCount),1);
    assert.equal(await read(t.page,()=>JSON.parse(localStorage.getItem('bow-purl-patterns')).length),2);
    assert.equal(await t.page.locator('#storageNotice').isVisible(),true);await t.page.click('#dismissRecovery');assert.equal(await t.page.locator('#storageNotice').isVisible(),false);await t.page.reload();assert.equal(await t.page.locator('#storageNotice').isVisible(),false);assert.equal(await read(t.page,()=>BPStore.status().recoveryCount),1);await t.context.close();
  });
  await run('chart creation rejects invalid spacing without erasing the draft',async()=>{
    const t=await fresh();const old=await read(t.page,()=>JSON.stringify(state));await t.page.getByText('Knit controls',{exact:true}).click();await t.page.fill('#gapX','-8');await t.page.evaluate(()=>generate());assert.equal(await read(t.page,()=>JSON.stringify(state)),old);assert((await t.page.locator('#status').textContent()).includes('gap'));await t.context.close();
  });
  await run('canvas supports painting, undo, redo and a locked knitting mode',async()=>{
    const t=await fresh({'bow-purl-draft':chart()});const c=t.page.locator('#chart');await c.scrollIntoViewIfNeeded();await c.click({position:{x:38,y:18}});
    assert.equal(await read(t.page,()=>state.cells[0]),1);await t.page.click('#undo');assert.equal(await read(t.page,()=>state.cells[0]),0);await t.page.click('#redo');assert.equal(await read(t.page,()=>state.cells[0]),1);
    await t.page.selectOption('#chartMode','knit');await c.click({position:{x:54,y:18}});assert.equal(await read(t.page,()=>state.cells[1]),0);assert.equal(await t.page.locator('#clearChart').isEnabled(),false);await t.context.close();
  });
  await run('keyboard editing and flat-row reading preserve stitch order',async()=>{
    const t=await fresh({'bow-purl-draft':chart({cells:Array(64).fill(0).map((v,i)=>i>=56?i%2:v)})});
    await t.page.locator('.chart-view-tools > summary').click();await t.page.selectOption('#chartDirection','flat');await t.page.click('#nextRow');assert((await t.page.locator('#rowInstructions').textContent()).includes('left to right'));
    await t.page.locator('#chart').focus();await t.page.keyboard.press('ArrowRight');await t.page.keyboard.press('ArrowRight');await t.page.keyboard.press('Space');assert.equal(await read(t.page,()=>state.cells[(state.rows-1)*state.cols+2]),1);await t.context.close();
  });
  await run('square image conversion compensates for knitted stitch proportions',async()=>{
    const t=await fresh({'bow-purl-draft':chart()});await t.page.locator('.chart-view-tools > summary').click();await t.page.check('#knitShape');
    const data=await read(t.page,()=>{const c=document.createElement('canvas');c.width=120;c.height=120;const ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,120,120);return c.toDataURL('image/png').split(',')[1];});
    await t.page.setInputFiles('#image',{name:'square.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});await t.page.waitForFunction(()=>!document.querySelector('#imageTools').hidden);
    const bounds=await read(t.page,()=>{const points=state.cells.map((v,i)=>v?{x:i%state.cols,y:Math.floor(i/state.cols)}:null).filter(Boolean);return {w:Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))+1,h:Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))+1};});assert.equal(bounds.w,6);assert.equal(bounds.h,8);await t.context.close();
  });
  await run('typed charts, custom motifs and PNG export preserve real cell data',async()=>{
    const t=await fresh({'bow-purl-draft':chart()});await t.page.getByText('Knit controls',{exact:true}).click();await t.page.selectOption('#layout','single');await t.page.getByText('Type your own grid',{exact:true}).click();await t.page.fill('#gridText',Array(8).fill('01210121').join('\n'));await t.page.click('#applyGrid');assert.equal(await read(t.page,()=>state.cells[2]),2);
    t.page.once('dialog',dialog=>dialog.accept('Fixture motif'));await t.page.locator('.chart-tools > summary').click();await t.page.click('#saveMotif');assert.equal(await read(t.page,()=>myMotifs['Fixture motif'].length),8);
    const download=t.page.waitForEvent('download');await t.page.click('#png');const file=await download;const bytes=fs.readFileSync(await file.path());assert.equal(bytes.subarray(1,4).toString(),'PNG');await t.context.close();
  });
  await run('touch input paints and locking protects touch panning',async()=>{
    const t=await fresh({'bow-purl-draft':chart()},{viewport:{width:390,height:844},isMobile:true,hasTouch:true});const c=t.page.locator('#chart');await c.scrollIntoViewIfNeeded();const rect=await c.boundingBox();await t.page.touchscreen.tap(rect.x+38,rect.y+18);assert.equal(await read(t.page,()=>state.cells[0]),1);await t.page.selectOption('#chartMode','knit');const before=await read(t.page,()=>JSON.stringify(state.cells));await c.scrollIntoViewIfNeeded();const next=await c.boundingBox();await t.page.touchscreen.tap(next.x+54,next.y+18);assert.equal(await read(t.page,()=>JSON.stringify(state.cells)),before);await screenshot(t.page,'mobile-knitting');await t.context.close();
  });
  await run('three-color float analysis catches alternating-color gaps',async()=>{
    const t=await fresh();const result=await read(t.page,()=>floatAnalysis({cols:12,rows:1,cells:[0,1,2,1,2,1,2,1,2,1,2,0]},7,false));assert.equal(result.flagged.length,1);assert.equal(result.worst,10);await t.context.close();
  });
  await run('re-saving a chart keeps source, link, yardage and other metadata',async()=>{
    const p=pattern({chart:chart(),source:'ravelry',designer:'Fixture designer'}),t=await fresh({'bow-purl-patterns':[p]});
    await t.page.evaluate(()=>tab('library'));await t.page.getByRole('button',{name:'Open chart',exact:true}).click();await t.page.locator('.chart-tools > summary').click();await t.page.click('#saveChart');await t.page.locator('#saveForm').getByRole('button',{name:'Save pattern',exact:true}).click();
    const saved=await read(t.page,()=>patterns[0]);assert.equal(saved.link,p.link);assert.equal(saved.yardsMax,600);assert.equal(saved.source,'ravelry');assert.equal(saved.designer,p.designer);await t.page.reload();assert.equal(await read(t.page,()=>currentId),p.id);await t.context.close();
  });
  await run('large libraries render a bounded page and keep search accurate',async()=>{
    const fixtures=Array.from({length:80},(_,i)=>pattern({id:'p-'+i,name:'Pattern '+String(i).padStart(2,'0')}));const t=await fresh({'bow-purl-patterns':fixtures});await t.page.evaluate(()=>tab('library'));assert.equal(await t.page.locator('#patterns article.card').count(),24);assert((await t.page.locator('#libraryResultCount').textContent()).includes('80 matching'));await t.page.locator('#library-more-all').click();assert.equal(await t.page.locator('#patterns article.card').count(),48);await t.page.fill('#search','Pattern 79');assert.equal(await t.page.locator('#patterns article.card').count(),1);await t.context.close();
  });
  await run('row progress remains attached to the saved chart after reopening',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern({chart:chart()})],'bow-purl-draft':chart({patternId:'fixture-pattern'})});await t.page.click('#nextRow');await t.page.reload();assert.equal(await read(t.page,()=>state.row),2);assert.equal(await read(t.page,()=>patterns[0].chart.row),2);await t.context.close();
  });
  await run('pattern editing validates yardage and keeps local Ravelry overrides',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern({id:'rav-1',source:'ravelry',ravFrom:'favorite'})]});
    await t.page.evaluate(()=>tab('library'));await t.page.locator('.pattern-details > summary').click();await t.page.getByRole('button',{name:'Edit details',exact:true}).click();await t.page.fill('#editPatternName','My chosen size');await t.page.fill('#editPatternYards','600-400');await t.page.locator('#patternEditForm').getByRole('button',{name:'Save details'}).click();assert.equal(await t.page.locator('#patternEditDialog').isVisible(),true);
    await t.page.fill('#editPatternYards','480-520');await t.page.locator('#patternEditForm').getByRole('button',{name:'Save details'}).click();assert.equal(await read(t.page,()=>patterns[0].yardsMax),520);assert((await read(t.page,()=>patterns[0].localFields)).includes('yardsMax'));
    await t.page.route('https://connector.example.test/',route=>route.fulfill({json:{patterns:[{id:1,name:'Server name',weight:'DK',yardsMin:100,yardsMax:200,url:'https://www.ravelry.com/patterns/library/fixture',from:['favorite']}]}}));
    await t.page.click('#openPatternImport');await t.page.fill('#ravUser','fixture');await t.page.locator('#ravSettings summary').click();await t.page.fill('#ravUrl','https://connector.example.test/');await t.page.fill('#ravToken','fixture-token');await t.page.click('#ravSync');await t.page.waitForFunction(()=>!document.querySelector('#ravSync').disabled);
    assert.equal(await read(t.page,()=>patterns[0].name),'My chosen size');assert.equal(await read(t.page,()=>patterns[0].yardsMax),520);await t.context.close();
  });
  await run('missing Ravelry stash amounts import and repeated imports deduplicate',async()=>{
    const t=await fresh({'bow-purl-ravelry':{user:'fixture',url:'https://connector.example.test/',token:'fixture-token'}});
    await t.page.route('https://connector.example.test/',route=>route.fulfill({json:{stash:[{id:1,name:'Incomplete yarn',weight:'DK',yards:null,skeins:null,totalYards:null},{id:2,name:'Known yarn',weight:'DK',yards:220,skeins:2}]}}));
    await t.page.evaluate(()=>tab('stash'));await t.page.click('#openStashImport');await t.page.click('#stashImport');await t.page.waitForFunction(()=>!document.querySelector('#stashImport').disabled);assert.equal(await read(t.page,()=>stash.length),2);assert.equal(await read(t.page,()=>stashTotal(stash[0])),null);
    await t.page.click('#stashImport');await t.page.waitForFunction(()=>!document.querySelector('#stashImport').disabled);assert.equal(await read(t.page,()=>stash.length),2);assert((await t.page.locator('#stashImportResult').textContent()).includes('all were kept'));await t.context.close();
  });
  await run('stash search, weight filtering and metadata editing function',async()=>{
    const t=await fresh({'bow-purl-stash':[stashItem(),stashItem({id:'other',brand:'Other cotton',weight:'4 • Medium / Worsted / Aran',color:'Blue',dyeLot:'B42'})]});
    await t.page.evaluate(()=>tab('stash'));await t.page.fill('#stashSearch','B42');assert((await t.page.locator('#stashList').textContent()).includes('Other cotton'));assert(!(await t.page.locator('#stashList').textContent()).includes('Fixture wool'));
    await t.page.fill('#stashSearch','');await t.page.locator('.stash-filters .filter-options > summary').click();await t.page.selectOption('#stashWeightFilter','3 • Light / DK');assert(!(await t.page.locator('#stashList').textContent()).includes('Other cotton'));
    await t.page.locator('#stashList').getByRole('button',{name:'Edit details',exact:true}).click();await t.page.fill('#editStashLot','R17');await t.page.fill('#editStashFiber','100% wool');await t.page.locator('#stashEditForm').getByRole('button',{name:'Save amounts'}).click();assert.equal(await read(t.page,()=>stash[0].dyeLot),'R17');await t.context.close();
  });
  await run('meters convert accurately and zero skeins are allowed',async()=>{
    const t=await fresh();await t.page.evaluate(()=>tab('stash'));await t.page.click('#openAddYarn');await t.page.fill('#stashBrand','Meter fixture');await t.page.fill('#stashYards','100');await t.page.selectOption('#stashUnit','m');await t.page.fill('#stashSkeins','0');await t.page.locator('#stashForm').getByRole('button',{name:'+ Add to stash',exact:true}).click();const data=await read(t.page,()=>stash[0]);assert(Math.abs(data.yards-100/0.9144)<0.000001);assert.equal(data.skeins,0);await t.context.close();
  });
  await run('adjusting unknown per-skein amounts cannot erase a known total',async()=>{
    const t=await fresh({'bow-purl-stash':[stashItem({yards:null,skeins:2,totalYards:450})]});await t.page.evaluate(()=>tab('stash'));await t.page.locator('.stash-entry-details > summary').click();assert.equal(await t.page.getByRole('button',{name:'Use one skein of Fixture wool'}).isEnabled(),false);await t.page.evaluate(()=>adjustStash(stash[0],-1));assert.equal(await read(t.page,()=>stash[0].totalYards),450);await t.context.close();
  });
  await run('local quantity corrections and details survive re-import',async()=>{
    const t=await fresh({'bow-purl-stash':[stashItem({ravId:1,localQuantities:true,localDetails:true,brand:'My corrected yarn',skeins:1.5,dyeLot:'R17'})]});const data=await read(t.page,()=>mergeRavelryStash(stash,[{id:1,name:'Server yarn',weight:'Worsted',yards:null,skeins:4}]).next[0]);assert.equal(data.skeins,1.5);assert.equal(data.brand,'My corrected yarn');assert.equal(data.dyeLot,'R17');await t.context.close();
  });
  await run('disposed Ravelry yarn no longer counts as available unless locally corrected',async()=>{
    const t=await fresh({'bow-purl-stash':[stashItem({ravId:1})]});const data=await read(t.page,()=>mergeRavelryStash(stash,[{id:1,name:'Fixture wool',weight:'DK',yards:220,skeins:3,unavailable:true,status:'Used up'}]).next[0]);assert.equal(data.skeins,0);assert.equal(data.totalYards,0);await t.context.close();
  });
  await run('project creation, editing, completed-row counters and repeats persist',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern()],'bow-purl-stash':[stashItem()]});
    await t.page.evaluate(()=>tab('projects'));await t.page.click('#newProject');await t.page.fill('#projectName','October cardigan');await t.page.getByText('Rows, repeats & dates',{exact:true}).click();await t.page.fill('#projectRepeat','12');await t.page.fill('#projectGoal','100');await t.page.fill('#projectRow','11');await t.page.fill('#projectSection','Right sleeve');await t.page.getByText('Yarn, needles & gauge',{exact:true}).click();await t.page.fill('#projectNeedles','4 mm');await t.page.fill('#projectGauge','22 sts / 10 cm');await t.page.fill('#projectNotes','Begin the next decrease on row 13.');await t.page.getByText('Extra counters',{exact:true}).click();await t.page.fill('#projectCounter0','Decreases');await t.page.locator('#projectForm').getByRole('button',{name:'Save project',exact:true}).click();
    await t.page.getByRole('button',{name:'Complete one row for October cardigan'}).click();assert.equal(await read(t.page,()=>projects[0].row),12);assert((await t.page.locator('.repeat-status').textContent()).includes('next: row 1 of 12'));await t.page.getByRole('button',{name:'Increase Decreases for October cardigan'}).click();assert.equal(await read(t.page,()=>projects[0].counters[0].value),1);
    await t.page.reload();assert.equal(await read(t.page,()=>projects[0].row),12);await t.page.evaluate(()=>tab('projects'));await screenshot(t.page,'desktop-projects');await t.page.getByRole('button',{name:'Edit details',exact:true}).click();assert.equal(await t.page.locator('#projectNotes').inputValue(),'Begin the next decrease on row 13.');await t.page.fill('#projectSection','Left sleeve');await t.page.locator('#projectForm').getByRole('button',{name:'Save project',exact:true}).click();assert.equal(await read(t.page,()=>projects[0].section),'Left sleeve');await t.context.close();
  });
  await run('a pattern can start a linked project and paused counters are disabled',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern({chart:chart()})]});await t.page.evaluate(()=>tab('library'));await t.page.getByRole('button',{name:'Start project',exact:true}).click();assert.equal(await t.page.locator('#projectPattern').inputValue(),'fixture-pattern');await t.page.locator('#projectForm').getByRole('button',{name:'Save project',exact:true}).click();await t.page.getByText('Planning, progress & activity',{exact:true}).click();await t.page.getByRole('button',{name:'Pause project',exact:true}).click();assert.equal(await read(t.page,()=>projects[0].status),'paused');await t.page.selectOption('#projectFilter','paused');await t.page.getByRole('button',{name:'View project',exact:true}).click();assert.equal(await t.page.getByRole('button',{name:'Complete one row for Fixture sweater'}).isEnabled(),false);await t.context.close();
  });
  await run('full backups include draft, project data and exclude connector secrets',async()=>{
    const t=await fresh({'bow-purl-draft':chart({name:'Unsaved draft'}),'bow-purl-ravelry':{token:'secret-fixture'}});const data=await read(t.page,()=>makeBackup());assert.equal(data.version,4);assert.equal(data.draft.name,'Unsaved draft');assert(Array.isArray(data.projects));assert(!JSON.stringify(data).includes('secret-fixture'));
    const download=t.page.waitForEvent('download');await t.page.click('#quickBackup');const file=await download;assert(file.suggestedFilename().endsWith('.json'));const saved=JSON.parse(fs.readFileSync(await file.path(),'utf8'));assert.equal(saved.draft.name,'Unsaved draft');await t.context.close();
  });
  await run('restore previews and atomically merges matching records by choice',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern()],'bow-purl-draft':chart({name:'Current draft'})});
    const backup={app:'bow-and-purl',version:4,patterns:[pattern({name:'Backup sweater'})],stash:[stashItem()],projects:[],motifs:{},draft:chart({name:'Backup draft'})};
    await t.page.evaluate(()=>tab('library'));await t.page.setInputFiles('#restore',{name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});assert.equal(await t.page.locator('#restoreDialog').isVisible(),true);assert.equal(await read(t.page,()=>stash.length),0);
    await t.page.selectOption('#restorePolicy','backup');await t.page.check('#restoreDraft');await t.page.locator('#restoreForm').getByRole('button',{name:'Restore selected data'}).click();assert.equal(await read(t.page,()=>patterns[0].name),'Backup sweater');assert.equal(await read(t.page,()=>stash.length),1);assert.equal(await read(t.page,()=>state.name),'Backup draft');await t.context.close();
  });
  await run('invalid backups and quota failures cannot partially restore sections',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern()]});const original=await read(t.page,()=>localStorage.getItem(BPStore.KEY));
    const invalid={app:'bow-and-purl',version:4,patterns:[pattern()],stash:[stashItem()],yarns:[{bad:true}]};
    await t.page.evaluate(()=>tab('library'));await t.page.setInputFiles('#restore',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});assert.equal(await read(t.page,()=>localStorage.getItem(BPStore.KEY)),original);
    const good={...invalid,yarns:[],patterns:[pattern({id:'new'})]};await t.page.setInputFiles('#restore',{name:'good.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(good))});await t.page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===BPStore.KEY)throw Error('quota fixture');return set.call(this,k,v);};});
    await t.page.locator('#restoreForm').getByRole('button',{name:'Restore selected data'}).click();assert.equal(await read(t.page,()=>localStorage.getItem(BPStore.KEY)),original);assert.equal(await read(t.page,()=>stash.length),0);assert.equal(await read(t.page,()=>patterns.length),1);await t.context.close();
  });
  await run('legacy v1–v3 backups remain compatible',async()=>{
    const t=await fresh();for(const version of [1,2,3]){const data=await t.page.evaluate(v=>restorePlan({app:'bow-and-purl',version:v,patterns:[]}),version);assert(Array.isArray(data.nextPatterns));}await t.context.close();
  });
  await run('restore remaps duplicate Ravelry stash IDs in linked projects',async()=>{
    const t=await fresh({'bow-purl-stash':[stashItem({id:'local-id',ravId:5})]});const remapped=await read(t.page,()=>{const p={id:'project-backup',name:'Imported project',patternId:null,stashId:'backup-id',status:'active',row:0,goal:0,repeatLength:0,notes:'',needles:'',gauge:'',section:'',started:localPriceDate(),updated:new Date().toISOString(),completed:null,yardsNeeded:null,counters:[],history:[]};return restorePlan({app:'bow-and-purl',version:4,patterns:[],stash:[{...stash[0],id:'backup-id'}],projects:[p]}).nextProjects[0];});assert.equal(remapped.stashId,'local-id');await t.context.close();
  });
  await run('manual prices, CSV round-trip and calendar review dates are correct',async()=>{
    const t=await fresh();const result=await read(t.page,()=>{const merged=mergePriceCSV(prices,[['weight','DK','12','240','DK','mid','Fixture shop','2026-10-01']]);return {rate:merged.next.perYard[weights[3]][1],round:parsePriceCSV(encodePriceCSV(priceCSVRows(merged.next))).length,jan:priceReviewInfo({...merged.next,reviewedAt:'2026-12-15'},new Date('2026-12-20T12:00:00')),bad:validPriceDate('2026-02-29')};});assert.equal(result.rate,.05);assert.equal(result.round,28);assert.equal(result.jan.next,'2027-01-01');assert.equal(result.bad,false);assert.equal(await read(t.page,()=>money(129.99)),'$129.99');
    const safe=await read(t.page,()=>encodePriceCSV([['yarn','=HYPERLINK("bad")',12,200]]));assert(safe.includes("'=HYPERLINK"));await t.context.close();
  });
  await run('all twelve months and both hemispheres have four offline project ideas',async()=>{
    const t=await fresh();assert.equal(await read(t.page,()=>Array.from({length:12},(_,m)=>[ideasFor(m,false).length,ideasFor(m,true).length]).every(a=>a[0]===4&&a[1]===4)),true);await t.page.evaluate(()=>tab('monthly'));await t.page.getByRole('button',{name:'♡ Save idea',exact:true}).first().click();assert.equal(await read(t.page,()=>patterns.length),1);await t.context.close();
  });
  await run('AI wrong-sized and failed responses leave the current chart intact',async()=>{
    const t=await fresh({'bow-purl-draft':chart()});await t.page.evaluate(()=>{AI.setEndpoint('https://ai.example.test/');AI.setToken('fixture-token');document.querySelector('#aiPrompt').value='a heart';});
    await t.page.route('https://ai.example.test/',route=>route.fulfill({json:{rows:['01']}}));const before=await read(t.page,()=>JSON.stringify(state));await t.page.evaluate(()=>document.querySelector('#aiGo').click());await t.page.waitForFunction(()=>!document.querySelector('#aiGo').disabled);assert.equal(await read(t.page,()=>JSON.stringify(state)),before);
    await t.page.unroute('https://ai.example.test/');await t.page.route('https://ai.example.test/',route=>route.fulfill({status:502,json:{error:'Fixture provider failed'}}));await t.page.evaluate(()=>document.querySelector('#aiGo').click());await t.page.waitForFunction(()=>!document.querySelector('#aiGo').disabled);assert.equal(await read(t.page,()=>JSON.stringify(state)),before);await t.context.close();
  });
  await run('AI full-sized responses fill the chart without motif scaling',async()=>{
    const t=await fresh({'bow-purl-draft':chart()});await t.page.evaluate(()=>{AI.setEndpoint('https://ai.example.test/');document.querySelector('#aiPrompt').value='a heart';});await t.page.route('https://ai.example.test/',route=>route.fulfill({json:{rows:Array(8).fill('10101010')}}));await t.page.evaluate(()=>document.querySelector('#aiGo').click());await t.page.waitForFunction(()=>!document.querySelector('#aiGo').disabled);assert.equal(await read(t.page,()=>state.cells[0]),1);assert.equal(await read(t.page,()=>state.cells[63]),0);assert.equal(await read(t.page,()=>state.cells.filter(x=>x===1).length),32);await t.context.close();
  });
  await run('network failures leave existing Ravelry data and restore controls',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern()],'bow-purl-ravelry':{user:'fixture',url:'https://connector.example.test/',token:'fixture-token'}});await t.page.route('https://connector.example.test/',route=>route.abort('failed'));await t.page.evaluate(()=>tab('library'));await t.page.click('#openPatternImport');await t.page.click('#ravSync');await t.page.waitForFunction(()=>!document.querySelector('#ravSync').disabled);assert.equal(await read(t.page,()=>patterns.length),1);assert((await t.page.locator('#ravImportResult').textContent()).includes('could not reach'));await t.context.close();
  });
  await run('untrusted names stay text and unsafe backup links are rejected',async()=>{
    const malicious='<img src=x onerror="window.fixtureXSS=true">',t=await fresh({'bow-purl-patterns':[pattern({name:malicious})]});await t.page.evaluate(()=>tab('library'));assert.equal(await t.page.locator('#patterns img').count(),0);assert.equal(await read(t.page,()=>window.fixtureXSS),undefined);const rejected=await t.page.evaluate(()=>{try{validateBackup({app:'bow-and-purl',version:4,patterns:[{...patterns[0],link:'javascript:alert(1)'}]});return false;}catch{return true;}});assert(rejected);await t.context.close();
  });
  await run('offline cache installs at a subpath and reopens without network',async()=>{
    const t=await fresh({'bow-purl-stash':[stashItem()],'bow-purl-patterns':[pattern()]});await t.page.waitForFunction(()=>document.querySelector('#offlineStatus').textContent.startsWith('Ready for offline use'),{timeout:20000});
    assert.equal(await t.page.locator('#updateNotice').isVisible(),false);await t.context.setOffline(true);await t.page.reload();await t.page.waitForFunction(()=>document.querySelector('#offlineStatus').textContent.startsWith('Offline'));
    for(const id of ['monthly','projects','stash','library','studio']){await t.page.evaluate(v=>tab(v),id);assert(await t.page.locator('#'+id).isVisible());}
    assert.equal(await read(t.page,()=>stash.length),1);assert.equal(await read(t.page,()=>patterns.length),1);assert.deepEqual(t.errors,[]);await t.context.close();
  });
  await run('320px, 390px and landscape layouts keep navigation and controls usable',async()=>{
    for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
      const t=await fresh({}, {viewport,isMobile:true,hasTouch:true});if(viewport.width<=760)await t.page.locator('#studioNavigation [data-tab=projects]').click();
      if(viewport.width<=760){assert(await t.page.locator('#studioNavigation').isVisible());await t.page.locator('#studioNavigation [data-tab=stash]').click();await t.page.click('#openAddYarn');await t.page.fill('#stashBrand','Touch yarn');await t.page.fill('#stashSkeins','1');await t.page.locator('#stashForm').getByRole('button',{name:'+ Add to stash',exact:true}).click();assert.equal(await read(t.page,()=>stash.length),1);await screenshot(t.page,'mobile-'+viewport.width+'-stash');}
      const width=await read(t.page,()=>({main:document.querySelector('main').getBoundingClientRect().right,viewport:innerWidth}));assert(width.main<=width.viewport+1);assert.deepEqual(t.errors,[]);await t.context.close();
    }
  });
  await run('reduced motion pauses all studio cats',async()=>{
    const t=await fresh({}, {reducedMotion:'reduce'});assert.equal(await read(t.page,()=>document.documentElement.classList.contains('cats-paused')),true);assert.equal(await t.page.locator('#catMotion').isEnabled(),false);await t.context.close();
  });
  await run('printing includes the chart and color key without the app chrome',async()=>{
    const t=await fresh({'bow-purl-draft':chart()});await t.page.emulateMedia({media:'print'});assert.equal(await t.page.locator('#chart').isVisible(),true);assert.equal(await t.page.locator('#chartLegend').isVisible(),true);assert.equal(await t.page.locator('header').isVisible(),false);assert.equal(await t.page.locator('#generator').isVisible(),false);await screenshot(t.page,'print-chart');await t.context.close();
  });

  await run('a second tab cannot silently overwrite the first tab’s changes',async()=>{
    const t=await fresh();const second=await t.context.newPage();await second.goto(base);await second.waitForFunction(()=>document.querySelector('#dimensions').textContent.includes('stitches'));
    await t.page.fill('#chartName','First tab update');await second.waitForFunction(()=>BPStore.status().blocked);const raw=await read(t.page,()=>localStorage.getItem(BPStore.KEY));await second.fill('#chartName','Stale tab update');assert.equal(await read(second,()=>localStorage.getItem(BPStore.KEY)),raw);assert.equal(await second.locator('#storageNotice').isVisible(),true);await t.context.close();
  });
  await run('active project controls fit above phone navigation and selection preserves data',async()=>{
    const fixtures=[project(),project({id:'session-two',name:'Evening cowl',row:16,updated:'2026-10-20T12:00:00Z'})];
    const t=await fresh({'bow-purl-projects':fixtures},{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await t.page.locator('#studioNavigation [data-tab=projects]').click();
    const bounds=await read(t.page,()=>({action:$('row-plus-session-one').getBoundingClientRect().bottom,nav:$('studioNavigation').getBoundingClientRect().top}));assert(bounds.action<bounds.nav);
    assert.equal(await t.page.locator('#projectSession .project-card').count(),1);await t.page.getByRole('button',{name:'Continue knitting',exact:true}).click();
    assert.equal(await t.page.locator('#projectSession h3').textContent(),'Evening cowl');assert.deepEqual(await read(t.page,()=>projects),fixtures);
    await t.page.getByRole('button',{name:'Complete one row for Evening cowl'}).click();await t.page.reload();await t.page.evaluate(()=>tab('projects'));assert.equal(await read(t.page,()=>projects.find(p=>p.id==='session-two').row),17);assert.equal(await t.page.locator('#projectSession h3').textContent(),'Evening cowl');await t.context.close();
  });
  await run('phone Knit view exposes chart and next-row control above navigation',async()=>{
    for(const viewport of [{width:320,height:740},{width:390,height:844}]){
      const t=await fresh({'bow-purl-draft':chart({cols:32,rows:32,cells:Array(1024).fill(0),row:12})},{viewport,isMobile:true,hasTouch:true});
      await t.page.selectOption('#chartMode','knit');await t.page.evaluate(()=>window.scrollTo(0,0));
      const bounds=await read(t.page,()=>({chart:$('chartViewport').getBoundingClientRect(),action:$('nextRow').getBoundingClientRect().bottom,nav:$('studioNavigation').getBoundingClientRect().top,width:document.documentElement.scrollWidth}));
      assert(bounds.action<=bounds.nav,JSON.stringify({viewport,...bounds}));assert(bounds.width<=viewport.width);assert.equal(await t.page.locator('#generator').isVisible(),false);
      await t.page.click('#nextRow');assert.equal(await read(t.page,()=>state.row),13);await t.page.check('#chartSymbols');assert.equal(await read(t.page,()=>state.cells.reduce((a,b)=>a+b,0)),0);
      await t.page.click('#chartSettings');assert.equal(await t.page.locator('#generator').isVisible(),true);assert.equal(await t.page.locator('#chartMode').inputValue(),'edit');await t.context.close();
    }
  });
  await run('More navigation reaches every secondary section with visible focus',async()=>{
    const t=await fresh({}, {viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    for(const id of ['monthly','shop','prices','help']){await t.page.click('#openMore');await t.page.locator('#moreDialog [data-tab='+id+']').click();assert.equal(await t.page.locator('#moreDialog').isVisible(),false);assert.equal(await t.page.locator('#'+id).isVisible(),true);assert.equal(await t.page.locator('[data-tab][aria-current=page]').count(),1);assert.equal(await read(t.page,()=>document.activeElement.tagName),'H2');}
    await t.page.click('#openMore');await t.page.keyboard.press('Escape');assert.equal(await read(t.page,()=>document.activeElement.id),'openMore');await t.context.close();
  });
  await run('continuous and grouped pattern views retain filters and overview',async()=>{
    const t=await fresh({'bow-purl-patterns':[pattern(),pattern({id:'other-weight',name:'Sock pattern',weight:'1 • Super fine / Fingering'})]});await t.page.evaluate(()=>tab('library'));
    assert.equal(await t.page.locator('#patterns > .cards').count(),1);await t.page.locator('.library-filters .filter-options > summary').click();await t.page.check('#groupPatterns');assert.equal(await t.page.locator('.weight-group').count(),2);assert.equal(await t.page.locator('#summaryWrap').isVisible(),true);await t.page.selectOption('#filter','3 • Light / DK');assert.equal(await t.page.locator('#patterns article.card').count(),1);await t.page.uncheck('#groupPatterns');assert.equal(await t.page.locator('#patterns article.card').count(),1);await t.context.close();
  });
  await run('selected-tier price list updates and records entered source and date',async()=>{
    const t=await fresh({}, {viewport:{width:390,height:844},isMobile:true,hasTouch:true});await t.page.evaluate(()=>tab('prices'));assert.equal(await t.page.locator('#priceRows .price-row').count(),8);await t.page.click('#openPriceUpdate');assert.equal(await t.page.locator('#priceUpdateCost').isVisible(),true);await t.page.selectOption('#priceUpdateWeight','3 • Light / DK');await t.page.fill('#priceUpdateCost','15');await t.page.fill('#priceUpdateYards','220');await t.page.selectOption('#priceUpdateTier','1');await t.page.fill('#priceUpdateSource','Fixture shop');await t.page.fill('#priceUpdateDate','2026-10-01');await t.page.locator('#priceUpdateForm').getByRole('button',{name:'Save price',exact:true}).click();assert((await t.page.locator('#priceRows').textContent()).includes('$15.00 / 220 yds'));assert((await t.page.locator('#priceRows').textContent()).includes('Fixture shop'));await t.page.reload();assert.equal(await read(t.page,()=>prices.perYard[weights[3]][1]),15/220);await t.context.close();
  });
  await run('collapsed project setup retains existing values when editing core fields',async()=>{
    const item=project();const t=await fresh({'bow-purl-projects':[item]});await t.page.evaluate(()=>tab('projects'));await t.page.getByRole('button',{name:'Edit details',exact:true}).click();assert.equal(await t.page.locator('#projectNeedles').isVisible(),false);assert.equal(await t.page.locator('#projectNotes').isVisible(),true);await t.page.fill('#projectNotes','Resume at row 48.');await t.page.locator('#projectForm').getByRole('button',{name:'Save project',exact:true}).click();const saved=await read(t.page,()=>projects[0]);for(const k of ['row','goal','repeatLength','needles','gauge','started','yardsNeeded'])assert.deepEqual(saved[k],item[k]);assert.equal(saved.notes,'Resume at row 48.');await t.context.close();
  });
  if(process.env.BOW_PURL_AXE_PATH)await run('automated accessibility checks across every section and project form',async()=>{
    const t=await fresh();await t.page.addScriptTag({url:base+'__qa_axe.js'});const results=[];
    for(const section of ['studio','projects','monthly','shop','stash','library','prices','help']){await t.page.evaluate(id=>tab(id),section);const r=await t.page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));results.push({section,violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});}
    await t.page.evaluate(()=>tab('projects'));await t.page.click('#newProject');const form=await t.page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));results.push({section:'project form',violations:form.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
    if(qa)fs.writeFileSync(path.join(qa,'accessibility-results.json'),JSON.stringify(results,null,2));assert.deepEqual(results.filter(r=>r.violations.length),[]);await t.context.close();
  });

  console.log('\n'+passed.length+' browser scenarios passed; '+failed.length+' failed.');
  if(qa)fs.writeFileSync(path.join(qa,'browser-results.json'),JSON.stringify({passed,failed},null,2));
  if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});

