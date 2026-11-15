/* SECURITY — Bảo vệ bổ sung */
(function () {
  'use strict';

  if (window.top !== window.self) {
    try { window.top.location = window.self.location; } catch (e) {
      document.body.innerHTML = '<div style="display:grid;place-items:center;height:100vh;font-family:sans-serif;background:#0a0f1e;color:#fff;font-size:20px;">⛔ Không thể nhúng trang này</div>';
    }
  }

  const SESSION_KEY = 'azer_admin_session';
  const TS_KEY = 'azer_admin_ts';
  const ts = parseInt(localStorage.getItem(TS_KEY) || '0', 10);
  if (ts && Date.now() - ts > 2 * 60 * 60 * 1000) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TS_KEY);
  }
})();
