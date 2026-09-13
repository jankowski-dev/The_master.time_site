(function () {
  'use strict';

  /* ===== STATE ===== */
  var state = {
    service: null,
    options: { urgent: false, outOfTown: false, materials: false },
    files: [],
    shortorderFiles: [],
    anonymous: false
  };

  var phoneLink = '+375257076793';
  var externalLinks = { instagram: '', viber: '' };
  var navigating = false;

  /* ===== HELPERS ===== */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function isBelarusPhone(phone) {
    var p = (phone || '').replace(/[^0-9+]/g, '');
    return /^\+375\d{9}$/.test(p) || /^80\d{9}$/.test(p);
  }

  /* ===== SPLASH ===== */
  function initSplash() {
    var splash = $('#splash');
    var app = $('#app');
    var minDelay = 1400;

    function hideSplash() {
      splash.classList.add('hiding');
      app.classList.remove('hidden');
      setTimeout(function () { splash.style.display = 'none'; }, 500);
    }

    Promise.all([
      new Promise(function (r) {
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(r);
        else r();
        setTimeout(r, 3000);
      }),
      new Promise(function (r) { setTimeout(r, minDelay); }),
      new Promise(function (r) {
        if (document.readyState === 'complete') r();
        else window.addEventListener('load', r);
      })
    ]).then(hideSplash);
  }

  /* ===== NAVIGATION ===== */
  function navigateTo(targetId) {
    if (navigating) return;
    var next = $('#screen-' + targetId);
    if (!next || next.classList.contains('active')) return;

    navigating = true;
    $$('.screen.active').forEach(function (s) { s.classList.remove('active'); });
    setTimeout(function () {
      next.classList.add('active');
      navigating = false;
    }, 60);
  }

  function resetState() {
    state.service = null;
    state.options = { urgent: false, outOfTown: false, materials: false };
    state.files = [];
    state.shortorderFiles = [];
    state.anonymous = false;

    $$('.service-tile').forEach(function (el) { el.classList.remove('active'); });
    $$('.option-row[data-opt]').forEach(function (el) { el.classList.remove('on'); });
    var anon = $('#rv-anon'); if (anon) anon.classList.remove('on');

    var name = $('#input-name'); if (name) name.value = '';
    var phone = $('#input-phone'); if (phone) phone.value = '';
    var desc = $('#input-desc'); if (desc) desc.value = '';
    var fill = $('#file-fill'); if (fill) fill.style.width = '0%';
    var status = $('#file-status'); if (status) status.textContent = '';
    var fileInput = $('#file-input'); if (fileInput) fileInput.value = '';

    var soName = $('#so-name'); if (soName) soName.value = '';
    var soPhone = $('#so-phone'); if (soPhone) soPhone.value = '';
    var soFile = $('#so-file-input'); if (soFile) soFile.value = '';

    var rvName = $('#rv-name'); if (rvName) { rvName.value = ''; rvName.disabled = false; rvName.placeholder = 'Ваше имя'; }
    var rvText = $('#rv-text'); if (rvText) rvText.value = '';
  }

  /* ===== SERVICE SELECTION ===== */
  function initServiceSelection() {
    $$('.service-tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        $$('.service-tile').forEach(function (t) { t.classList.remove('active'); });
        tile.classList.add('active');
        state.service = tile.getAttribute('data-service');
        setTimeout(function () { navigateTo('options'); }, 180);
      });
    });
  }

  /* ===== OPTION TOGGLES ===== */
  function initToggles() {
    $$('.option-row[data-opt]').forEach(function (row) {
      row.addEventListener('click', function () {
        var key = row.getAttribute('data-opt');
        state.options[key] = !state.options[key];
        row.classList.toggle('on', state.options[key]);
      });
    });
  }

  /* ===== FILE UPLOAD ===== */
  function validateFiles(files) {
    var valid = [];
    for (var i = 0; i < files.length && valid.length < 5; i++) {
      if (files[i].type && files[i].type.indexOf('image/') === 0) valid.push(files[i]);
    }
    return valid;
  }

  function showFileError(zone, msg) {
    zone.classList.add('error');
    var status = zone.querySelector('.add-file-status');
    if (status) status.textContent = msg;
    setTimeout(function () {
      zone.classList.remove('error');
      if (status) status.textContent = '';
    }, 2500);
  }

  function simulateUpload(fillEl, statusEl, count, onDone) {
    fillEl.style.width = '0%';
    if (statusEl) statusEl.textContent = 'Загрузка...';
    var pct = 0;
    var timer = setInterval(function () {
      pct += 4;
      fillEl.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) {
        clearInterval(timer);
        if (statusEl) statusEl.textContent = 'Загружено: ' + count + ' файл(ов)';
        if (onDone) onDone();
      }
    }, 60);
  }

  function setupFileUpload(zoneId, inputId, fillId, statusId, stateKey) {
    var zone = $('#' + zoneId);
    var input = $('#' + inputId);
    var fill = fillId ? $('#' + fillId) : null;
    var status = statusId ? $('#' + statusId) : null;
    if (!zone || !input) return;

    zone.addEventListener('click', function (e) {
      if (e.target === input) return;
      input.click();
    });

    input.addEventListener('change', function () {
      var selected = validateFiles(input.files);
      if (selected.length === 0 && input.files.length > 0) {
        showFileError(zone, 'Только изображения, до 5 файлов');
        input.value = '';
        return;
      }
      state[stateKey] = selected;
      if (fill) simulateUpload(fill, status, selected.length);
    });
  }

  /* ===== SUMMARY ===== */
  function updateSummary() {
    var s = $('#sum-service'); if (s) s.textContent = state.service || '—';
    var u = $('#sum-urgent'); if (u) u.textContent = state.options.urgent ? 'Да' : 'Нет';
    var o = $('#sum-outOfTown'); if (o) o.textContent = state.options.outOfTown ? 'Да' : 'Нет';
    var m = $('#sum-materials'); if (m) m.textContent = state.options.materials ? 'Да' : 'Нет';
    var f = $('#sum-files'); if (f) f.textContent = state.files.length ? state.files.length + ' файл(ов)' : 'Нет файлов';
  }

  /* ===== API ===== */
  function apiPost(url, data, isFormData) {
    var opts = { method: 'POST' };
    if (isFormData) {
      opts.body = data;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(data);
    }
    return fetch(url, opts).then(function (r) { return r.json(); });
  }

  function apiGet(url) {
    return fetch(url).then(function (r) { return r.json(); });
  }

  /* ===== MODALS ===== */
  function showModal(el) { el.classList.add('active'); }
  function hideModal(el) { el.classList.remove('active'); }

  function initModals() {
    $$('[data-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modal = $('#' + btn.getAttribute('data-modal'));
        if (modal) showModal(modal);
      });
    });

    $$('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', function () {
        var modal = el.closest('.modal');
        if (modal) hideModal(modal);
      });
    });
  }

  function setMessageState(modal, which) {
    $$('.modal-state', modal).forEach(function (el) { el.classList.add('hidden'); });
    var target = modal.querySelector('.modal-state-' + which);
    if (target) target.classList.remove('hidden');
  }

  /* ===== ORDER SUBMISSION ===== */
  function sendOrder(data) {
    var sentModal = $('#modal-sent');
    showModal(sentModal);
    setMessageState(sentModal, 'loading');

    var phone = (data.phone || '').replace(/[^0-9+]/g, '');

    if (!isBelarusPhone(phone)) {
      setMessageState(sentModal, 'error');
      var err = sentModal.querySelector('.modal-state-error span');
      if (err) err.textContent = 'Проверьте номер телефона';
      setTimeout(function () { hideModal(sentModal); }, 2200);
      return;
    }

    var fd = new FormData();
    fd.append('name', data.name || '');
    fd.append('phone', phone);
    fd.append('service', data.service || '');
    fd.append('description', data.description || '');
    fd.append('source', data.source || 'Десктоп');
    fd.append('urgent', data.urgent ? 'on' : '');
    fd.append('outOfTown', data.outOfTown ? 'on' : '');
    fd.append('materials', data.materials ? 'on' : '');
    (data.files || []).forEach(function (f) { fd.append('files', f); });

    var start = Date.now();
    var minDelay = 2000;

    apiPost('/api/order', fd, true).then(function (res) {
      var wait = Math.max(0, minDelay - (Date.now() - start));
      setTimeout(function () {
        if (res.ok) {
          setMessageState(sentModal, 'success');
        } else {
          setMessageState(sentModal, 'error');
        }
        setTimeout(function () {
          hideModal(sentModal);
          resetState();
          navigateTo('home');
        }, 2000);
      }, wait);
    }).catch(function () {
      var wait = Math.max(0, minDelay - (Date.now() - start));
      setTimeout(function () {
        setMessageState(sentModal, 'error');
        setTimeout(function () {
          hideModal(sentModal);
          resetState();
          navigateTo('home');
        }, 1800);
      }, wait);
    });
  }

  /* ===== FORM SUBMIT ===== */
  function initFormSubmit() {
    $('#form-submit').addEventListener('click', function () {
      updateSummary();
      sendOrder({
        name: $('#input-name').value.trim(),
        phone: $('#input-phone').value.trim(),
        service: state.service,
        description: $('#input-desc').value.trim(),
        source: 'Десктоп',
        urgent: state.options.urgent,
        outOfTown: state.options.outOfTown,
        materials: state.options.materials,
        files: state.files
      });
    });
  }

  /* ===== QUICK ORDER ===== */
  function initQuickOrder() {
    $('#so-submit').addEventListener('click', function () {
      hideModal($('#modal-shortorder'));
      sendOrder({
        name: $('#so-name').value.trim(),
        phone: $('#so-phone').value.trim(),
        service: '',
        description: '',
        source: 'Быстрая заявка',
        urgent: false,
        outOfTown: false,
        materials: false,
        files: state.shortorderFiles
      });
    });
  }

  /* ===== REVIEW ===== */
  function initReview() {
    var anonBtn = $('#rv-anon');
    var rvName = $('#rv-name');

    if (anonBtn) {
      anonBtn.addEventListener('click', function () {
        state.anonymous = !state.anonymous;
        anonBtn.classList.toggle('on', state.anonymous);
        rvName.disabled = state.anonymous;
        if (state.anonymous) { rvName.value = ''; rvName.placeholder = 'Анонимно'; }
        else { rvName.placeholder = 'Ваше имя'; }
      });
    }

    $('#rv-submit').addEventListener('click', function () {
      var text = $('#rv-text').value.trim();
      if (!text) {
        $('#rv-text').style.borderColor = '#d32f2f';
        setTimeout(function () { $('#rv-text').style.borderColor = ''; }, 2000);
        return;
      }

      hideModal($('#modal-review'));
      var sentModal = $('#modal-review-sent');
      showModal(sentModal);
      setMessageState(sentModal, 'loading');

      var start = Date.now();
      var minDelay = 2000;

      apiPost('/api/review', {
        name: state.anonymous ? '' : rvName.value.trim(),
        review: text,
        anonymous: state.anonymous
      }).then(function (res) {
        var wait = Math.max(0, minDelay - (Date.now() - start));
        setTimeout(function () {
          setMessageState(sentModal, res.ok ? 'success' : 'error');
          setTimeout(function () {
            hideModal(sentModal);
            state.anonymous = false;
            if (anonBtn) anonBtn.classList.remove('on');
            rvName.disabled = false;
            rvName.value = '';
            rvName.placeholder = 'Ваше имя';
            $('#rv-text').value = '';
          }, 1800);
        }, wait);
      }).catch(function () {
        var wait = Math.max(0, minDelay - (Date.now() - start));
        setTimeout(function () {
          setMessageState(sentModal, 'error');
          setTimeout(function () { hideModal(sentModal); }, 1800);
        }, wait);
      });
    });
  }

  /* ===== NAV BUTTONS ===== */
  function initNavButtons() {
    $$('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-nav');
        if (btn.hasAttribute('data-reset')) resetState();
        if (target === 'home') resetState();
        navigateTo(target);
      });
    });

    $('#logo-home').addEventListener('click', function (e) {
      e.preventDefault();
      resetState();
      navigateTo('home');
    });

    $$('.option-row[data-opt]').forEach(function (row) {
      row.addEventListener('click', function () { setTimeout(updateSummary, 10); });
    });
  }

  /* ===== CONTACT / EXTERNAL ===== */
  function initContacts() {
    $$('[data-call]').forEach(function (el) {
      el.addEventListener('click', function () { window.location.href = 'tel:' + phoneLink; });
    });

    $$('[data-external]').forEach(function (el) {
      el.addEventListener('click', function () {
        var key = el.getAttribute('data-external');
        var url = externalLinks[key];
        if (!url) return;
        if (key === 'viber' && !/^https?:\/\//i.test(url)) {
          url = 'viber://chat?number=' + url.replace(/[^0-9]/g, '');
        }
        var a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });
    });
  }

  /* ===== SETTINGS ===== */
  function applySettings(s) {
    if (s.phoneLink) phoneLink = s.phoneLink;
    if (s.instagram) externalLinks.instagram = s.instagram;
    if (s.viber) externalLinks.viber = s.viber;
    if (s.subtitle) $$('[data-field="subtitle"]').forEach(function (el) { el.textContent = s.subtitle; });
    if (s.intro) $$('[data-field="intro"]').forEach(function (el) { el.textContent = s.intro; });
    if (s.followersCount) {
      var n = parseInt(s.followersCount, 10);
      if (!isNaN(n)) {
        var txt = n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '').replace('.', ',') + 'K' : String(n);
        $$('[data-field="followers-count"]').forEach(function (el) { el.textContent = txt; });
      }
    }
  }

  function loadSettings() {
    apiGet('/api/settings').then(applySettings).catch(function () {});
  }

  /* ===== INIT ===== */
  document.addEventListener('DOMContentLoaded', function () {
    initSplash();
    initServiceSelection();
    initToggles();
    setupFileUpload('add-file', 'file-input', 'file-fill', 'file-status', 'files');
    setupFileUpload('so-add-file', 'so-file-input', null, null, 'shortorderFiles');
    initNavButtons();
    initModals();
    initFormSubmit();
    initQuickOrder();
    initReview();
    initContacts();
    loadSettings();
  });
})();
