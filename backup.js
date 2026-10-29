'use strict';
// Full validation and a preview precede the one-record restore commit.
function makeBackup() {
  return { app:'bow-and-purl', version:4, exportedAt:new Date().toISOString(),
    patterns:structuredClone(patterns), motifs:structuredClone(myMotifs), stash:structuredClone(stash),
    prices:structuredClone(prices), yarns:structuredClone(myYarns), projects:structuredClone(projects),
    draft:{...structuredClone(state),patternId:currentId}, seasonPrefs:readStorage('bow-purl-season-prefs',{}),
    view:readStorage('bow-purl-view',{}) };
}
function validateBackup(data) {
  const unique = list => new Set(list.map(p=>p.id)).size===list.length;
  if(!data||data.app!=='bow-and-purl'||![1,2,3,4].includes(data.version)||!Array.isArray(data.patterns)||data.patterns.length>3000||!data.patterns.every(validPattern)||!unique(data.patterns))throw Error('The pattern data is not a valid Bow & Purl backup. Nothing was restored.');
  if(data.prices!==undefined&&!validPrices(data.prices))throw Error('Invalid price settings. Nothing was restored.');
  if(data.stash!==undefined&&(!Array.isArray(data.stash)||data.stash.length>500||!data.stash.every(validStash)||!unique(data.stash)))throw Error('Invalid stash data. Nothing was restored.');
  if(data.yarns!==undefined&&(!Array.isArray(data.yarns)||data.yarns.length>300||!data.yarns.every(validYarn)))throw Error('Invalid saved yarns. Nothing was restored.');
  if(data.projects!==undefined&&(!Array.isArray(data.projects)||data.projects.length>500||!data.projects.every(validProject)||!unique(data.projects)))throw Error('Invalid projects. Nothing was restored.');
  if(data.draft!==undefined&&!validChart(data.draft))throw Error('Invalid chart draft. Nothing was restored.');
  if(data.motifs!==undefined&&(!data.motifs||typeof data.motifs!=='object'||Array.isArray(data.motifs)||Object.keys(data.motifs).length>1000||!Object.entries(data.motifs).every(([k,v])=>safeKey(k)&&validMotif(v))))throw Error('Invalid motifs. Nothing was restored.');
  if(data.seasonPrefs!==undefined&&(!data.seasonPrefs||typeof data.seasonPrefs!=='object'||Array.isArray(data.seasonPrefs)||(data.seasonPrefs.hemisphere!==undefined&&!['north','south'].includes(data.seasonPrefs.hemisphere))))throw Error('Invalid seasonal preferences. Nothing was restored.');
  if(data.view!==undefined&&(!data.view||typeof data.view!=='object'||Array.isArray(data.view)))throw Error('Invalid chart preferences. Nothing was restored.');
  return data;
}
function mergeBackupItems(current, incoming, useBackup, match = (a,b)=>a.id===b.id) {
  const next=structuredClone(current);
  for(const item of incoming||[]) { const i=next.findIndex(existing=>match(existing,item)); if(i<0)next.push(structuredClone(item));else if(useBackup)next[i]={...structuredClone(item),id:next[i].id}; }
  return next;
}
function restorePlan(data, options={}) {
  validateBackup(data);
  const useBackup=options.useBackup===true, alias=new Map();
  const nextStash=mergeBackupItems(stash,data.stash,useBackup,(a,b)=>a.id===b.id||(a.ravId!==undefined&&a.ravId===b.ravId));
  for(const s of data.stash||[]) { const local=nextStash.find(n=>n.id===s.id||(s.ravId!==undefined&&n.ravId===s.ravId));if(local)alias.set(s.id,local.id); }
  const incomingProjects=(data.projects||[]).map(p=>({...p,stashId:alias.get(p.stashId)||p.stashId}));
  const nextPatterns=mergeBackupItems(patterns,data.patterns,useBackup);
  const nextProjects=mergeBackupItems(projects,incomingProjects,useBackup);
  const nextYarns=structuredClone(myYarns);
  for(const y of data.yarns||[]) { const i=nextYarns.findIndex(n=>n.name.toLowerCase()===y.name.toLowerCase());if(i<0)nextYarns.push(structuredClone(y));else if(useBackup)nextYarns[i]=structuredClone(y); }
  if(nextPatterns.length>3000||nextStash.length>500||nextProjects.length>500||nextYarns.length>300)throw Error('This merge would exceed the app’s item limits. Nothing was restored.');
  const nextMotifs={...myMotifs};for(const[k,v]of Object.entries(data.motifs||{}))if(!Object.hasOwn(nextMotifs,k)||useBackup)nextMotifs[k]=structuredClone(v);
  const nextPrices=options.prices&&data.prices?structuredClone(data.prices):structuredClone(prices);
  const changes={'bow-purl-patterns':nextPatterns,'bow-purl-stash':nextStash,'bow-purl-projects':nextProjects,'bow-purl-motifs':nextMotifs,'bow-purl-yarns':nextYarns,'bow-purl-prices':nextPrices};
  if(data.seasonPrefs?.hemisphere&&!readStorage('bow-purl-season-prefs',null))changes['bow-purl-season-prefs']={hemisphere:data.seasonPrefs.hemisphere};
  if(options.draft&&data.draft)changes['bow-purl-draft']={...structuredClone(data.draft),patternId:nextPatterns.some(p=>p.id===data.draft.patternId)?data.draft.patternId:null};
  return {changes, nextPatterns,nextStash,nextProjects,nextMotifs,nextYarns,nextPrices};
}
let pendingRestore=null;
function exportBackup() { download(new Blob([JSON.stringify(makeBackup(),null,2)],{type:'application/json'}),'bow-and-purl-backup-'+localPriceDate()+'.json');notify('Backup download requested. Keep the JSON file somewhere safe; connector tokens are excluded.'); }
$('backup').onclick=exportBackup;$('quickBackup').onclick=exportBackup;
function downloadRecovery(){download(new Blob([JSON.stringify(BPStore.recoveryData(),null,2)],{type:'application/json'}),'bow-and-purl-recovery-'+localPriceDate()+'.json');}
$('downloadRecovery').onclick=downloadRecovery;$('recoveryBackup').onclick=downloadRecovery;
$('dismissRecovery').onclick=()=>{if(BPStore.acknowledgeRecovery())storageStatus();};
$('restore').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try {
    if(file.size>25*1024*1024)throw Error('Backup too large (maximum 25 MB).');
    const data=validateBackup(JSON.parse(await file.text()));
    // Preflight merged limits before presenting any save action.
    restorePlan(data);
    pendingRestore=data;
    const conflicts=data.patterns.filter(p=>patterns.some(n=>n.id===p.id)).length;
    $('restoreSummary').textContent=data.patterns.length+' patterns ('+conflicts+' already on this device), '+(data.stash?.length||0)+' stash entries, '+(data.projects?.length||0)+' projects, '+Object.keys(data.motifs||{}).length+' motifs. New items are added. Nothing is deleted. Choose which matching records to keep.';
    $('restorePolicy').value='current';
    $('restoreDraft').checked=false;$('restoreDraft').disabled=!data.draft;
    $('restorePrices').checked=!!data.prices&&!prices.custom.length&&!prices.reviewedAt&&!Object.keys(prices.weightMeta||{}).length&&prices.source.startsWith('Built-in');$('restorePrices').disabled=!data.prices;
    $('restoreDraftNote').textContent=data.draft?'The backup has a chart draft. Select the option below only if you want to replace the chart currently open here. Export this device’s backup first to keep both.':'This older backup has no chart draft; the current chart will be kept.';
    $('restoreDialog').showModal();
  }catch(err){notify(err.message);}finally{e.target.value='';}
};
$('cancelRestore').onclick=()=>{pendingRestore=null;$('restoreDialog').close();};
$('restoreDialog').addEventListener('cancel',()=>{pendingRestore=null;});
$('restoreForm').onsubmit=e=>{
  e.preventDefault();if(!pendingRestore)return;
  try{
    const plan=restorePlan(pendingRestore,{useBackup:$('restorePolicy').value==='backup',draft:$('restoreDraft').checked,prices:$('restorePrices').checked});
    if(!BPStore.commit(plan.changes))return;
    patterns=plan.nextPatterns;stash=plan.nextStash;projects=plan.nextProjects;myMotifs=plan.nextMotifs;myYarns=plan.nextYarns;prices=plan.nextPrices;
    if(plan.changes['bow-purl-draft']){snapshot();state=structuredClone(plan.changes['bow-purl-draft']);currentId=state.patternId;controls();draw();}
    else if(currentId&&!patterns.some(p=>p.id===currentId))currentId=null;
    buildMotifMenu($('motif').value);fillBrandList();renderLibrary();renderStash();renderPrices();renderProjects();renderIdeas();
    pendingRestore=null;$('restoreDialog').close();notify('Backup restored in one saved update. Your merge choices were applied; other data was kept.');
  }catch(err){notify(err.message);}
};
function storageStatus() {
  const info=BPStore.status(), box=$('storageNotice');
  box.hidden=!info.problem&&(!info.recoveryCount||info.recoveryAcknowledged);
  $('storageMessage').textContent=info.problem||(info.recoveryCount+' saved sections contain records needing recovery. Valid entries remain available. The original records are retained; download a recovery file before clearing browser data.');
  $('downloadRecovery').hidden=!info.recoveryCount&&!info.blocked;
  $('dismissRecovery').hidden=!!info.problem||!info.recoveryCount;
  $('recoveryBackup').hidden=!info.recoveryCount&&!info.blocked;
  const health=info.problem?'Some work is not saved — export a backup':info.recoveryCount&&!info.recoveryAcknowledged?'Saved data needs recovery review':'On this device · export regular backups';
  if($('saveHealth').textContent!==health)$('saveHealth').textContent=health;
}
document.addEventListener('bow:storage',storageStatus);storageStatus();

