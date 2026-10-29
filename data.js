'use strict';
// A single localStorage record makes multi-section restores atomic. Legacy keys
// are read once and retained untouched as a migration safety net.
const BPStore = (() => {
  const KEY = 'bow-purl-data-v4';
  const KEYS = ['patterns','motifs','draft','stash','prices','yarns','projects','season-prefs','shop','cat-paused','view'].map(s => 'bow-purl-' + s);
  const values = Object.create(null), recovery = Object.create(null);
  const failedKeys = new Set();
  let baseline = null, revision = 0, blocked = false, problem = '', dirty = false, recoveryAcknowledged = false;
  const emit = () => document.dispatchEvent(new CustomEvent('bow:storage'));
  const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  try {
    baseline = localStorage.getItem(KEY);
    if (baseline !== null) {
      const data = JSON.parse(baseline);
      if (!isObject(data) || data.schema !== 1 || !Number.isSafeInteger(data.revision) || !isObject(data.values) || !isObject(data.recovery)) throw Error('invalid record');
      revision = data.revision;
      recoveryAcknowledged = data.recoveryAcknowledged === true;
      for (const k of KEYS) {
        if (Object.hasOwn(data.values, k)) values[k] = data.values[k];
        if (Object.hasOwn(data.recovery, k)) recovery[k] = data.recovery[k];
      }
    } else {
      for (const k of KEYS) {
        const raw = localStorage.getItem(k);
        if (raw === null) continue;
        try { values[k] = JSON.parse(raw); }
        catch { recovery[k] = { raw, reason: 'This saved section is not valid JSON.' }; }
      }
    }
  } catch {
    blocked = true;
    problem = 'Saved data could not be read. Download a recovery file before changing browser data. Saving is paused to protect it.';
  }
  function read(k, fallback) { return Object.hasOwn(values, k) ? structuredClone(values[k]) : fallback; }
  function flag(k, reason) {
    if (!Object.hasOwn(recovery, k)) recovery[k] = { value: structuredClone(values[k]), reason };
    recoveryAcknowledged = false;
    emit();
  }
  function commit(changes) {
    if (blocked) { dirty = true; emit(); return false; }
    try {
      if (localStorage.getItem(KEY) !== baseline) {
        blocked = true; dirty = true;
        problem = 'Another tab changed your saved data. Export this tab’s work, then reload before continuing. Saving is paused to prevent overwriting it.';
        emit(); return false;
      }
      for (const k of Object.keys(changes)) if (!KEYS.includes(k)) throw Error('Unknown data section');
      const next = { ...values, ...structuredClone(changes) };
      const raw = JSON.stringify({ schema: 1, revision: revision + 1, values: next, recovery, recoveryAcknowledged });
      localStorage.setItem(KEY, raw); // succeeds for the entire update or changes nothing
      Object.assign(values, next); baseline = raw; revision++;
      for(const k of Object.keys(changes))failedKeys.delete(k);
      dirty = failedKeys.size>0; problem = dirty ? 'Some earlier changes are still unsaved. Retry saving them or export a backup before leaving this tab.' : '';
      emit(); return true;
    } catch {
      for(const k of Object.keys(changes))failedKeys.add(k);
      dirty = true;
      problem = 'Changes could not be saved. Storage may be full or unavailable. Keep this tab open and export a backup now.';
      emit(); return false;
    }
  }
  function loadList(k, validator, max) {
    const raw = read(k, []);
    const seen = new Set();
    const list = Array.isArray(raw) ? raw.filter(item => {
      try {
        if (!validator(item)) return false;
        const id = item.id ?? item.name?.toLowerCase();
        if (id !== undefined && seen.has(id)) return false;
        if (id !== undefined) seen.add(id);
        return true;
      } catch { return false; }
    }).slice(0, max) : [];
    if (!Array.isArray(raw) || list.length !== raw.length) { flag(k, 'Invalid, duplicate or excessive entries were set aside; valid entries remain available.'); values[k]=structuredClone(list); }
    return list;
  }
  function recoveryData() {
    const legacy = {};
    for (const k of KEYS) { try { const raw = localStorage.getItem(k); if (raw !== null) legacy[k] = raw; } catch {} }
    // Connector credentials and app tokens use separate, excluded keys.
    return { app: 'bow-and-purl-recovery', exportedAt: new Date().toISOString(), currentRecord: baseline, recovery, legacy };
  }
  function acknowledgeRecovery() { const previous=recoveryAcknowledged;recoveryAcknowledged=true;if(commit({}))return true;recoveryAcknowledged=previous;return false; }
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) {
      blocked = true;
      problem = 'Saved data changed in another tab. Export any unsaved work here and reload. Saving is paused to prevent overwriting the newer data.';
      emit();
    }
  });
  window.addEventListener('beforeunload', event => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
  const stage=(k,value)=>{if(!KEYS.includes(k))throw Error('Unknown data section');values[k]=structuredClone(value);};
  return { KEY, KEYS, read, commit, flag, stage, loadList, recoveryData, acknowledgeRecovery,
    status: () => ({ blocked, dirty, problem, recoveryAcknowledged, recoveryCount: Object.keys(recovery).length }) };
})();

