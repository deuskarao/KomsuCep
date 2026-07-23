import { createRoot } from 'react-dom/client';
import { createElement } from 'react';

export function confirmAsync({ title, message, confirmText = 'Onayla', cancelText = 'İptal', danger = false, prompt = false, defaultValue = '' }) {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const cleanup = () => {
      root.unmount();
      if (container.parentNode) container.parentNode.removeChild(container);
    };

    const close = (result) => {
      cleanup();
      resolve(result);
    };

    const overlay = createElement('div', {
      className: 'modal-overlay active',
      onClick: (e) => { if (e.target === e.currentTarget) close(false); }
    },
      createElement('div', {
        className: 'modal glass-panel',
        style: { maxWidth: 420, position: 'relative' },
        onClick: (e) => e.stopPropagation()
      },
        createElement('div', { className: 'modal-header', style: { paddingBottom: 12 } },
          createElement('h2', { style: { fontSize: 18, fontWeight: 700 } }, title),
          createElement('button', { className: 'modal-close', onClick: () => close(false) }, '✕')
        ),
        createElement('div', { className: 'modal-body' },
          createElement('p', { style: { margin: 0, fontSize: 14, color: 'var(--g600)', lineHeight: 1.5 } }, message),
          prompt && createElement('input', {
            autoFocus: true,
            defaultValue,
            className: 'glass-input',
            style: { marginTop: 16, width: '100%' },
            onKeyDown: (e) => { if (e.key === 'Enter') close(e.target.value); if (e.key === 'Escape') close(false); }
          })
        ),
        createElement('div', { className: 'modal-footer' },
          createElement('button', { className: 'btn-outline', onClick: () => close(false) }, cancelText),
          createElement('button', { className: danger ? 'btn-danger' : 'btn-primary', onClick: () => {
            if (prompt) {
              const val = container.querySelector('.glass-input')?.value || '';
              close(val);
            } else {
              close(true);
            }
          } }, confirmText)
        )
      )
    );

    root.render(overlay);
  });
}
