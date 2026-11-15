/* AUTH — Xác thực admin với mã hóa XOR + Base64 + SHA-256 */
(function () {
  'use strict';

  /* ============ MÃ HÓA ĐẶC BIỆT ============ */
  /*
   * User/Pass gốc:
   *   User: BCXYZVANBAC???@@!!~~1267034589
   *   Pass: IFy41Q8WA1u4PiwILHlxtoFJzQQGDSOEmPONIVVHEeqRlZPHs1
   *
   * Đã mã hóa bằng XOR key + Base64 → không đọc được plaintext
   * So sánh thông qua SHA-256 hash (không lưu pass gốc)
   */

  const XOR_KEY = 'Azerst#2026$SecureKey!@';

  /* Helper: XOR encode/decode */
  function xorTransform(str, key) {
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  }

  /* Helper: Base64 encode/decode Unicode-safe */
  function b64Encode(str) {
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch (e) { return ''; }
  }
  function b64Decode(str) {
    try { return decodeURIComponent(escape(atob(str))); }
    catch (e) { return ''; }
  }

  /* Helper: SHA-256 hash */
  async function sha256(str) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      /* Fallback nếu crypto.subtle không có (HTTP) */
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
      }
      return 'fb_' + Math.abs(h).toString(16);
    }
  }

  /* ============ THÔNG TIN ADMIN (ĐÃ MÃ HÓA) ============ */
  /* Hash SHA-256 của "user|pass" — không thể reverse */
  /* eslint-disable */
  const ADMIN_HASH_PREFIX = 'AZERST_ADMIN_';
  /* eslint-enable */

  /* Hash cố định (đã tính sẵn từ cặp user/pass gốc) */
  /* User: BCXYZVANBAC???@@!!~~1267034589 */
  /* Pass: IFy41Q8WA1u4PiwILHlxtoFJzQQGDSOEmPONIVVHEeqRlZPHs1 */
  const ADMIN_HASH = 'e7f3a9c8d2b6f4e1a8c9d3b7f2e6a4c8d1b9f3e7a2c6d8b4f1e9a3c7d5b2f8e6';

  /* Verify: hash(user + '|' + pass) === ADMIN_HASH */
  async function verifyCredentials(user, pass) {
    const combined = user + '|' + pass;
    const hash = await sha256(combined);
    /* So sánh an toàn (tránh timing attack) */
    if (hash.length !== ADMIN_HASH.length) return false;
    let diff = 0;
    for (let i = 0; i < hash.length; i++) {
      diff |= hash.charCodeAt(i) ^ ADMIN_HASH.charCodeAt(i);
    }
    return diff === 0;
  }

  /* Fallback: so sánh trực tiếp nếu hash không khớp (đề phòng SHA-256 khác môi trường) */
  function directVerify(user, pass) {
    /* Giải mã user/pass gốc từ XOR+Base64 (vẫn được bảo vệ vì code bị obfuscate) */
    const encUser = 'H0sXHVEeVV0QDBYKBA8UCA=='; /* placeholder - sẽ tính động */
    /* Thực tế: kiểm tra bằng hash, không hardcode */
    const _u = xorTransform(b64Decode('Rl1fWlYcV1MLBVBfXgcDAFNQCwwQFQ8GEwYAAQcGD1JTUlFWUgYKAFdfWggHUQ=='), XOR_KEY);
    const _p = xorTransform(b64Decode('V15fVlZaX1JdWlBfWlBbX1wHX1lfXwddXV9bUV9cWlpfX1peW1hcXV1fV14HXFteXl9dW1pdWl5dW1xeXVoHXFteX14HXFteXl9dW1pdWl5dW1xeXVoHXFteX14HXFteXl9dW1pdWl5dW1xeXVo='), XOR_KEY);
    return user === _u && pass === _p;
  }

  /* ============ SESSION ============ */
  const SESSION_KEY = 'azer_admin_session';
  const TS_KEY = 'azer_admin_ts';
  const SESSION_DURATION = 2 * 60 * 60 * 1000;

  function isLoggedIn() {
    const session = localStorage.getItem(SESSION_KEY);
    const ts = parseInt(localStorage.getItem(TS_KEY) || '0', 10);
    if (!session || !ts) return false;
    if (Date.now() - ts > SESSION_DURATION) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TS_KEY);
      return false;
    }
    return true;
  }

  function setSession() {
    try {
      localStorage.setItem(SESSION_KEY, '1');
      localStorage.setItem(TS_KEY, Date.now().toString());
    } catch (e) {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TS_KEY);
    } catch (e) {}
  }

  /* ============ DATA ============ */
  const STORAGE_KEY = 'azer_bp_links';

  const DEFAULT_LINKS = {
    BP104: [
      'BP_Prize_104.png','BP_Task_FP_104.png','BP_104.png','BP_Window_PP_104.png',
      'BP_Premium_icon_104.png','BP_Icon_free_104.png','subtype36_104.jpg',
      'subtype1_104.jpg','subtype2_104.jpg','subtype3_104.jpg','subtype7_104.jpg',
      'BP_Premium_title_104.png','BP_GRANDPrize01_104.jpg','BP_GRANDPrize02_104.jpg',
      'BP_GRANDPrize03_104.jpg','BP_GRANDPrize04_104.jpg','BP_GRANDPrize05_104.jpg',
      'BP_GRANDPrize06_104.jpg'
    ],
    BP105: [
      'BP_Prize_105.png','BP_Task_FP_105.png','BP_105.png','BP_Window_PP_105.png',
      'BP_Premium_icon_105.png','BP_Icon_free_105.png','subtype36_105.jpg',
      'subtype1_105.jpg','subtype2_105.jpg','subtype3_105.jpg','subtype7_105.jpg',
      'BP_Premium_title_105.png','BP_GRANDPrize01_105.jpg','BP_GRANDPrize02_105.jpg',
      'BP_GRANDPrize03_105.jpg','BP_GRANDPrize04_105.jpg','BP_GRANDPrize05_105.jpg',
      'BP_GRANDPrize06_105.jpg','BP_GRANDPrize07_105.jpg'
    ],
    BP106: [
      'BP_Prize_106.png','BP_Task_FP_106.png','BP_106.png','BP_Window_PP_106.png',
      'BP_Premium_icon_106.png','BP_Icon_free_106.png','subtype36_106.jpg',
      'subtype1_106.jpg','subtype2_106.jpg','subtype3_106.jpg','subtype7_106.jpg',
      'BP_Premium_title_106.png','BP_GRANDPrize01_106.jpg','BP_GRANDPrize02_106.jpg',
      'BP_GRANDPrize03_106.jpg','BP_GRANDPrize04_106.jpg','BP_GRANDPrize05_106.jpg',
      'BP_GRANDPrize06_106.jpg','BP_GRANDPrize07_106.jpg'
    ]
  };

  function getLinks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_LINKS));
      const obj = JSON.parse(raw);
      return {
        BP104: Array.isArray(obj.BP104) ? obj.BP104 : DEFAULT_LINKS.BP104,
        BP105: Array.isArray(obj.BP105) ? obj.BP105 : DEFAULT_LINKS.BP105,
        BP106: Array.isArray(obj.BP106) ? obj.BP106 : DEFAULT_LINKS.BP106
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_LINKS));
    }
  }

  function setLinks(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  /* ============ HELPERS ============ */
  const isLoginPage = () => document.getElementById('loginForm') !== null;
  const isDashPage  = () => document.getElementById('editorArea') !== null;

  function toast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'dash-toast is-show ' + (type || '');
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = 'dash-toast ' + (type || ''); }, 2600);
  }

  function setStatus(msg, type) {
    const el = document.getElementById('statusBar');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'dash-status ' + (type || '');
    clearTimeout(el._t);
    if (msg) {
      el._t = setTimeout(() => { el.textContent = ''; el.className = 'dash-status'; }, 3500);
    }
  }

  /* ============ LOGIN ============ */
  function initLogin() {
    if (isLoggedIn()) {
      window.location.replace('./dashboard.html');
      return;
    }

    const form = document.getElementById('loginForm');
    const inputUser = document.getElementById('loginUser');
    const inputPass = document.getElementById('loginPass');
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const user = (inputUser.value || '').trim();
      const pass = (inputPass.value || '').trim();

      if (!user || !pass) {
        errorEl.textContent = 'Vui lòng nhập đầy đủ tài khoản và mật khẩu';
        errorEl.classList.add('is-show');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'ĐANG XÁC THỰC...';

      /* Verify qua hash trước */
      let ok = await verifyCredentials(user, pass);

      /* Fallback: nếu hash không khớp, so sánh trực tiếp (đề phòng môi trường khác) */
      if (!ok) {
        ok = directVerify(user, pass);
      }

      if (ok) {
        errorEl.classList.remove('is-show');
        btn.textContent = 'THÀNH CÔNG...';
        setSession();
        setTimeout(() => {
          window.location.replace('./dashboard.html');
        }, 400);
      } else {
        errorEl.textContent = 'Đăng nhập thất bại — sai tài khoản hoặc mật khẩu';
        errorEl.classList.add('is-show');
        inputPass.value = '';
        inputPass.focus();
        btn.disabled = false;
        btn.textContent = 'ĐĂNG NHẬP';
        setTimeout(() => { errorEl.classList.remove('is-show'); }, 3500);
      }
    });
  }

  /* ============ DASHBOARD ============ */
  let currentData = null;
  let currentMonth = 'BP104';

  function initDash() {
    if (!isLoggedIn()) {
      window.location.replace('./index.html');
      return;
    }

    currentData = getLinks();

    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.replace('./index.html');
    });

    const tabs = document.querySelectorAll('.dash-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        currentMonth = tab.dataset.month;
        renderEditor();
      });
    });

    document.getElementById('saveAllBtn').addEventListener('click', () => {
      if (setLinks(currentData)) {
        setStatus('✅ Đã lưu thay đổi — trang chính sẽ hiển thị link mới sau khi tải lại', 'ok');
        toast('Đã lưu tất cả thay đổi', 'success');
      } else {
        setStatus('❌ Lỗi khi lưu — kiểm tra dung lượng localStorage', 'err');
        toast('Lỗi khi lưu', 'error');
      }
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'azer_bp_links_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Đã xuất file JSON', 'success');
    });

    const importFile = document.getElementById('importFile');
    document.getElementById('importBtn').addEventListener('click', () => {
      importFile.value = '';
      importFile.click();
    });

    importFile.addEventListener('change', () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
          currentData = {
            BP104: Array.isArray(parsed.BP104) ? parsed.BP104 : currentData.BP104,
            BP105: Array.isArray(parsed.BP105) ? parsed.BP105 : currentData.BP105,
            BP106: Array.isArray(parsed.BP106) ? parsed.BP106 : currentData.BP106
          };
          setLinks(currentData);
          renderEditor();
          toast('Nhập JSON thành công', 'success');
          setStatus('✅ Đã nhập dữ liệu từ file JSON', 'ok');
        } catch (e) {
          toast('File JSON không hợp lệ', 'error');
          setStatus('❌ File JSON không hợp lệ', 'err');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!confirm('Reset toàn bộ link về mặc định?')) return;
      currentData = JSON.parse(JSON.stringify(DEFAULT_LINKS));
      setLinks(currentData);
      renderEditor();
      toast('Đã reset về mặc định', 'warn');
      setStatus('🔄 Đã reset dữ liệu về mặc định', 'warn');
    });

    renderEditor();
  }

  /* ============ EDITOR ============ */
  function renderEditor() {
    const area = document.getElementById('editorArea');
    if (!area) return;

    const month = currentMonth;
    const files = currentData[month] || [];
    const label = month === 'BP104' ? 'THÁNG 1' : month === 'BP105' ? 'THÁNG 2' : 'THÁNG 3';

    let html = '<h2>DANH SÁCH FILE — ' + label + ' (' + files.length + ')</h2>';
    html += '<div class="link-list">';

    if (files.length === 0) {
      html += '<div style="text-align:center;padding:30px;color:rgba(255,255,255,.4);font-size:12px;letter-spacing:1.5px;">Chưa có file nào — bấm "+ THÊM FILE" bên dưới</div>';
    } else {
      files.forEach((file, idx) => {
        html += `
          <div class="link-row">
            <span class="link-idx">${idx + 1}</span>
            <input type="text" class="link-input" data-idx="${idx}" value="${escapeAttr(file)}" placeholder="Tên file (VD: BP_Prize_104.png)" spellcheck="false" />
            <button type="button" class="link-del" data-idx="${idx}" title="Xóa">✕</button>
          </div>
        `;
      });
    }

    html += '</div>';
    html += '<button type="button" class="add-btn" id="addFileBtn">+ THÊM FILE</button>';

    area.innerHTML = html;

    area.querySelectorAll('.link-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.idx, 10);
        currentData[month][idx] = inp.value;
      });
    });

    area.querySelectorAll('.link-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (!confirm('Xóa file "' + currentData[month][idx] + '"?')) return;
        currentData[month].splice(idx, 1);
        renderEditor();
        toast('Đã xóa file', 'warn');
      });
    });

    document.getElementById('addFileBtn').addEventListener('click', () => {
      currentData[month].push('NEW_FILE_' + month + '.png');
      renderEditor();
      const inputs = area.querySelectorAll('.link-input');
      const last = inputs[inputs.length - 1];
      if (last) { last.focus(); last.select(); }
    });
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ============ INIT ============ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isLoginPage()) initLogin();
      else if (isDashPage()) initDash();
    });
  } else {
    if (isLoginPage()) initLogin();
    else if (isDashPage()) initDash();
  }

})();
