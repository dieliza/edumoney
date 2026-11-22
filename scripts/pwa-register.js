/* Actualiza solo el código estático; no borra IndexedDB ni registros financieros. */
(() => {
  if (!('serviceWorker' in navigator)) return;
  const controlledAtLoad = !!navigator.serviceWorker.controller;
  let accepted = false, reloading = false, registration, banner, checking;
  function reloadOnce() {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  }
  function offerUpdate(activated = false) {
    if (banner || (!registration?.waiting && (!activated || !controlledAtLoad)) || !navigator.serviceWorker.controller) return;
    banner = document.createElement('aside');
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-label', 'Actualización de EduMoney');
    banner.style.cssText = 'position:fixed;bottom:90px;left:12px;right:12px;max-width:650px;margin:auto;z-index:99999;background:#063F49;color:#F4FFFC;border:2px solid #B7FFE8;border-radius:16px;padding:14px;box-shadow:0 4px 18px #001c3940;font:16px system-ui;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
    const text = document.createElement('span');
    text.textContent = 'Hay una versión nueva. Guarda lo que estés editando antes de actualizar. Tus registros guardados se conservan.';
    text.style.cssText = 'flex:1;min-width:180px';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Actualizar EduMoney';
    button.style.cssText = 'background:#00664b;color:white;border:1px solid #B7FFE8;border-radius:12px;padding:14px;font:700 16px system-ui;cursor:pointer';
    button.addEventListener('click', () => {
      accepted = true;
      if (registration.waiting) registration.waiting.postMessage({ type: 'EDUMONEY_ACTIVATE_UPDATE' });
      else reloadOnce();
    });
    banner.append(text, button);
    document.body.append(banner);
  }
  async function checkUpdate() {
    if (!registration || document.visibilityState === 'hidden') return;
    if (checking) return checking;
    checking = (async () => {
      try { await registration.update(); offerUpdate(); }
      catch { /* Sin conexión se conservan el código y los datos locales. */ }
    })();
    try { await checking; } finally { checking = null; }
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (accepted) reloadOnce();
    else offerUpdate(true); // No descartar formularios abiertos sin que el usuario actualice.
  });
  async function start() {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', () => {
          if (worker.state === 'installed') offerUpdate();
        });
      });
      offerUpdate();
      await checkUpdate();
    } catch { /* La app puede seguir disponible sin conexión. */ }
  }
  if (document.readyState === 'complete') void start();
  else window.addEventListener('load', start, { once: true });
  document.addEventListener('visibilitychange', () => void checkUpdate());
  window.addEventListener('focus', () => void checkUpdate());
  window.addEventListener('pageshow', () => void checkUpdate());
  window.setInterval(() => void checkUpdate(), 60000);
})();
