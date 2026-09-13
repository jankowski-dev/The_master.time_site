(function () {
  'use strict';

  /* ===== STATE ===== */
  var state = {
    service: null,
    options: { urgent: false, outOfTown: false, materials: false },
    files: [],
    shortorderFiles: [],
    uploadStatus: 'empty',
    soUploadStatus: 'empty'
  };

  var externalLinks = { instagram: '', viber: '' };
  var phoneLink = 'tel:+375257076793';
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
    var minDelay = 1500;
    var start = Date.now();

    function hideSplash() {
      splash.classList.add('hiding');
      app.classList.remove('hidden');
      setTimeout(function () { splash.style.display = 'none'; }, 500);
    }

    Promise.all([
      new Promise(function (r) {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(r);
        } else {
          r();
        }
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
    var current = $('.screen.active');
    var next = $('#screen-' + targetId);
    if (!next || current === next) return;

    navigating = true;
    if (current) current.classList.remove('active');
    setTimeout(function () {
      next.classList.add('active');
      navigating = false;
    }, 50);
  }

  function resetState() {
    state.service = null;
    state.options = { urgent: false, outOfTown: false, materials: false };
    state.files = [];
    state.shortorderFiles = [];
    state.uploadStatus = 'empty';
    state.soUploadStatus = 'empty';

    $$('.service-tile').forEach(function (el) { el.classList.remove('active'); });
    $$('.option-row').forEach(function (el) { el.classList.remove('on'); });

    $('#input-name').value = '';
    $('#input-phone').value = '';
    $('#input-desc').value = '';
    $('#file-status').textContent = '';
    $('#file-fill').style.width = '0%';
    $('#file-input').value = '';

    $('#so-name').value = '';
    $('#so-phone').value = '';
    $('#so-file-input').value = '';
    $('#rv-name').value = '';
    $('#rv-text').value = '';
    $('#rv-anon').checked = false;
  }

  /* ===== SERVICE SELECTION ===== */
  function initServiceSelection() {
    $$('.service-tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        $$('.service-tile').forEach(function (t) { t.classList.remove('active'); });
        tile.classList.add('active');
        state.service = tile.getAttribute('data-service');
        navigateTo('options');
      });
    });
  }

  /* ===== OPTION TOGGLES ===== */
  function initToggles() {
    $$('.option-row').forEach(function (row) {
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
      var f = files[i];
      if (f.type && f.type.startsWith('image/')) {
        valid.push(f);
      }
    }
    return valid;
  }

  function showFileError(el, msg) {
    el.classList.add('error');
    var status = el.querySelector('.add-file-status');
    if (status) status.textContent = msg;
    setTimeout(function () {
      el.classList.remove('error');
      if (status) status.textContent = '';
    }, 2500);
  }

  function simulateUpload(fillEl, statusEl, files, stateObj, key) {
    fillEl.style.width = '0%';
    statusEl.textContent = 'Загрузка...';
    stateObj[key] = 'uploading';
    var pct = 0;
    var timer = setInterval(function () {
      pct += 4;
      fillEl.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) {
        clearInterval(timer);
        statusEl.textContent = 'Загружено: ' + files.length + ' файл(ов)';
        stateObj[key] = 'done';
      }
    }, 60);
  }

  function setupFileUpload(zoneId, inputId, fillId, statusId, stateObj, stateKey) {
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
      stateObj[stateKey] = selected;
      if (fill && status) {
        simulateUpload(fill, status, selected, { upload: '' }, 'upload');
      }
    });
  }

  /* ===== SUMMARY ===== */
  function updateSummary() {
    $('#sum-service').textContent = state.service || '—';
    $('#sum-urgent').textContent = state.options.urgent ? 'Да' : 'Нет';
    $('#sum-outOfTown').textContent = state.options.outOfTown ? 'Да' : 'Нет';
    $('#sum-materials').textContent = state.options.materials ? 'Да' : 'Нет';
    $('#sum-files').textContent = state.files.length || '0';
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

  /* ===== ORDER SUBMISSION ===== */
  function sendOrder(data) {
    var sentModal = $('#modal-sent');
    var states = {
      loading: sentModal.querySelector('.modal-state.loading'),
      success: sentModal.querySelector('.modal-state.success'),
      error: sentModal.querySelector('.modal-state.error')
    };

    showModal(sentModal);
    states.loading.classList.remove('hidden');
    states.success.classList.add('hidden');
    states.error.classList.add('hidden');

    var phone = (data.phone || '').replace(/[^0-9+]/g, '');

    if (!isBelarusPhone(phone)) {
      states.loading.classList.add('hidden');
      states.error.classList.remove('hidden');
      states.error.querySelector('.error-text').textContent = 'Некорректный номер телефона';
      setTimeout(function () { hideModal(sentModal); }, 2500);
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

    if (data.files) {
      data.files.forEach(function (f) { fd.append('files', f); });
    }

    var start = Date.now();
    var minDelay = 2000;
    var timeout = setTimeout(function () {
      states.loading.classList.add('hidden');
      states.error.classList.remove('hidden');
      setTimeout(function () {
        hideModal(sentModal);
        resetState();
        navigateTo('home');
      }, 1600);
    }, 10000);

    apiPost('/api/order', fd, true).then(function (res) {
      var elapsed = Date.now() - start;
      var wait = Math.max(0, minDelay - elapsed);
      setTimeout(function () {
        clearTimeout(timeout);
        if (res.ok) {
          states.loading.classList.add('hidden');
          states.success.classList.remove('hidden');
          setTimeout(function () {
            hideModal(sentModal);
            resetState();
            navigateTo('home');
          }, 2000);
        } else {
          states.loading.classList.add('hidden');
          states.error.classList.remove('hidden');
          states.error.querySelector('.error-text').textContent = res.error || 'Ошибка отправки';
          setTimeout(function () {
            hideModal(sentModal);
            resetState();
            navigateTo('home');
          }, 2000);
        }
      }, wait);
    }).catch(function () {
      var elapsed = Date.now() - start;
      var wait = Math.max(0, minDelay - elapsed);
      setTimeout(function () {
        clearTimeout(timeout);
        states.loading.classList.add('hidden');
        states.error.classList.remove('hidden');
        setTimeout(function () {
          hideModal(sentModal);
          resetState();
          navigateTo('home');
        }, 1600);
      }, wait);
    });
  }

  /* ===== MODALS ===== */
  function showModal(el) { el.classList.add('active'); }
  function hideModal(el) { el.classList.remove('active'); }

  function initModals() {
    $$('[data-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = 'modal-' + btn.getAttribute('data-modal');
        var modal = $('#' + id);
        if (modal) showModal(modal);
      });
    });

    $$('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', function () {
        var modal = el.closest('.modal');
        if (modal) {
          hideModal(modal);
          if (modal.id === 'modal-shortorder') {
            state.shortorderFiles = [];
            var soFileInput = $('#so-file-input');
            if (soFileInput) soFileInput.value = '';
          }
        }
      });
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
    var rvAnon = $('#rv-anon');
    var rvName = $('#rv-name');

    if (rvAnon) {
      rvAnon.addEventListener('change', function () {
        if (rvAnon.checked) {
          rvName.value = '';
          rvName.disabled = true;
          rvName.placeholder = 'Анонимно';
        } else {
          rvName.disabled = false;
          rvName.placeholder = 'Ваше имя';
        }
      });
    }

    $('#rv-submit').addEventListener('click', function () {
      var review = $('#rv-text').value.trim();
      if (!review) {
        $('#rv-text').style.borderColor = '#d32f2f';
        setTimeout(function () { $('#rv-text').style.borderColor = ''; }, 2000);
        return;
      }

      var sentModal = $('#modal-review-sent');
      var states = {
        loading: sentModal.querySelector('.modal-state.loading'),
        success: sentModal.querySelector('.modal-state.success'),
        error: sentModal.querySelector('.modal-state.error')
      };

      hideModal($('#modal-review'));
      showModal(sentModal);
      states.loading.classList.remove('hidden');
      states.success.classList.add('hidden');
      states.error.classList.add('hidden');

      var start = Date.now();
      var minDelay = 2000;

      apiPost('/api/review', {
        name: rvAnon.checked ? '' : $('#rv-name').value.trim(),
        review: review,
        anonymous: rvAnon.checked
      }).then(function (res) {
        var elapsed = Date.now() - start;
        var wait = Math.max(0, minDelay - elapsed);
        setTimeout(function () {
          if (res.ok) {
            states.loading.classList.add('hidden');
            states.success.classList.remove('hidden');
          } else {
            states.loading.classList.add('hidden');
            states.error.classList.remove('hidden');
          }
          setTimeout(function () {
            hideModal(sentModal);
            $('#rv-name').value = '';
            $('#rv-text').value = '';
            $('#rv-name').disabled = false;
            $('#rv-name').placeholder = 'Ваше имя';
            rvAnon.checked = false;
          }, 1600);
        }, wait);
      }).catch(function () {
        var elapsed = Date.now() - start;
        var wait = Math.max(0, minDelay - elapsed);
        setTimeout(function () {
          states.loading.classList.add('hidden');
          states.error.classList.remove('hidden');
          setTimeout(function () { hideModal(sentModal); }, 1600);
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
        if (target === 'home') {
          resetState();
        }
        navigateTo(target);
      });
    });

    $('#logo-home').addEventListener('click', function (e) {
      e.preventDefault();
      resetState();
      navigateTo('home');
    });

    $$('.service-tile').forEach(function () {
      updateSummary();
    });

    $$('.option-row').forEach(function (row) {
      row.addEventListener('click', function () {
        setTimeout(updateSummary, 10);
      });
    });
  }

  /* ===== IG PILL ===== */
  function initIgPill() {
    var pill = $('#ig-pill');
    if (!pill) return;
    pill.addEventListener('click', function () {
      if (externalLinks.instagram) {
        window.open(externalLinks.instagram, '_blank');
      }
    });
  }

  /* ===== SETTINGS ===== */
  function loadSettings() {
    apiGet('/api/settings').then(function (s) {
      if (!s || s.error) return;

      if (s.phone) {
        $$('[data-field="phone-code"]').forEach(function (el) { el.textContent = s.phone; });
      }
      if (s.phoneLink) phoneLink = s.phoneLink;
      if (s.instagram) externalLinks.instagram = s.instagram;
      if (s.viber) externalLinks.viber = s.viber;
      if (s.intro) {
        $$('[data-field="intro"]').forEach(function (el) { el.textContent = s.intro; });
      }
      if (s.subtitle) {
        $$('[data-field="subtitle"]').forEach(function (el) { el.textContent = s.subtitle; });
      }
      if (s.followersCount) {
        var formatted = s.followersCount;
        var num = parseInt(formatted.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) {
          formatted = num >= 1000 ? (num / 1000).toFixed(1).replace('.', ',') + 'K' : String(num);
        }
        $$('[data-field="followers-count"]').forEach(function (el) { el.textContent = formatted; });
      }
    }).catch(function () {});
  }

  /* ===== INIT ===== */
  document.addEventListener('DOMContentLoaded', function () {
    initSplash();
    initServiceSelection();
    initToggles();
    setupFileUpload('add-file', 'file-input', 'file-fill', 'file-status', state, 'files');
    setupFileUpload('so-add-file', 'so-file-input', null, null, state, 'shortorderFiles');
    initNavButtons();
    initModals();
    initFormSubmit();
    initQuickOrder();
    initReview();
    initIgPill();
    loadSettings();
  });
})();
