'use strict';
(() => {
  const label = $('offlineStatus');
  let ready = false;
  function update() { label.textContent = ready ? (navigator.onLine ? 'Ready for offline use · Ravelry & AI need internet' : 'Offline · monthly ideas, charts and saved data are ready') : (navigator.onLine ? 'Preparing offline access…' : 'Offline · reconnect once to prepare offline access'); }
  if (!('serviceWorker' in navigator) || !window.isSecureContext || location.protocol === 'file:') {
    label.textContent = 'For offline reopening, use this app on an HTTPS site such as GitHub Pages.'; return;
  }
  update(); window.addEventListener('online', update); window.addEventListener('offline', update);
  const isReady = async () => {
    let readyTimeout;
    const registration = await Promise.race([navigator.serviceWorker.ready,new Promise((resolve,reject)=>{readyTimeout=setTimeout(()=>reject(Error('Offline setup timed out')),15000);})]).finally(()=>clearTimeout(readyTimeout));
    const answer = await new Promise(resolve => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); resolve(false); }, 5000);
      channel.port1.onmessage = e => { clearTimeout(timeout); channel.port1.close(); resolve(e.data?.offlineReady === true); };
      registration.active.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
    });
    ready = answer; update();
  };
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(registration => {
    const showUpdate=()=>{ if(registration.waiting&&navigator.serviceWorker.controller){$('updateNotice').hidden=false;$('updateNotice').textContent='An app update is downloaded. Export a backup, close all Bow & Purl tabs and home-screen windows, then reopen to use it. Keep browser data to preserve your work.';} };
    showUpdate();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')showUpdate();});});
    return isReady();
  }).catch(() => {
    label.textContent = 'Offline setup did not finish. Reconnect and reload to try again.';
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => isReady().catch(() => {}));
})();
