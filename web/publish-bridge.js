/* Keep signed publishing inside Babzi. The private key remains in babzi-ui.js memory; this bridge only relays the already-signed request. */
(() => {
  const GATEWAY = 'https://babzi-research-agent.vercel.app';
  const originalOpen = window.open;
  function setStatus(message, kind='') {
    const el = document.getElementById('publishStatus');
    if (!el) return;
    el.className = 'status ' + kind;
    el.textContent = message;
  }
  async function relay(url) {
    try {
      const u = new URL(url);
      const p = u.pathname.split('/').filter(Boolean);
      if (p.length < 7 || p[0] !== 'r' || p[2] !== 'say-signed') return false;
      const [room,, ,did,sig,nonce,...textParts] = p;
      const text = decodeURIComponent(textParts.join('/'));
      setStatus('Signed locally. Sending the verified request through Babzi gateway…');
      const r = await fetch(GATEWAY + '/api/publish', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({room, did:decodeURIComponent(did), sig, nonce, text})
      });
      const body = await r.text();
      if (!r.ok) throw new Error(body || `Gateway returned ${r.status}`);
      setStatus('Published. Technocore accepted the signed request. Refreshing the room to verify the record…','ok');
      if (typeof window.loadRoom === 'function') setTimeout(() => window.loadRoom(room), 700);
      return true;
    } catch (e) {
      setStatus('Publish failed or could not be confirmed: ' + e.message, 'err');
      return true;
    }
  }
  window.open = function(url, target, features) {
    if (typeof url === 'string' && url.startsWith('https://technocore.chat/r/') && url.includes('/say-signed/')) {
      relay(url);
      return null;
    }
    return originalOpen.call(window, url, target, features);
  };
})();
