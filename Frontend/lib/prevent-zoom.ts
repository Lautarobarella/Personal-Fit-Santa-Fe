/**
 * Script para prevenir zoom en PWAs empaquetadas
 * Versión simplificada para evitar conflictos
 */

export const preventZoom = () => {
  // Prevenir zoom con wheel + Ctrl
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevenir zoom con teclas Ctrl + +/-/0
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
      e.preventDefault();
    }
  });

  // Prevenir pinch zoom básico
  document.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 1) {
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
