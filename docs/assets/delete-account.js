/**
 * KHALA — self-service account deletion.
 *
 * Runs entirely in the browser against the public KHALA API: the page signs the
 * user in with their own credentials, then calls the same `DELETE /me` endpoint
 * the mobile apps use. Nothing is stored — the access token lives in a local
 * variable for the length of the visit and the password is never persisted.
 *
 * Each page sets `<body data-app="qader">`; everything else comes from APPS.
 */
(function () {
  'use strict';

  var API_BASE = 'https://api.khalaapps.com/v1';

  var APPS = {
    qader: { name: 'قادر',        en: 'Qader',   brand: '#2EC5B6', brand2: '#6C8BFF' },
    farah: { name: 'فرح',         en: 'Farah',   brand: '#E8488B', brand2: '#7C3AED' },
    roaa:  { name: 'روعة',        en: 'Roaa',    brand: '#7C3AED', brand2: '#2E1065' },
    hader: { name: 'حاضر',        en: 'Hader',   brand: '#1E6B45', brand2: '#123B2C' },
    walfa: { name: 'ولفة',        en: 'Walfa',   brand: '#F59E0B', brand2: '#1E1B4B' },
    darb:  { name: 'درب',         en: 'Darb',    brand: '#38BDF8', brand2: '#0EA5E9' },
    afia:  { name: 'توازن',       en: 'Tawazon', brand: '#1C64F2', brand2: '#1E429F' },
    ghayt: { name: 'بصمة غيث',    en: 'Ghayt',   brand: '#0E6B5C', brand2: '#0A3D33' }
  };

  var appKey = document.body.getAttribute('data-app');
  var app = APPS[appKey];
  if (!app) return;

  // Access token for this visit only. Never written to storage.
  var token = null;
  var account = null;

  var $ = function (id) { return document.getElementById(id); };

  /**
   * Attaching listeners through this means a single missing element can never
   * take the rest of the page down with it — a stale cached copy of this file
   * against newer HTML once left the delete button permanently disabled.
   */
  function on(id, event, handler) {
    var el = $(id);
    if (el) el.addEventListener(event, handler);
  }

  // ── Branding ──────────────────────────────────────────────
  document.documentElement.style.setProperty('--brand', app.brand);
  document.documentElement.style.setProperty('--brand2', app.brand2);
  $('logo').src = '../../assets/logos/' + appKey + '.jpg';
  $('logo').alt = 'شعار ' + app.name;
  $('appName').textContent = app.name + ' — ' + app.en;
  document.title = 'حذف الحساب — ' + app.name + ' (' + app.en + ')';

  // ── Helpers ───────────────────────────────────────────────
  function show(step) {
    ['stepLogin', 'stepConfirm', 'stepDone'].forEach(function (id) {
      $(id).classList.toggle('hidden', id !== step);
    });
  }

  function setError(msg) {
    var box = $('error');
    if (!msg) { box.classList.add('hidden'); box.textContent = ''; return; }
    box.textContent = msg;
    box.classList.remove('hidden');
  }

  function busy(btn, isBusy, idleLabel, busyLabel) {
    btn.disabled = isBusy;
    btn.innerHTML = isBusy ? '<span class="spinner"></span>' + busyLabel : idleLabel;
  }

  /** Every KHALA endpoint is app-scoped, so `x-app-key` goes on every call. */
  function apiFetch(path, options) {
    options = options || {};
    var headers = { 'x-app-key': appKey };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(API_BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { /* not JSON */ }
        if (!res.ok) {
          var err = new Error((data && (data.message || data.error)) || 'HTTP ' + res.status);
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  // ── Step 1: sign in ───────────────────────────────────────
  on('loginForm', 'submit', function (e) {
    e.preventDefault();
    setError('');

    var email = $('email').value.trim();
    var password = $('password').value;
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    var btn = $('loginBtn');
    busy(btn, true, '', 'جارٍ التحقق…');

    apiFetch('/auth/login', { method: 'POST', body: { email: email, password: password } })
      .then(function (res) {
        token = res.accessToken;
        // Clear the password field the moment it is no longer needed.
        $('password').value = '';
        return apiFetch('/me');
      })
      .then(function (me) {
        account = (me && me.user) || {};
        $('accEmail').textContent = account.email || email;
        $('accName').textContent = account.fullName || '—';
        show('stepConfirm');
      })
      .catch(function (err) {
        if (err.status === 401) {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. / Incorrect email or password.');
        } else if (err.status === 404 || err.status === 400) {
          setError('لا يوجد حساب بهذا البريد في تطبيق ' + app.name + '. / No account found for this app.');
        } else {
          setError('تعذّر الاتصال بالخادم، حاول مرة أخرى. / Could not reach the server, please try again.');
        }
      })
      .then(function () { busy(btn, false, 'تسجيل الدخول', ''); });
  });

  // ── Step 2: confirm, then delete ──────────────────────────
  function confirmationReady() {
    var chk = $('confirmCheck');
    return !chk || chk.checked;
  }

  function refreshDeleteBtn() { $('deleteBtn').disabled = !confirmationReady(); }
  on('confirmCheck', 'change', refreshDeleteBtn);
  refreshDeleteBtn();

  on('deleteBtn', 'click', function () {
    if (!confirmationReady()) return;
    setError('');

    var btn = $('deleteBtn');
    busy(btn, true, '', 'جارٍ حذف الحساب…');

    // Notify the KHALA team first — once the account is anonymised the API can
    // no longer tell us which address requested it. A failure here (e.g. the
    // endpoint isn't deployed yet) must never block the user's deletion.
    apiFetch('/me/deletion-notice', { method: 'POST', body: { source: 'web', app: appKey } })
      .catch(function () { return null; })
      .then(function () { return apiFetch('/me', { method: 'DELETE' }); })
      .then(function () {
        token = null;
        account = null;
        $('doneEmail').textContent = $('accEmail').textContent;
        show('stepDone');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function () {
        setError('تعذّر حذف الحساب، حاول مرة أخرى أو راسلنا على privacy@khalaapps.com');
        busy(btn, false, 'حذف حسابي نهائياً', '');
      });
  });

  on('cancelBtn', 'click', function () {
    token = null;
    account = null;
    var chk = $('confirmCheck');
    if (chk) chk.checked = false;
    refreshDeleteBtn();
    setError('');
    show('stepLogin');
  });
})();
