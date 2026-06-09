/**
 * Chunk-recovery inline script
 * ----------------------------
 * Este script se inyecta de forma INLINE en el <head> del documento (ver
 * app/layout.tsx) para que se ejecute ANTES de que se cargue cualquier chunk de
 * la aplicación. Ese detalle es crítico: el problema que resuelve es,
 * precisamente, que un chunk de JS no se pueda cargar (404 tras un deploy que
 * regeneró los hashes/buildId). Si la lógica de recuperación viviera dentro del
 * bundle, no podría ejecutarse cuando el bundle es lo que falla.
 *
 * Qué hace:
 *  1. Detecta errores de carga de chunks/módulos (ChunkLoadError, dynamic import
 *     fallido, script/link de /_next/ que falla, MIME 'text/html' en vez de JS).
 *  2. Ante uno, hace un reload "duro" con cache-busting: desregistra service
 *     workers, borra CacheStorage y recarga agregando un query param único, lo
 *     que evita la caché HTTP del navegador Y de cualquier proxy/CDN intermedio.
 *  3. Tiene guarda anti-loop (máximo de reintentos dentro de una ventana de
 *     tiempo) para no quedar en un bucle de recargas si el problema persiste.
 *  4. Expone window.__pfChunkRecovery para que los error boundaries de React
 *     (app/error.tsx, app/global-error.tsx) reutilicen exactamente la misma
 *     lógica en vez de duplicarla.
 *
 * Es JavaScript "vanilla" (no módulo) a propósito: se sirve como texto plano y
 * no depende de ningún chunk.
 */
export const CHUNK_RECOVERY_SCRIPT = `(function () {
  var SS_KEY = '__pf_recovery__';
  var MAX_RELOADS = 2;
  var WINDOW_MS = 30000;
  var CACHE_BUST_PARAM = '__pfr';
  var LOG_ENDPOINT = '/client-log';

  // Reporte remoto de errores: manda el error a stdout del server de Next para
  // verlo en 'docker logs personalfit-frontend'. Usa sendBeacon para que el
  // envío sobreviva aunque la página se recargue/navegue inmediatamente.
  var _reported = {};
  function report(payload) {
    try {
      payload = payload || {};
      payload.url = payload.url || (window.location && window.location.href);
      payload.userAgent = payload.userAgent || (navigator && navigator.userAgent);
      // Dedup simple por (source + message) dentro de la misma carga de página.
      var key = (payload.source || '') + '|' + (payload.message || payload.resource || '');
      if (_reported[key]) return;
      _reported[key] = true;

      var body = JSON.stringify(payload);
      if (navigator && navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(LOG_ENDPOINT, blob);
      } else {
        fetch(LOG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }

  function looksLikeLoadError(input) {
    if (!input) return false;
    var msg = typeof input === 'string' ? input : (input.message || input.reason || (input.reason && input.reason.message) || '');
    msg = String(msg);
    return /ChunkLoadError|Loading chunk [^ ]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|'text\\/html' is not a valid JavaScript MIME type|expected expression, got '<'/i.test(msg);
  }

  function readState() {
    try {
      var raw = sessionStorage.getItem(SS_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || (Date.now() - s.t) > WINDOW_MS) return null;
      return s;
    } catch (e) { return null; }
  }

  function hardReload() {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set(CACHE_BUST_PARAM, String(Date.now()));
      window.location.replace(url.toString());
    } catch (e) {
      window.location.reload();
    }
  }

  function clearClientCaches() {
    var pending = [];
    try {
      if ('serviceWorker' in navigator) {
        pending.push(
          navigator.serviceWorker.getRegistrations().then(function (rs) {
            return Promise.all(rs.map(function (r) { return r.unregister(); }));
          }).catch(function () {})
        );
      }
    } catch (e) {}
    try {
      if (window.caches && caches.keys) {
        pending.push(
          caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          }).catch(function () {})
        );
      }
    } catch (e) {}
    return pending;
  }

  // Recuperación automática: respeta la guarda anti-loop.
  function recover() {
    var state = readState() || { n: 0, t: Date.now() };
    if (state.n >= MAX_RELOADS) {
      // Ya reintentamos suficiente; dejamos que la UI del error boundary tome el control.
      return false;
    }
    state.n += 1;
    state.t = Date.now();
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch (e) {}

    var pending = clearClientCaches();
    if (pending.length) {
      Promise.all(pending).then(hardReload, hardReload);
      // Por si alguna promesa cuelga, forzamos el reload igual.
      setTimeout(hardReload, 1500);
    } else {
      hardReload();
    }
    return true;
  }

  // Recuperación forzada (botón manual): ignora la guarda anti-loop y limpia
  // también storage local, replicando el "borrar datos del navegador" manual.
  function forceReload() {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify({ n: 0, t: Date.now() })); } catch (e) {}
    var pending = clearClientCaches();
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    if (pending.length) {
      Promise.all(pending).then(hardReload, hardReload);
      setTimeout(hardReload, 1500);
    } else {
      hardReload();
    }
  }

  window.__pfChunkRecovery = {
    looksLikeLoadError: looksLikeLoadError,
    recover: recover,
    forceReload: forceReload,
    report: report
  };

  // 1) Fallos de carga de recursos (script/link). Estos NUNCA llegan a un error
  //    boundary de React, así que hay que capturarlos en fase de captura.
  window.addEventListener('error', function (event) {
    var target = event && event.target;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      var src = target.src || target.href || '';
      report({ source: 'resource', resource: src });
      if (src.indexOf('/_next/') !== -1) { recover(); return; }
      return;
    }
    var msg = event && (event.message || (event.error && event.error.message));
    report({
      source: 'window.onerror',
      message: msg ? String(msg) : null,
      stack: event && event.error && event.error.stack
    });
    if (looksLikeLoadError(msg)) recover();
  }, true);

  // 2) Dynamic imports fallidos => promesa rechazada.
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    report({
      source: 'unhandledrejection',
      message: reason ? String(reason.message || reason) : null,
      stack: reason && reason.stack
    });
    if (looksLikeLoadError(reason)) recover();
  });

  // 3) Al cargar OK: limpiar el query param de cache-busting de la URL y resetear
  //    el contador tras una ventana sin errores (si hubiera otro fallo, el reload
  //    navega fuera y cancela este timer).
  try {
    var u = new URL(window.location.href);
    if (u.searchParams.has(CACHE_BUST_PARAM)) {
      u.searchParams.delete(CACHE_BUST_PARAM);
      window.history.replaceState(window.history.state, '', u.pathname + (u.search ? u.search : '') + u.hash);
    }
  } catch (e) {}
  setTimeout(function () {
    try { sessionStorage.removeItem(SS_KEY); } catch (e) {}
  }, WINDOW_MS);
})();`;
