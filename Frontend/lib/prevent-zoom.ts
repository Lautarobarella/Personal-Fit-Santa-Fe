/**
 * Script para prevenir zoom en PWAs empaquetadas
 * Bloquea gestos táctiles y teclas que pueden causar zoom
 */

export const preventZoom = () => {
  // Prevenir zoom con gestos táctiles
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('gestureend', (e) => {
    e.preventDefault();
  }, { passive: false });

  // Prevenir zoom con wheel + Ctrl
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevenir zoom con teclas
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
      e.preventDefault();
    }
  });

  // Prevenir zoom con doble tap en iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Prevenir pinch zoom
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
};

export const initializeZoomPrevention = () => {
  if (typeof window !== 'undefined') {
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', preventZoom);
    } else {
      preventZoom();
    }
  }
};
