'use strict';
// Optional AI connector. Sends a plain-language prompt to YOUR OWN backend
// (see worker/claude-worker.js), which holds the API key and returns chart rows.
// No API key is ever stored in or sent from this page.
const AI = {
  storageKey: 'bow-purl-ai-endpoint',
  endpoint() { try { return localStorage.getItem(this.storageKey) || ''; } catch { return ''; } },
  setEndpoint(url) { try { localStorage.setItem(this.storageKey, url); return true; } catch { return false; } },
  token() { try { return localStorage.getItem('bow-purl-ai-token') || ''; } catch { return ''; } },
  setToken(t) { try { localStorage.setItem('bow-purl-ai-token', t); return true; } catch { return false; } },

  async generate(prompt, cols, rows) {
    const url = this.endpoint();
    if (!connectorURL(url)) throw Error('Add a valid AI connector URL (https://…) in AI settings first.');
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
      if (!Array.isArray(data.rows) || data.rows.length !== rows ||
          !data.rows.every(r => typeof r === 'string' && /^[012]{1,120}$/.test(r) && r.length === cols))
        throw Error('The AI did not return your selected chart dimensions. Your existing chart was kept. Try again or update the AI Worker.');
      return data.rows;
    } catch (e) {
      if (e.name === 'AbortError') throw Error('The AI request took too long. Try again.');
      throw e;
    } finally { clearTimeout(t); }
  }
};
