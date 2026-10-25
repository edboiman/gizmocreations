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
    const registration = await navigator.serviceWorker.ready;
    const answer = await new Promise(resolve => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); resolve(false); }, 5000);
      channel.port1.onmessage = e => { clearTimeout(timeout); channel.port1.close(); resolve(e.data?.offlineReady === true); };
      registration.active.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
    });
    ready = answer; update();
  };
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(() => isReady()).catch(() => {
    label.textContent = 'Offline setup did not finish. Reconnect and reload to try again.';
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => isReady().catch(() => {}));
})();
