/* Solo actualiza el código estático. Nunca borra IndexedDB ni datos financieros. */
(() => {
  if (!('serviceWorker' in navigator)) return;
  let accepted = false, reloading = false, registration, banner;
  function reloadOnce() {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  }
  function offerUpdate() {
    if (banner || !navigator.serviceWorker.controller) return;
    banner = document.createElement('aside');
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-label', 'Actualización de EduMoney');
    banner.style.cssText = 'position:fixed;bottom:90px;left:12px;right:12px;max-width:650px;margin:auto;z-index:99999;background:#fff;color:#073b39;border:2px solid #008563;border-radius:16px;padding:14px;box-shadow:0 4px 18px #001c3940;font:16px system-ui;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
    const text = document.createElement('span');
    text.textContent = 'Hay una versión nueva. Guarda lo que estés editando antes de actualizar. Tus registros guardados se conservan.';
    text.style.cssText = 'flex:1;min-width:180px';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Actualizar EduMoney';
    button.style.cssText = 'background:#00664b;color:white;border:0;border-radius:12px;padding:14px;font:700 16px system-ui;cursor:pointer';
    button.addEventListener('click', () => {
      accepted = true;
      if (registration.waiting) registration.waiting.postMessage({ type: 'EDUMONEY_ACTIVATE_UPDATE' });
      else reloadOnce();
    });
    banner.append(text, button);
    document.body.append(banner);
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (accepted) reloadOnce();
    else offerUpdate(); // Otra pestaña no debe descartar un formulario abierto.
  });
  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && registration.waiting) offerUpdate();
        });
      });
      if (registration.waiting) offerUpdate();
      await registration.update();
    } catch { /* Sin conexión se mantiene el código y los registros disponibles. */ }
  });
})();
