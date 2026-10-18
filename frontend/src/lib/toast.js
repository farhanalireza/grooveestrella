// src/lib/toast.js
/**
 * GrooveEstrella Liquid Fluid Toast Dispatcher
 * Dispatches custom events to the LiquidToastContainer
 */

let toastCounter = 0;

function dispatchToast(message, type = 'info', options = {}) {
  if (typeof window === 'undefined') return null;

  const id = options.id || `toast-${++toastCounter}-${Date.now()}`;
  const duration = options.duration ?? (type === 'error' ? 3600 : 2800);

  const detail = {
    id,
    message,
    type,
    duration,
    icon: options.icon,
    ...options,
  };

  window.dispatchEvent(new CustomEvent('groove-liquid-toast', { detail }));
  return id;
}

export const toast = {
  success: (message, options) => dispatchToast(message, 'success', options),
  info: (message, options) => dispatchToast(message, 'info', options),
  error: (message, options) => dispatchToast(message, 'error', options),
  warning: (message, options) => dispatchToast(message, 'warning', options),
  dismiss: (id) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('groove-liquid-toast-dismiss', { detail: { id } }));
    }
  },
};

export default toast;
