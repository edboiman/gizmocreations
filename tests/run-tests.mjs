// Dependency-free tests: node tests/run-tests.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let passed=0,failed=0;
async function test(name,fn){try{await fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
function storage(seed={}) {
  const memory=new Map(Object.entries(seed)), document=new EventTarget(), window=new EventTarget();
  let reject=false;
  const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>{if(reject)throw Error('quota');memory.set(k,v);}};
  const context=vm.createContext({localStorage,document,window,CustomEvent:class extends Event{constructor(type,options){super(type);this.detail=options?.detail;}},structuredClone,Date,JSON,Object,Set,console});
  vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8')+'\nwindow.store=BPStore;',context);
  return {store:window.store,memory,context,window,reject:v=>reject=v};
}
function worker(file,fetcher=async()=>{throw Error('unexpected external request');}){
  const context=vm.createContext({Request,Response,Headers,ReadableStream,Uint8Array,TextDecoder,AbortController,AbortSignal,setTimeout,clearTimeout,btoa,URL,console,fetch:fetcher});
  const source=fs.readFileSync(path.join(root,'worker',file),'utf8').replace('export default','globalThis.worker =');
  vm.runInContext(source,context);
  return context;
}
const ENV={ALLOWED_ORIGIN:'https://knit.example',APP_TOKEN:'fixture-token-123456',MODEL:'fixture-model',ANTHROPIC_API_KEY:'fixture-not-real',RAVELRY_USER:'fixture-user',RAVELRY_PASS:'fixture-pass'};
function request(body,extra={}){return new Request('https://worker.example/',{method:'POST',headers:{'Origin':ENV.ALLOWED_ORIGIN,'X-App-Token':ENV.APP_TOKEN,'Content-Type':'application/json',...extra},body:typeof body==='string'?body:JSON.stringify(body)});}
await test('legacy migration retains old bytes and writes one record',()=>{
  const old=JSON.stringify([{id:'legacy'}]),h=storage({'bow-purl-patterns':old});
  assert.equal(h.store.read('bow-purl-patterns',[])[0].id,'legacy');
  assert(h.store.commit({'bow-purl-projects':[]}));
  assert.equal(h.memory.get('bow-purl-patterns'),old);
  assert.equal(JSON.parse(h.memory.get(h.store.KEY)).values['bow-purl-patterns'][0].id,'legacy');
});
await test('quota failure leaves every saved section unchanged',()=>{
  const h=storage();assert(h.store.commit({'bow-purl-patterns':[1],'bow-purl-stash':[2]}));
  const original=h.memory.get(h.store.KEY);h.reject(true);
  assert.equal(h.store.commit({'bow-purl-patterns':[3],'bow-purl-stash':[4]}),false);
  assert.equal(h.memory.get(h.store.KEY),original);
  assert.equal(h.store.read('bow-purl-stash',[])[0],2);
  assert(h.store.status().dirty);
});
await test('an unrelated successful save does not conceal earlier failed changes',()=>{
  const h=storage();h.reject(true);h.store.commit({'bow-purl-draft':{name:'unsaved'}});h.reject(false);h.store.commit({'bow-purl-shop':{}});
  assert(h.store.status().dirty);h.store.commit({'bow-purl-draft':{name:'saved'}});assert.equal(h.store.status().dirty,false);
});
await test('multi-tab stale data cannot overwrite newer data',()=>{
  const h=storage();h.store.commit({'bow-purl-patterns':[1]});const other=JSON.parse(h.memory.get(h.store.KEY));other.revision++;other.values['bow-purl-patterns']=[2];const raw=JSON.stringify(other);h.memory.set(h.store.KEY,raw);
  assert.equal(h.store.commit({'bow-purl-patterns':[3]}),false);assert.equal(h.memory.get(h.store.KEY),raw);assert(h.store.status().blocked);
});
await test('corrupt JSON is retained for recovery',()=>{
  const raw='[broken',h=storage({'bow-purl-patterns':raw});assert.equal(h.store.status().recoveryCount,1);assert.equal(h.store.recoveryData().legacy['bow-purl-patterns'],raw);
});
await test('one invalid record does not discard valid neighbors',()=>{
  const h=storage({'bow-purl-patterns':JSON.stringify([{id:'ok'},{bad:true},{id:'ok'}])});
  assert.equal(h.store.loadList('bow-purl-patterns',p=>typeof p.id==='string',3000).length,1);
  h.store.commit({'bow-purl-patterns':[{id:'ok'}]});
  assert.equal(JSON.parse(h.memory.get(h.store.KEY)).recovery['bow-purl-patterns'].value.length,3);
});
await test('corrupt new storage fails closed rather than overwriting',()=>{
  const h=storage({'bow-purl-data-v4':'not-json'});assert(h.store.status().blocked);assert.equal(h.store.commit({'bow-purl-stash':[]}),false);assert.equal(h.memory.get(h.store.KEY),'not-json');
});
await test('recovery exports exclude connector tokens and API settings',()=>{
  const h=storage({'bow-purl-ravelry':JSON.stringify({token:'private-fixture'}),'bow-purl-ai-token':'private-fixture'});assert(!JSON.stringify(h.store.recoveryData()).includes('private-fixture'));
});
await test('acknowledging recovery keeps original records and survives reopening',()=>{
  const h=storage({'bow-purl-patterns':'[broken'});assert(h.store.acknowledgeRecovery());assert(h.store.status().recoveryAcknowledged);assert.equal(h.store.recoveryData().legacy['bow-purl-patterns'],'[broken');
  const reopened=storage(Object.fromEntries(h.memory));assert(reopened.store.status().recoveryAcknowledged);assert.equal(reopened.store.status().recoveryCount,1);
});
for(const file of ['claude-worker.js','ravelry-worker.js']){
  await test(file+': invalid token is refused before upstream traffic',async()=>{const w=worker(file);assert.equal((await w.worker.fetch(request({}, {'X-App-Token':'wrong'}),ENV)).status,401);});
  await test(file+': missing configuration fails closed',async()=>{const w=worker(file);assert.equal((await w.worker.fetch(request({}),{})).status,500);});
  await test(file+': wrong origin is refused',async()=>{const w=worker(file);assert.equal((await w.worker.fetch(request({}, {Origin:'https://elsewhere.example'}),ENV)).status,403);});
  await test(file+': null and array JSON return 400',async()=>{const w=worker(file);for(const b of ['null','[]','42','{'])assert.equal((await w.worker.fetch(request(b),ENV)).status,400);});
  await test(file+': actual body cap works without Content-Length',async()=>{const w=worker(file);assert.equal((await w.worker.fetch(request({prompt:'heart',username:'fixture',extra:'x'.repeat(9000)}),ENV)).status,413);});
  await test(file+': content type is validated',async()=>{const w=worker(file);assert.equal((await w.worker.fetch(request({}, {'Content-Type':'text/plain'}),ENV)).status,415);});
  await test(file+': preflight does not call a provider',async()=>{const w=worker(file);const req=new Request('https://worker.example',{method:'OPTIONS',headers:{Origin:ENV.ALLOWED_ORIGIN}});assert.equal((await w.worker.fetch(req,ENV)).status,200);});
}
await test('AI requires an explicit provider model',async()=>{const w=worker('claude-worker.js');const env={...ENV};delete env.MODEL;assert.equal((await w.worker.fetch(request({prompt:'heart',cols:8,rows:8}),env)).status,500);});
await test('AI accepts exact dimensions and bounds paid output',async()=>{
  let sent;const w=worker('claude-worker.js',async(u,o)=>{sent=JSON.parse(o.body);assert(o.signal);return Response.json({content:[{text:JSON.stringify({rows:Array(8).fill('01010101')})}]});});
  const res=await w.worker.fetch(request({prompt:'heart',cols:8,rows:8}),ENV);assert.equal(res.status,200);assert(sent.max_tokens>=2000&&sent.max_tokens<=24000);
});
await test('AI supports selected 120 by 160 chart dimensions',async()=>{
  const w=worker('claude-worker.js',async()=>Response.json({content:[{text:JSON.stringify({rows:Array(160).fill('0'.repeat(120))})}]}));
  assert.equal((await w.worker.fetch(request({prompt:'tiny hearts',cols:120,rows:160}),ENV)).status,200);
});
await test('AI rejects wrong-sized output and invalid input dimensions',async()=>{
  const w=worker('claude-worker.js',async()=>Response.json({content:[{text:JSON.stringify({rows:['01']})}]}));
  assert.equal((await w.worker.fetch(request({prompt:'heart',cols:8,rows:8}),ENV)).status,502);
  for(const cols of [7,121,8.5,'8'])assert.equal((await w.worker.fetch(request({prompt:'heart',cols,rows:8}),ENV)).status,400);
});
await test('AI OpenAI branch sends only a server-side API key',async()=>{
  let payload;const w=worker('claude-worker.js',async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer fixture-not-real');payload=JSON.parse(options.body);return Response.json({choices:[{message:{content:JSON.stringify({rows:Array(8).fill('0'.repeat(8))})}}]});});
  const res=await w.worker.fetch(request({prompt:'cloud',cols:8,rows:8}),{...ENV,PROVIDER:'openai',OPENAI_API_KEY:'fixture-not-real'});assert.equal(res.status,200);assert(payload.max_completion_tokens<=24000);assert(!JSON.stringify(await res.json()).includes('fixture-not-real'));
});
await test('provider rate limits produce a useful failure',async()=>{const w=worker('claude-worker.js',async()=>Response.json({error:'provider detail'},{status:429}));assert.equal((await w.worker.fetch(request({prompt:'heart',cols:8,rows:8}),ENV)).status,429);});
await test('Ravelry yarn network failures return a JSON response',async()=>{const w=worker('ravelry-worker.js');const res=await w.worker.fetch(request({action:'yarns',query:'wool'}),ENV);assert.equal(res.status,502);assert((await res.json()).error);});
await test('Ravelry action and personal username restrictions are checked',async()=>{const w=worker('ravelry-worker.js');assert.equal((await w.worker.fetch(request({action:'delete',username:'fixture'}),ENV)).status,400);assert.equal((await w.worker.fetch(request({action:'stash',username:'elsewhere'}),{...ENV,ALLOWED_USERNAME:'fixture'})).status,403);});
await test('Ravelry pack totals keep unknown quantities unknown',()=>{
  const w=worker('ravelry-worker.js'),a=w.stashAmounts({yarn:{yardage:220},packs:[{skeins:2},{}]});assert.equal(a.skeins,null);assert.equal(a.totalYards,null);assert.equal(a.yards,220);
  const b=w.stashAmounts({packs:[{skeins:2,total_yards:400},{skeins:1,total_yards:100}]});assert.equal(b.skeins,3);assert.equal(b.totalYards,500);assert.equal(b.yards,null);
});
await test('Ravelry missing packs and malformed pack items do not crash',()=>{const w=worker('ravelry-worker.js');assert.equal(w.stashAmounts({yarn:{yardage:220}}).yards,220);assert.equal(w.stashAmounts({packs:[null]}).totalYards,null);});
await test('Ravelry stash returns incomplete records and disposal status',async()=>{
  const w=worker('ravelry-worker.js',async url=>url.includes('/stash/list')?Response.json({stash:[{id:1},{id:1},{id:2}],paginator:{last_page:1}}):Response.json({stash:{id:url.includes('/1.json')?1:2,yarn:{name:'Fixture wool',yarn_weight:{name:'DK'}},packs:[],stash_status:{name:url.includes('/2.json')?'Used up':'In stash'}}}));
  const res=await w.worker.fetch(request({action:'stash',username:'fixture'}),ENV),data=await res.json();assert.equal(res.status,200);assert.equal(data.stash.length,2);assert.equal(data.stash[0].skeins,null);assert.equal(data.stash[1].unavailable,true);
});
await test('Ravelry favorites and library sources deduplicate patterns',async()=>{
  const w=worker('ravelry-worker.js',async url=>url.includes('/favorites/')?Response.json({favorites:[{favorited:{id:1}}],paginator:{last_page:1}}):url.includes('/library/')?Response.json({volumes:[{pattern_id:1}],paginator:{last_page:1}}):Response.json({patterns:{1:{id:1,name:'Heart',permalink:'heart',packs:[]}}}));
  const res=await w.worker.fetch(request({username:'fixture',include:'both'}),ENV),data=await res.json();assert.equal(data.patterns.length,1);assert.deepEqual([...data.patterns[0].from].sort(),['favorite','library']);
});
await test('service-worker core includes every referenced versioned app asset',()=>{
  const source=fs.readFileSync(path.join(root,'sw.js'),'utf8'),version=source.match(/const VERSION = '([^']+)'/)[1];
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),assets=[...html.matchAll(/(?:src|href)="([^"#]+\?v=[^"]+)"/g)].map(m=>m[1]);
  const sw=vm.createContext({self:{registration:{scope:'https://example.test/bow/'},addEventListener(){}},URL});
  vm.runInContext(source+'\nself.core=CORE;',sw);
  for(const asset of assets){assert(asset.endsWith('?v='+version),asset+' has a mismatched version');assert(sw.self.core.includes('./'+asset),asset+' is not cached');assert(fs.existsSync(path.join(root,asset.split('?')[0])),asset+' is missing');}
});
console.log('\n'+passed+' tests passed; '+failed+' failed.');
if(failed)process.exitCode=1;

