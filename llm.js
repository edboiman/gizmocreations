'use strict';
// Optional AI connector. Sends a plain-language prompt to YOUR OWN backend
// (see worker/claude-worker.js), which holds the API key and returns chart rows.
// No API key is ever stored in or sent from this page.
const AI = {
  storageKey: 'bow-purl-ai-endpoint',
  endpoint() { try { return localStorage.getItem(this.storageKey) || ''; } catch { return ''; } },
  setEndpoint(url) { try { localStorage.setItem(this.storageKey, url); } catch {} },
  token() { try { return localStorage.getItem('bow-purl-ai-token') || ''; } catch { return ''; } },
  setToken(t) { try { localStorage.setItem('bow-purl-ai-token', t); } catch {} },

  async generate(prompt, cols, rows) {
    const url = this.endpoint();
    if (!/^https:\/\//i.test(url)) throw Error('Add your AI connector URL (https://…) in AI settings first.');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(this.token() ? { 'X-App-Token': this.token() } : {}) },
        body: JSON.stringify({ prompt: String(prompt).slice(0, 400), cols, rows }),
        signal: ctrl.signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Error(data.error || `The AI connector returned an error (${res.status}).`);
      if (!Array.isArray(data.rows) || !data.rows.length || data.rows.length > 160 ||
          !data.rows.every(r => typeof r === 'string' && /^[012]{1,120}$/.test(r)))
        throw Error('The AI connector returned a chart in an unexpected format.');
      return data.rows;
    } catch (e) {
      if (e.name === 'AbortError') throw Error('The AI request took too long. Try again.');
      throw e;
    } finally { clearTimeout(t); }
  }
};
