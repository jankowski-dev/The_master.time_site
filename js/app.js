/*
 * Pracue — клиентская логика (мобильная и десктопная версии в одном документе).
 *
 * Разделы файла:
 *   1. Утилиты          — minDelay, api / apiJson
 *   2. Режим и масштаб  — переключение моб/десктоп, scaleStage
 *   3. Навигация        — switchScreen / navigateDesktop / navigateMobile
 *   4. Модалки          — showModal / hideModal
 *   5. Отзывы           — createReview (общая логика для обеих версий)
 *   6. Отправка заявки  — sendOrder (моб, модалка), sendDOrder (десктоп, экран)
 *   7. Услуги и опции   — bindServiceSelection / bindToggles
 *   8. Загрузка файлов  — setupUpload (единый конфиг для 3 блоков)
 *   9. Сброс состояния  — resetState
 *  10. Валидация        — RULES + VALIDATION_UI (правила общие, поведение по версиям)
 *  11. API и контент    — submitOrder, applySettings / loadSettings
 *  12. Заставка и старт — initSplash
 *
 * ВАЖНО: при изменении css/js поднимайте версию в index.html (?v=N) —
 * Cloudflare кэширует статику, версия заставляет браузер скачать свежую.
 */
(function () {
  'use strict';

  var stageDesktop = document.getElementById('stage-desktop');
  var stageMobile = document.getElementById('stage-mobile');
  var loaderDesktop = document.getElementById('loader');
  var splash = document.getElementById('m-splash');
  var dSplash = document.getElementById('d-splash');

  var state = {
    service: null,
    options: { urgent: false, outOfTown: false },
    files: [],
    shortorderFiles: []
  };

  var BREAKPOINT = 768;

  /* ===== Утилиты ===== */
  function minDelay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // Обёртка над fetch: проверяет статус и возвращает JSON
  function api(url, options) {
    return fetch(url, options).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function apiJson(url, payload) {
    return api(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /* ===== Переключение и масштабирование ===== */
  function isMobileMode() { return window.innerWidth < BREAKPOINT; }

  function getViewport() {
    var vv = window.visualViewport;
    if (vv && vv.width) return vv;
    return { width: window.innerWidth, height: window.innerHeight };
  }

  function scaleStage(stage, w) {
    var vp = getViewport();
    var scale = vp.width / w;
    stage.style.height = (vp.height / scale) + 'px';
    var cx = (vp.offsetLeft || 0) + vp.width / 2;
    var cy = (vp.offsetTop || 0) + vp.height / 2;
    stage.style.left = cx + 'px';
    stage.style.top = cy + 'px';
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }

  function applyMode() {
    var mobile = isMobileMode();
    stageDesktop.classList.toggle('active', !mobile);
    stageMobile.classList.toggle('active', mobile);
    scaleStage(stageDesktop, 1920);
    scaleStage(stageMobile, 402);
    document.body.style.background = mobile ? '#ffffff' : '#161312';
  }
  var lastInnerWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lastInnerWidth) {
      lastInnerWidth = window.innerWidth;
      applyMode();
    }
  });

  /* ===== Навигация через лоадер ===== */
  var navigating = false;

  function switchScreen(stage, prefix, id) {
    stage.querySelectorAll('.screen, .m-screen').forEach(function (s) { s.classList.remove('active'); });
    var target = stage.querySelector('#' + prefix + id);
    if (target) target.classList.add('active');
  }

  function navigateDesktop(id) {
    if (navigating) return;
    navigating = true;
    loaderDesktop.classList.add('active');
    setTimeout(function () {
      switchScreen(stageDesktop, 'screen-', id);
      loaderDesktop.classList.remove('active');
      navigating = false;
    }, 600);
  }

  function navigateMobile(id, instant) {
    var target = stageMobile.querySelector('#m-screen-' + id);
    if (!target) return;
    if (instant) {
      switchScreen(stageMobile, 'm-screen-', id);
      return;
    }
    if (navigating) return;
    navigating = true;
    var current = stageMobile.querySelector('.m-screen.active');
    if (!current || current === target) {
      switchScreen(stageMobile, 'm-screen-', id);
      navigating = false;
      return;
    }
    current.classList.add('m-leave');
    setTimeout(function () {
      current.classList.remove('active', 'm-leave');
      target.classList.add('active', 'm-enter');
      setTimeout(function () {
        target.classList.remove('m-enter');
        navigating = false;
      }, 280);
    }, 220);
  }

  stageDesktop.querySelectorAll('[data-nav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-nav');
      if (btn.hasAttribute('data-reset')) resetState();
      navigateDesktop(target);
    });
  });

  stageMobile.querySelectorAll('[data-nav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-nav');
      if (btn.hasAttribute('data-reset')) resetState();
      navigateMobile(target);
    });
  });

  var phoneLink = '+375257076793';
  var externalLinks = { instagram: 'https://www.instagram.com/the_master.time/', viber: '', youtube: '', twitter: '' };

  document.querySelectorAll('[data-call]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (el.tagName === 'A') e.preventDefault();
      window.location.href = 'tel:' + phoneLink;
    });
  });

  document.querySelectorAll('[data-external]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (el.tagName === 'A') e.preventDefault();
      var key = el.getAttribute('data-external');
      var url = externalLinks[key];
      if (!url) return;
      if (key === 'viber' && !/^https?:\/\//i.test(url)) {
        var num = url.replace(/[^0-9]/g, '');
        url = 'viber://chat?number=' + num;
      }
      console.log('[external] opening:', key, url);
      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  });

  /* ===== Модальные окна ===== */
  var modalShortorder = document.getElementById('m-modal-shortorder');
  var modalSent = document.getElementById('m-modal-sent');
  var isSending = false;

  function showModal(el) { if (el) el.classList.add('active'); }
  function hideModal(el) { if (el) el.classList.remove('active'); }

  function setModalState(state) {
    var msg = document.getElementById('m-message');
    if (!msg) return;
    msg.querySelectorAll('.m-state').forEach(function (el) {
      el.classList.toggle('active', el.classList.contains('m-state-' + state));
    });
  }

  function setErrorText(title, text) {
    var t = document.getElementById('m-error-title');
    var s = document.getElementById('m-error-text');
    if (t) t.textContent = title;
    if (s) s.textContent = text;
  }

  function sendOrder(data) {
    var phone = normalizeBelarusPhone(data.phone);
    if (!phone) {
      console.log('[submit] телефон невалидный:', data.phone);
      return;
    }

    showModal(modalSent);
    setModalState('loading');
    setErrorText('Произошла ошибка', 'Попробуйте ещё раз');
    isSending = true;

    var delay = minDelay(800);
    var done = false;
    var timeoutId = setTimeout(function () { finishOrderFail(); }, 30000);

    function finishOrderFail() {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      isSending = false;
      setModalState('error');
      setTimeout(function () {
        hideModal(modalSent);
        resetState();
        navigateMobile('main', true);
      }, 1600);
    }

    function finishSuccess() {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      isSending = false;
      setModalState('success');
    }

    Promise.allSettled([submitOrder(data, phone), delay])
      .then(function (results) {
        var r = results[0];
        if (r.status === 'fulfilled' && r.value && r.value.ok) {
          finishSuccess();
        } else {
          finishOrderFail();
        }
      });
  }

  stageMobile.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showModal(document.getElementById('m-modal-' + btn.getAttribute('data-modal')));
    });
  });

  var confirmShortorder = document.getElementById('m-confirm-shortorder');
  if (confirmShortorder) {
    confirmShortorder.addEventListener('click', function () {
      if (!validateFields(ORDER_FIELDS.shortorder, VALIDATION_UI.mobile)) return;
      hideModal(modalShortorder);
      sendOrder({
        name: getVal('m-so-name'),
        phone: getVal('m-so-phone'),
        description: '',
        service: null,
        options: { urgent: false, outOfTown: false },
        files: state.shortorderFiles,
        source: 'Быстрая заявка'
      });
      state.shortorderFiles = [];
    });
  }

  /* =====================================================================
     ОТЗЫВЫ
     Мобильная и десктопная модалки отличаются только разметкой и
     классами состояний — логика общая.
     ===================================================================== */
  function createReview(cfg) {
    var anonymous = false;

    function setState(state) {
      if (!cfg.sentMessage) return;
      cfg.sentMessage.querySelectorAll(cfg.stateSelector).forEach(function (el) {
        el.classList.toggle('active', el.classList.contains(cfg.statePrefix + state));
      });
    }

    function reset() {
      anonymous = false;
      if (cfg.anonToggle) cfg.anonToggle.classList.remove('on');
      if (cfg.name) { cfg.name.disabled = false; cfg.name.value = ''; }
      if (cfg.text) cfg.text.value = '';
      resetFields(REVIEW_FIELDS[cfg.fieldsKey]);
      if (cfg.sentMessage) {
        cfg.sentMessage.querySelectorAll(cfg.stateSelector).forEach(function (el) { el.classList.remove('active'); });
      }
    }

    function send() {
      if (!validateFields(REVIEW_FIELDS[cfg.fieldsKey], VALIDATION_UI[cfg.uiKey])) return;
      var review = cfg.text ? cfg.text.value.trim() : '';
      var name = anonymous ? '' : (cfg.name ? cfg.name.value.trim() : '');
      hideModal(cfg.modal);
      showModal(cfg.modalSent);
      setState('loading');

      var done = false;
      var timeoutId = setTimeout(function () { finish(false); }, 20000);

      function finish(success) {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        setState(success ? 'success' : 'error');
        setTimeout(function () {
          hideModal(cfg.modalSent);
          reset();
        }, 1600);
      }

      Promise.allSettled([
        apiJson('/api/review', { name: name, review: review, anonymous: anonymous }),
        minDelay(800)
      ]).then(function (results) {
        var r = results[0];
        finish(r.status === 'fulfilled' && r.value && r.value.ok);
      });
    }

    if (cfg.anonToggle && cfg.name) {
      cfg.anonToggle.addEventListener('click', function () {
        anonymous = !anonymous;
        cfg.anonToggle.classList.toggle('on', anonymous);
        cfg.name.disabled = anonymous;
        if (anonymous) {
          cfg.name.value = '';
          applyFieldState(cfg.name, 'empty');
        }
      });
    }

    if (cfg.confirm) cfg.confirm.addEventListener('click', send);

    return { modal: cfg.modal, modalSent: cfg.modalSent, reset: reset };
  }

  var reviewMobile = createReview({
    modal: document.getElementById('m-modal-review'),
    modalSent: document.getElementById('m-modal-review-sent'),
    name: document.getElementById('m-rv-name'),
    text: document.getElementById('m-rv-text'),
    anonToggle: document.getElementById('m-rv-anon'),
    confirm: document.getElementById('m-confirm-review'),
    sentMessage: document.getElementById('m-review-sent-message'),
    stateSelector: '.m-state',
    statePrefix: 'm-state-',
    fieldsKey: 'mobile',
    uiKey: 'mobile'
  });

  var reviewDesktop = createReview({
    modal: document.getElementById('d-modal-review'),
    modalSent: document.getElementById('d-modal-review-sent'),
    name: document.getElementById('d-rv-name'),
    text: document.getElementById('d-rv-text'),
    anonToggle: document.getElementById('d-rv-anon'),
    confirm: document.getElementById('d-confirm-review'),
    sentMessage: document.getElementById('d-review-sent-message'),
    stateSelector: '.d-state',
    statePrefix: 'd-state-',
    fieldsKey: 'desktop',
    uiKey: 'desktop'
  });

  stageDesktop.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showModal(document.getElementById('d-modal-' + btn.getAttribute('data-modal')));
    });
  });

  document.querySelectorAll('#d-modal-review .d-modal-overlay, #d-modal-review-sent .d-modal-overlay').forEach(function (ov) {
    ov.addEventListener('click', function () {
      if (document.activeElement) document.activeElement.blur();
      hideModal(reviewDesktop.modal);
      hideModal(reviewDesktop.modalSent);
      reviewDesktop.reset();
    });
  });

  var formSubmit = document.getElementById('m-form-submit');
  if (formSubmit) {
    formSubmit.addEventListener('click', function () {
      if (!validateFields(ORDER_FIELDS.mobile, VALIDATION_UI.mobile)) return;
      navigateMobile('main', true);
      sendOrder({
        name: getVal('m-input-name'),
        phone: getVal('m-input-phone'),
        description: getVal('m-input-desc'),
        service: state.service,
        options: state.options,
        files: state.files,
        source: 'Форма'
      });
    });
  }

  var dIsSending = false;

  function showDOrderError(title, text) {
    var t = document.getElementById('d-error-title');
    var s = document.getElementById('d-error-text');
    if (t) t.textContent = title;
    if (s) s.textContent = text;
    navigateDesktop('error');
  }

  function sendDOrder(data) {
    if (dIsSending) return;
    var phone = normalizeBelarusPhone(data.phone);
    if (!phone) {
      console.log('[submit] телефон невалидный:', data.phone);
      return;
    }
    dIsSending = true;
    loaderDesktop.classList.add('active');
    var delay = minDelay(800);
    Promise.allSettled([submitOrder(data, phone), delay])
      .then(function (results) {
        dIsSending = false;
        loaderDesktop.classList.remove('active');
        var r = results[0];
        if (r.status === 'fulfilled' && r.value && r.value.ok) {
          resetState();
          navigateDesktop('success');
        } else {
          showDOrderError('Произошла ошибка', 'Попробуйте ещё раз');
        }
      });
  }

  var dFormSubmit = document.getElementById('d-form-submit');
  if (dFormSubmit) {
    dFormSubmit.addEventListener('click', function () {
      if (!validateFields(ORDER_FIELDS.desktop, VALIDATION_UI.desktop)) return;
      sendDOrder({
        name: getVal('input-name'),
        phone: getVal('input-phone'),
        description: getVal('input-desc'),
        service: state.service,
        options: state.options,
        files: state.files,
        source: 'Форма'
      });
    });
  }

  if (modalSent) {
    modalSent.addEventListener('click', function () {
      if (isSending) return;
      hideModal(modalSent);
      resetState();
      navigateMobile('main', true);
    });
  }

  var shortorderOverlay = document.querySelector('#m-modal-shortorder .m-overlay');
  if (shortorderOverlay) {
    shortorderOverlay.addEventListener('click', function () {
      if (document.activeElement) document.activeElement.blur();
      hideModal(modalShortorder);
      resetAddFile(
        document.getElementById('so-add-file'),
        document.getElementById('so-add-file-title'),
        document.getElementById('so-add-file-sub'),
        document.getElementById('so-upload-percent'),
        document.getElementById('so-file-input'));
      state.shortorderFiles = [];
    });
  }

  var reviewOverlay = document.querySelector('#m-modal-review .m-overlay');
  if (reviewOverlay) {
    reviewOverlay.addEventListener('click', function () {
      if (document.activeElement) document.activeElement.blur();
      hideModal(reviewMobile.modal);
      reviewMobile.reset();
    });
  }

  /* ===== Логотип -> на главную ===== */
  var mLogo = document.querySelector('#stage-mobile .m-logo');
  if (mLogo) {
    mLogo.addEventListener('click', function () { navigateMobile('main'); });
  }
  var dLogo = document.querySelector('#stage-desktop .logo');
  if (dLogo) {
    dLogo.addEventListener('click', function () { navigateDesktop('main'); });
  }

  /* ===== Клавиатура в быстрой заявке ===== */
  (function () {
    var sheet = document.querySelector('#m-modal-shortorder .m-sheet');
    if (!sheet) return;
    var inputs = sheet.querySelectorAll('input');
    var focused = false;
    var baseHeight = 0;

    function updateSheet() {
      var kbOpen = false;
      if (window.visualViewport) {
        kbOpen = window.visualViewport.height < baseHeight - 100;
      }
      sheet.style.transform = (focused && kbOpen) ? 'translateY(-22vh)' : '';
    }

    inputs.forEach(function (inp) {
      inp.addEventListener('focus', function () {
        focused = true;
        baseHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        updateSheet();
      });
      inp.addEventListener('blur', function () {
        focused = false;
        updateSheet();
      });
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSheet);
    }
  })();

  /* ===== Выбор услуги ===== */
  var nextMain = document.getElementById('next-main');
  var mNextServices = document.getElementById('m-next-services');

  function bindServiceSelection(items, nextBtn) {
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        items.forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');
        state.service = item.getAttribute('data-service');
        nextBtn.disabled = false;
      });
    });
  }
  bindServiceSelection(Array.prototype.slice.call(stageDesktop.querySelectorAll('.service-item')), nextMain);
  bindServiceSelection(Array.prototype.slice.call(stageMobile.querySelectorAll('.m-service-item')), mNextServices);

  /* ===== Переключатели опций ===== */
  function bindToggles(rows) {
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        var key = row.getAttribute('data-opt');
        state.options[key] = !state.options[key];
        row.classList.toggle('on', state.options[key]);
      });
    });
  }
  bindToggles(Array.prototype.slice.call(stageDesktop.querySelectorAll('.option-row')));
  bindToggles(Array.prototype.slice.call(stageMobile.querySelectorAll('.m-option-row')));

  /* ===== Загрузка файлов ===== */
  function pluralFiles(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'файл';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'файла';
    return 'файлов';
  }

  var IMAGE_EXTS = /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif)$/i;
  var MAX_FILES = 5;
  var fileErrorTimers = {};

  function validateFiles(files) {
    for (var i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/') && !IMAGE_EXTS.test(files[i].name)) {
        return 'non-image';
      }
    }
    if (files.length > MAX_FILES) return 'too-many';
    return null;
  }

  function showFileError(addFileEl, inputEl, titleEl, subEl, msg) {
    var key = inputEl.id;
    if (fileErrorTimers[key]) clearTimeout(fileErrorTimers[key]);
    addFileEl.classList.remove('uploading', 'done');
    addFileEl.classList.add('error');
    addFileEl.style.backgroundImage = '';
    titleEl.textContent = msg;
    subEl.style.display = 'none';
    inputEl.value = '';
    fileErrorTimers[key] = setTimeout(function () {
      addFileEl.classList.remove('error');
      titleEl.textContent = 'Добавить фото';
      subEl.style.display = '';
      fileErrorTimers[key] = null;
    }, 2500);
  }

  function setUploadProgress(addFileEl, percentEl, p) {
    percentEl.textContent = p + '%';
    addFileEl.style.backgroundImage = 'linear-gradient(to right, #F0F7F0 ' + p + '%, transparent ' + p + '%)';
  }

  function simulateUpload(count, addFileEl, titleEl, subEl, percentEl) {
    addFileEl.classList.remove('done');
    addFileEl.classList.add('uploading');
    titleEl.textContent = 'Загружаем: ' + count + ' ' + pluralFiles(count);
    subEl.style.display = 'none';
    setUploadProgress(addFileEl, percentEl, 0);

    var p = 0;
    var interval = setInterval(function () {
      p += 4;
      if (p >= 100) p = 100;
      setUploadProgress(addFileEl, percentEl, p);
      if (p >= 100) {
        clearInterval(interval);
        addFileEl.classList.remove('uploading');
        addFileEl.classList.add('done');
        titleEl.textContent = 'Загружено!';
      }
    }, 60);
  }

  // Конфиг одного блока загрузки файлов.
  // stateKey — куда складывать выбранные файлы (state.files / state.shortorderFiles)
  function setupUpload(cfg) {
    var addFileEl = cfg.addFile;
    var inputEl = cfg.input;
    var titleEl = cfg.title;
    var subEl = cfg.sub;
    if (!addFileEl || !inputEl) return;

    addFileEl.addEventListener('click', function (e) {
      if (e.target === inputEl) return;
      inputEl.click();
    });

    inputEl.addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      inputEl.value = '';
      if (!files.length) return;
      var err = validateFiles(files);
      if (err === 'non-image') {
        state[cfg.stateKey] = [];
        showFileError(addFileEl, inputEl, titleEl, subEl, 'Загружать можно только фото');
        return;
      }
      if (err === 'too-many') {
        state[cfg.stateKey] = [];
        showFileError(addFileEl, inputEl, titleEl, subEl, 'Не более 5 файлов');
        return;
      }
      state[cfg.stateKey] = files;
      simulateUpload(files.length, addFileEl, titleEl, subEl, cfg.percent);
    });
  }

  setupUpload({
    addFile: document.getElementById('add-file'),
    input: document.getElementById('file-input'),
    title: document.getElementById('add-file-title'),
    sub: document.getElementById('add-file-sub'),
    percent: document.getElementById('upload-percent'),
    stateKey: 'files'
  });

  setupUpload({
    addFile: document.getElementById('m-add-file'),
    input: document.getElementById('m-file-input'),
    title: document.getElementById('m-add-file-title'),
    sub: document.getElementById('m-add-file-sub'),
    percent: document.getElementById('m-upload-percent'),
    stateKey: 'files'
  });

  setupUpload({
    addFile: document.getElementById('so-add-file'),
    input: document.getElementById('so-file-input'),
    title: document.getElementById('so-add-file-title'),
    sub: document.getElementById('so-add-file-sub'),
    percent: document.getElementById('so-upload-percent'),
    stateKey: 'shortorderFiles'
  });

  /* ===== Сброс состояния ===== */
  function resetAddFile(addFileEl, titleEl, subEl, percentEl, inputEl) {
    addFileEl.classList.remove('uploading', 'done', 'error');
    addFileEl.style.backgroundImage = '';
    titleEl.textContent = 'Добавить фото';
    subEl.style.display = '';
    if (percentEl) percentEl.textContent = '';
    inputEl.value = '';
    var key = inputEl.id;
    if (fileErrorTimers[key]) { clearTimeout(fileErrorTimers[key]); fileErrorTimers[key] = null; }
  }

  function resetState() {
    state.service = null;
    state.options = { urgent: false, outOfTown: false };
    state.files = [];
    state.shortorderFiles = [];

    stageDesktop.querySelectorAll('.service-item').forEach(function (i) { i.classList.remove('active'); });
    stageMobile.querySelectorAll('.m-service-item').forEach(function (i) { i.classList.remove('active'); });
    nextMain.disabled = true;
    mNextServices.disabled = true;

    stageDesktop.querySelectorAll('.option-row').forEach(function (r) { r.classList.remove('on'); });
    stageMobile.querySelectorAll('.m-option-row').forEach(function (r) { r.classList.remove('on'); });

    resetAddFile(
      document.getElementById('add-file'),
      document.getElementById('add-file-title'),
      document.getElementById('add-file-sub'),
      document.getElementById('upload-percent'),
      document.getElementById('file-input'));

    resetAddFile(
      document.getElementById('m-add-file'),
      document.getElementById('m-add-file-title'),
      document.getElementById('m-add-file-sub'),
      document.getElementById('m-upload-percent'),
      document.getElementById('m-file-input'));

    resetAddFile(
      document.getElementById('so-add-file'),
      document.getElementById('so-add-file-title'),
      document.getElementById('so-add-file-sub'),
      document.getElementById('so-upload-percent'),
      document.getElementById('so-file-input'));

    ['input-name', 'input-phone', 'input-desc', 'm-input-name', 'm-input-phone', 'm-input-desc', 'm-so-name', 'm-so-phone'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    resetFieldStates();
  }

  /* ===== Backend / API ===== */
  function getVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }

  /* =====================================================================
     ЕДИНАЯ СИСТЕМА ВАЛИДАЦИИ
     Правила (RULES) общие для мобильной и десктопной версий.
     Расходится только поведение — см. VALIDATION_UI.
     ===================================================================== */

  // Мобильные коды РБ
  var BY_CODES = ['25', '29', '33', '44'];

  // Нормализация телефона РБ → +375XXXXXXXXX или null
  function normalizeBelarusPhone(phone) {
    var p = (phone || '').replace(/[^0-9]/g, '');
    var nat = null;
    if (p.length === 12 && p.slice(0, 3) === '375') nat = p.slice(3);
    else if (p.length === 11 && p.slice(0, 2) === '80') nat = p.slice(2);
    else if (p.length === 10 && p.slice(0, 1) === '8') nat = p.slice(1);
    else if (p.length === 9) nat = p;
    if (!nat || nat.length !== 9) return null;
    if (BY_CODES.indexOf(nat.slice(0, 2)) === -1) return null;
    return '+375' + nat;
  }

  // Правило: значение → состояние поля
  // 'empty' пусто · 'typing' ещё вводится · 'valid' · 'invalid'
  function optionalText(value) {
    return (value || '').trim() ? 'valid' : 'empty';
  }

  var RULES = {
    name: optionalText,
    message: optionalText,
    phone: function (value) {
      var v = (value || '').trim();
      if (!v) return 'empty';
      if (v.replace(/[^0-9]/g, '').length < 9) return 'typing';
      return normalizeBelarusPhone(v) ? 'valid' : 'invalid';
    }
  };

  // Единственное место, где версии расходятся
  var VALIDATION_UI = {
    desktop: { live: true, shake: true },
    mobile: { live: true, shake: true }
  };

  var STATE_CLASSES = ['is-valid', 'is-invalid'];

  function applyFieldState(inputEl, state) {
    if (!inputEl) return;
    STATE_CLASSES.forEach(function (c) { inputEl.classList.remove(c); });
    if (state === 'valid') inputEl.classList.add('is-valid');
    else if (state === 'invalid') inputEl.classList.add('is-invalid');
  }

  function shakeField(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('shake');
    void inputEl.offsetWidth;
    inputEl.classList.add('shake');
    setTimeout(function () { inputEl.classList.remove('shake'); }, 500);
  }

  // Живая валидация одного поля
  function bindField(inputEl, ruleName, ui) {
    if (!inputEl) return;
    var rule = RULES[ruleName];
    function update() { applyFieldState(inputEl, rule(inputEl.value)); }
    if (ui.live) {
      inputEl.addEventListener('input', update);
      inputEl.addEventListener('blur', update);
    }
    return update;
  }

  // Поля заявок по версиям
  var ORDER_FIELDS = {
    desktop: [
      { input: document.getElementById('input-name'), rule: 'name' },
      { input: document.getElementById('input-phone'), rule: 'phone', required: true },
      { input: document.getElementById('input-desc'), rule: 'message' }
    ],
    mobile: [
      { input: document.getElementById('m-input-name'), rule: 'name' },
      { input: document.getElementById('m-input-phone'), rule: 'phone', required: true },
      { input: document.getElementById('m-input-desc'), rule: 'message' }
    ],
    shortorder: [
      { input: document.getElementById('m-so-name'), rule: 'name' },
      { input: document.getElementById('m-so-phone'), rule: 'phone', required: true }
    ]
  };

  // Поля отзыва (та же зелёная гамма, что и в заявке)
  var REVIEW_FIELDS = {
    desktop: [
      { input: document.getElementById('d-rv-name'), rule: 'message' },
      { input: document.getElementById('d-rv-text'), rule: 'message', required: true }
    ],
    mobile: [
      { input: document.getElementById('m-rv-name'), rule: 'message' },
      { input: document.getElementById('m-rv-text'), rule: 'message', required: true }
    ]
  };

  function bindOrderFields() {
    ['desktop', 'mobile', 'shortorder'].forEach(function (key) {
      var ui = key === 'desktop' ? VALIDATION_UI.desktop : VALIDATION_UI.mobile;
      ORDER_FIELDS[key].forEach(function (f) { bindField(f.input, f.rule, ui); });
    });
    REVIEW_FIELDS.desktop.forEach(function (f) { bindField(f.input, f.rule, VALIDATION_UI.desktop); });
    REVIEW_FIELDS.mobile.forEach(function (f) { bindField(f.input, f.rule, VALIDATION_UI.mobile); });
  }

  // Проверка перед отправкой: подсвечивает поля, трясёт первое невалидное
  function validateFields(fields, ui) {
    var firstInvalid = null;
    fields.forEach(function (f) {
      if (!f.input) return;
      var state = RULES[f.rule](f.input.value);
      applyFieldState(f.input, state);
      var bad = state === 'invalid' || (state === 'empty' && f.required);
      if (bad && !firstInvalid) firstInvalid = f.input;
    });
    if (firstInvalid && ui.shake) shakeField(firstInvalid);
    return !firstInvalid;
  }

  function resetFields(fields) {
    (fields || []).forEach(function (f) { applyFieldState(f.input, 'empty'); });
  }

  function resetFieldStates() {
    Object.keys(ORDER_FIELDS).forEach(function (key) { resetFields(ORDER_FIELDS[key]); });
  }

  bindOrderFields();

  function submitOrder(data, phone) {
    console.log('[submit] отправка заявки:', JSON.stringify({
      name: data.name, phone: data.phone, service: data.service,
      description: data.description, source: data.source,
      options: data.options, filesCount: (data.files || []).length
    }));
    var fd = new FormData();
    fd.append('name', data.name || '');
    fd.append('phone', phone || data.phone || '');
    fd.append('service', data.service || '');
    fd.append('description', data.description || '');
    fd.append('source', data.source || 'Форма');
    fd.append('urgent', data.options.urgent ? '1' : '0');
    fd.append('outOfTown', data.options.outOfTown ? '1' : '0');
    (data.files || []).forEach(function (f) { fd.append('files', f); });

    return api('/api/order', { method: 'POST', body: fd })
      .then(function (j) { console.log('[submit] ответ:', JSON.stringify(j)); return j; });
  }

  function applySettings(s) {
    if (!s || s.error) return;
    if (s.phone) {
      var parts = s.phone.split(/\s+/);
      var code = parts.slice(0, 2).join(' ');
      var number = parts.slice(2).join(' ');
      document.querySelectorAll('[data-field="phone-code"]').forEach(function (el) { el.textContent = code; });
      document.querySelectorAll('[data-field="phone-number"]').forEach(function (el) { el.textContent = number; });
    }
    if (s.phoneLink) phoneLink = s.phoneLink;
    if (s.instagram) externalLinks.instagram = s.instagram;
    if (s.viber) externalLinks.viber = s.viber;
    if (s.youtube) externalLinks.youtube = s.youtube;
    if (s.twitter) externalLinks.twitter = s.twitter;
    if (s.intro) document.querySelectorAll('[data-field="intro"]').forEach(function (el) { el.textContent = s.intro; });
    if (s.copyright) document.querySelectorAll('[data-field="copyright"]').forEach(function (el) { el.textContent = s.copyright; });
    if (s.followersCount) {
      var n = parseInt(s.followersCount, 10);
      if (!isNaN(n)) {
        var fcText = n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '').replace('.', ',') + 'K' : String(n);
        document.querySelectorAll('[data-field="followers-count"]').forEach(function (el) { el.textContent = fcText; });
      }
    }
  }

  function loadSettings() {
    api('/api/settings')
      .then(function (s) { console.log('[settings] данные:', JSON.stringify(s)); applySettings(s); })
      .catch(function (e) { console.error('[settings] ошибка:', e); });
  }

  /* ===== Заставка ===== */
  function waitForFonts() {
    if (document.fonts && document.fonts.load) {
      var w = ['300', '400', '500', '700', '900'].map(function (weight) {
        return document.fonts.load(weight + ' 16px Montserrat');
      });
      return Promise.all(w).catch(function () {});
    }
    return (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  }

  function initSplash() {
    var activeSplash = isMobileMode() ? splash : dSplash;
    if (!activeSplash) return;
    activeSplash.classList.add('active');
    var minDelay = new Promise(function (resolve) { setTimeout(resolve, 1500); });
    var windowLoad = new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });
    Promise.all([minDelay, waitForFonts(), windowLoad]).then(function () {
      activeSplash.classList.remove('active');
      applyMode();
    });
  }

  /* ===== Старт ===== */
  applyMode();
  initSplash();
  loadSettings();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { applyMode(); });
  }
})();
