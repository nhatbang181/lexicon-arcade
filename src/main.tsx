/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
// Font theo subset (X8): chỉ latin + vietnamese (+ latin-ext cho serif vì có ký hiệu IPA).
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-500.css';
import '@fontsource/be-vietnam-pro/vietnamese-500.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import '@fontsource/be-vietnam-pro/latin-800.css';
import '@fontsource/be-vietnam-pro/vietnamese-800.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-ext-400.css';
import '@fontsource/source-serif-4/vietnamese-400.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/source-serif-4/latin-ext-600.css';
import '@fontsource/source-serif-4/vietnamese-600.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/vietnamese-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/vietnamese-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/vietnamese-700.css';
import './design/tokens.css';
import { App } from './app/App';

// X9: sau mỗi lần deploy, chunk cũ bị xoá khỏi server. Nếu một import động thất bại thì
// tải lại (chỉ chặn tải lặp trong vòng 10 s bằng timestamp trong sessionStorage để các lần deploy sau vẫn tự hồi phục).
const RELOAD_FLAG = 'lexicon:chunk-reload';
const RELOAD_COOLDOWN_MS = 10_000;
window.addEventListener('vite:preloadError', (event) => {
  try {
    const prev = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
    const now = Date.now();
    if (Number.isFinite(prev) && prev > 0 && now - prev < RELOAD_COOLDOWN_MS) return;
    sessionStorage.setItem(RELOAD_FLAG, String(now));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

// X9: registerType 'prompt' → bản mới chờ người dùng đồng ý. Shell nghe sự kiện này để hiện
// toast "Có bản mới · Tải lại" (ngoài /play/*) và gọi `window.__lexiconApplyUpdate?.()`.
declare global {
  interface Window {
    __lexiconApplyUpdate?: () => void;
  }
}
if (import.meta.env.PROD) {
  const updateSW = registerSW({
    onNeedRefresh() {
      window.__lexiconApplyUpdate = () => void updateSW(true);
      window.dispatchEvent(new CustomEvent('lexicon:sw-update'));
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
