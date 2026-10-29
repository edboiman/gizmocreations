'use strict';
// Projects are personal working records, separate from reusable pattern designs.
function validProject(p) {
  const text = (v,n) => typeof v === 'string' && v.length <= n;
  const count = v => Number.isInteger(v) && v >= 0 && v <= 1000000;
  return p && text(p.id,100) && p.id.length > 0 && text(p.name,100) && p.name.trim().length > 0 &&
    (p.patternId === null || text(p.patternId,100)) && (p.stashId === null || text(p.stashId,100)) &&
    ['active','paused','complete'].includes(p.status) && count(p.row) && count(p.goal) && count(p.repeatLength) &&
    text(p.notes,10000) && text(p.needles,200) && text(p.gauge,200) && text(p.section,100) &&
    validPriceDate(p.started) && text(p.updated,40) && Number.isFinite(Date.parse(p.updated)) &&
    (p.completed === null || validPriceDate(p.completed)) &&
    (p.yardsNeeded === null || Number.isFinite(p.yardsNeeded) && p.yardsNeeded >= 0 && p.yardsNeeded < 100000) &&
    Array.isArray(p.counters) && p.counters.length <= 2 && p.counters.every(c => c && text(c.name,40) && c.name.trim().length > 0 && count(c.value)) &&
    Array.isArray(p.history) && p.history.length <= 40 && p.history.every(h => h && text(h.at,40) && Number.isFinite(Date.parse(h.at)) && text(h.event,200));
}
let projects = BPStore.loadList('bow-purl-projects', validProject, 500);
let editingProjectId = null;
function saveProjects(next) {
  if (next.length > 500 || !next.every(validProject)) { notify('Check project details. This app supports up to 500 projects.'); return false; }
  if (!writeStorage('bow-purl-projects', next)) return false;
  projects = next; return true;
}
function projectHistory(p, event) { p.updated = new Date().toISOString(); p.history = [...p.history,{at:p.updated,event}].slice(-40); }
function openProjectForm(pattern = null, project = null) {
  editingProjectId = project?.id || null;
  $('projectDialogTitle').textContent = project ? 'Edit project' : 'Start a project';
  const patternMenu = $('projectPattern'), yarnMenu = $('projectStash');
  patternMenu.replaceChildren(); yarnMenu.replaceChildren();
  for (const [menu, label] of [[patternMenu,'No pattern linked'],[yarnMenu,'No yarn linked']]) { const o=document.createElement('option');o.value='';o.textContent=label;menu.append(o); }
  for (const p of patterns) { const o=document.createElement('option');o.value=p.id;o.textContent=p.name;patternMenu.append(o); }
  for (const s of stash) { const o=document.createElement('option');o.value=s.id;o.textContent=s.brand+(s.color?' · '+s.color:'')+(s.dyeLot?' · lot '+s.dyeLot:'');yarnMenu.append(o); }
  $('projectName').value = project?.name || pattern?.name || '';
  patternMenu.value = project?.patternId || pattern?.id || '';
  yarnMenu.value = project?.stashId || '';
  $('projectNeedles').value = project?.needles || '';
  $('projectGauge').value = project?.gauge || '';
  $('projectSection').value = project?.section || '';
  $('projectNotes').value = project?.notes || '';
  $('projectGoal').value = project?.goal || '';
  $('projectRepeat').value = project?.repeatLength || '';
  $('projectRow').value = project?.row || 0;
  $('projectStatus').value = project?.status || 'active';
  $('projectStarted').value = project?.started || localPriceDate();
  $('projectYards').value = project?.yardsNeeded ?? '';
  for (let i=0;i<2;i++) $('projectCounter'+i).value = project?.counters[i]?.name || '';
  $('projectDialog').showModal();
}
$('newProject').onclick = () => openProjectForm();
$('cancelProject').onclick = () => $('projectDialog').close();
$('projectForm').onsubmit = e => {
  e.preventDefault();
  try {
    const next = structuredClone(projects), old = next.find(p=>p.id===editingProjectId);
    const whole = id => { const n=Number($(id).value);if(!Number.isInteger(n)||n<0||n>1000000)throw Error('Counters, row goals and repeats need whole numbers from 0 to 1,000,000.');return n; };
    const names = [0,1].map(i=>$('projectCounter'+i).value.trim());
    const p = {
      id: old?.id || newId(), name:$('projectName').value.trim(), patternId:$('projectPattern').value||null, stashId:$('projectStash').value||null,
      needles:$('projectNeedles').value.trim(), gauge:$('projectGauge').value.trim(), section:$('projectSection').value.trim(), notes:$('projectNotes').value,
      row:whole('projectRow'), goal:whole('projectGoal'), repeatLength:whole('projectRepeat'), status:$('projectStatus').value,
      started:$('projectStarted').value, completed:$('projectStatus').value==='complete' ? old?.completed || localPriceDate() : null,
      updated:old?.updated || new Date().toISOString(), history:old?.history || [],
      yardsNeeded: $('projectYards').value.trim()==='' ? null : Number($('projectYards').value),
      counters:names.map((name,i)=>({name,value:old?.counters[i]?.value||0})).filter(c=>c.name)
    };
    projectHistory(p, old ? 'Project details updated' : 'Project started');
    if (!validProject(p)) throw Error('Check the project name, start date, yardage and notes.');
    if (p.started > localPriceDate()) throw Error('Start date must be today or earlier.');
    if (p.status==='complete' && p.completed < p.started) throw Error('Completion cannot be before the start date.');
    if (saveProjects([...next.filter(n=>n.id!==p.id),p])) { $('projectDialog').close(); tab('projects'); renderProjects(); notify(old?'Project updated.':'Project started. Your counters and notes save on this device.'); }
  } catch(err) { notify(err.message); }
};
function updateProject(id, change, event, focusId) {
  const next=structuredClone(projects), p=next.find(p=>p.id===id);if(!p)return;
  change(p); projectHistory(p,event);
  if(saveProjects(next)){renderProjects();$('projectAnnouncement').textContent=p.name+': '+p.row+' completed rows'+(p.counters.length?', '+p.counters.map(c=>c.name+' '+c.value).join(', '):'')+'.';if(focusId)$(focusId)?.focus({preventScroll:true});}
}
function projectEstimate(p) {
  const yarn=stash.find(s=>s.id===p.stashId), pattern=patterns.find(n=>n.id===p.patternId);
  if(p.yardsNeeded===null)return {text:'Add your chosen size’s yardage in Edit details for a planning estimate.'};
  const required=p.yardsNeeded*1.1, available=yarn?stashTotal(yarn):null;
  const quote = yarn?.priceUSD != null && yarn?.yards > 0;
  const rate = quote ? yarn.priceUSD/yarn.yards : pricePerYard(yarn?.weight||pattern?.weight||'Unspecified');
  return {text:Math.ceil(required)+' yds with a 10% allowance · ≈ '+money(required*rate)+' yarn value ('+(quote?'your recorded purchase price':'weight estimate')+').',
    coverage: !yarn ? '' : available===null ? 'Linked yarn amount is unknown; coverage cannot be checked.' : available>=required ? 'Linked entry has enough estimated yardage. Check dye lot, fiber and gauge.' : 'Linked entry is about '+fmt(required-available)+' yds short with the allowance.'};
}
function renderProjects() {
  const box=$('projectList');box.replaceChildren();
  const q=$('projectSearch').value.trim().toLowerCase(), status=$('projectFilter').value;
  const shown=projects.filter(p=>(status==='all'||p.status===status)&&(!q||(p.name+' '+p.notes+' '+p.section).toLowerCase().includes(q))).sort((a,b)=>b.updated.localeCompare(a.updated));
  $('projectCount').textContent=shown.length+' of '+projects.length+' projects · counters show completed rows';
  if(!shown.length){const c=textNode('div','',box);c.className='panel empty-state';textNode('h3',projects.length?'No projects match.':'Keep your next stitch close.',c);textNode('p',projects.length?'Try another status or search.':'Start a project here, or choose Start project on a saved pattern. Keep needles, gauge and a note for your next session together.',c);return;}
  for(const p of shown){
    const card=textNode('article','',box);card.className='panel project-card';card.dataset.project=p.id;
    const top=textNode('div','',card);top.className='project-top';
    const meta=textNode('div','',top);textNode('span',({active:'ON THE NEEDLES',paused:'TAKING A LITTLE REST',complete:'FINISHED'})[p.status],meta).className='eyebrow';textNode('h3',p.name,meta);
    const edit=textNode('button','Edit details',top);edit.onclick=()=>openProjectForm(null,p);
    const linked=patterns.find(n=>n.id===p.patternId), yarn=stash.find(s=>s.id===p.stashId);
    if(linked)textNode('p','Pattern: '+linked.name,card).className='muted';
    else if(p.patternId)textNode('p','The linked pattern is no longer in this library. Your project notes and counters are kept.',card).className='warn';
    if(p.section)textNode('p','Working on: '+p.section,card).className='project-section';
    const counter=textNode('div','',card);counter.className='project-counter';
    const minus=textNode('button','−',counter), amount=textNode('div','',counter), plus=textNode('button','+ 1 row',counter);
    minus.setAttribute('aria-label','Undo one completed row for '+p.name);plus.setAttribute('aria-label','Complete one row for '+p.name);
    const number=textNode('strong',p.row,amount);number.setAttribute('aria-label',p.row+' completed rows');textNode('span','rows completed',amount);
    minus.disabled=p.row===0||p.status!=='active';plus.disabled=p.row>=1000000||p.status!=='active';
    plus.className='primary';plus.id='row-plus-'+p.id;minus.id='row-minus-'+p.id;
    minus.onclick=()=>updateProject(p.id,n=>n.row--,'Frogged one row',minus.id);
    plus.onclick=()=>updateProject(p.id,n=>n.row++,'Completed row '+(p.row+1),plus.id);
    if(p.repeatLength)textNode('p',Math.floor(p.row/p.repeatLength)+' full repeats completed · next: row '+(p.row%p.repeatLength+1)+' of '+p.repeatLength,card).className='repeat-status';
    if(p.goal){const progress=document.createElement('progress');progress.max=p.goal;progress.value=Math.min(p.row,p.goal);progress.setAttribute('aria-label','Row goal for '+p.name);card.append(progress);textNode('p',Math.min(100,Math.round(p.row/p.goal*100))+'% of '+p.goal+'-row goal (rows only)',card).className='hint';}
    if(p.counters.length){const extras=textNode('div','',card);extras.className='extra-counters';
      p.counters.forEach((c,i)=>{const row=textNode('div','',extras);textNode('b',c.name+': '+c.value,row);const sub=textNode('button','−',row),add=textNode('button','+',row);sub.setAttribute('aria-label','Decrease '+c.name+' for '+p.name);add.setAttribute('aria-label','Increase '+c.name+' for '+p.name);sub.disabled=c.value===0||p.status!=='active';add.disabled=c.value>=1000000||p.status!=='active';sub.id='counter-minus-'+i+'-'+p.id;add.id='counter-plus-'+i+'-'+p.id;sub.onclick=()=>updateProject(p.id,n=>n.counters[i].value--,c.name+' decreased',sub.id);add.onclick=()=>updateProject(p.id,n=>n.counters[i].value++,c.name+' increased',add.id);});
    }
    if(p.needles||p.gauge)textNode('p',[p.needles?'Needles: '+p.needles:'',p.gauge?'Gauge: '+p.gauge:''].filter(Boolean).join(' · '),card).className='muted';
    if(p.notes){const note=textNode('p',p.notes,card);note.className='project-notes';}
    if(yarn)textNode('p','Yarn reference: '+yarn.brand+(yarn.color?' · '+yarn.color:'')+(yarn.dyeLot?' · lot '+yarn.dyeLot:''),card).className='muted';
    else if(p.stashId)textNode('p','The linked yarn is no longer in your stash. Edit the project to choose a yarn reference.',card).className='warn';
    const estimate=projectEstimate(p);textNode('p',estimate.text,card).className='hint';if(estimate.coverage)textNode('p',estimate.coverage,card).className='hint';
    const actions=textNode('div','',card);actions.className='actions';
    if(linked?.chart){textNode('button','Open linked chart',actions).onclick=()=>{snapshot();state=structuredClone(linked.chart);currentId=linked.id;$('chartMode').value='knit';saveChartView();controls();draw();draft();tab('studio');};}
    textNode('button',p.status==='active'?'Pause project':'Resume project',actions).onclick=()=>updateProject(p.id,n=>{n.status=p.status==='active'?'paused':'active';n.completed=null;},p.status==='active'?'Project paused':'Project resumed');
    if(p.status!=='complete')textNode('button','Mark finished',actions).onclick=()=>{if(confirm('Mark “'+p.name+'” as finished? You can resume it later.'))updateProject(p.id,n=>{n.status='complete';n.completed=localPriceDate();},'Project finished');};
    const details=textNode('details','',card);details.className='sub';textNode('summary','Dates & recent activity',details);
    textNode('p','Started '+priceDateText(p.started)+(p.completed?' · Finished '+priceDateText(p.completed):''),details).className='hint';
    const log=textNode('ul','',details);for(const h of [...p.history].reverse().slice(0,10))textNode('li',new Date(h.at).toLocaleString()+' · '+h.event,log);
    textNode('button','Delete project',details).onclick=()=>{if(confirm('Delete “'+p.name+'” and its counters? Your pattern and stash will be kept.'))if(saveProjects(projects.filter(n=>n.id!==p.id)))renderProjects();};
  }
}
for(const id of ['projectSearch','projectFilter'])$(id).addEventListener('input',renderProjects);
document.addEventListener('studio:tab',e=>{if(e.detail==='projects')renderProjects();});
let screenRequested=false, screenLock=null;
async function acquireScreen(){
  try{screenLock=await navigator.wakeLock.request('screen');$('keepAwake').textContent='Allow screen to sleep';$('keepAwake').setAttribute('aria-pressed','true');screenLock.addEventListener('release',()=>{screenLock=null;$('keepAwake').textContent=screenRequested?'Keep screen awake (tap to retry)':'Keep screen awake';$('keepAwake').setAttribute('aria-pressed','false');});}
  catch{screenRequested=false;notify('Screen wake lock is unavailable here. Use your device’s screen timeout setting.');}
}
$('keepAwake').onclick=async()=>{if(screenRequested&&screenLock){screenRequested=false;await screenLock.release();}else{screenRequested=true;await acquireScreen();}};
if(!('wakeLock'in navigator)){$('keepAwake').hidden=true;}
document.addEventListener('visibilitychange',()=>{if(screenRequested&&!document.hidden)acquireScreen();});
renderProjects();

