(function () {
  'use strict';

  var stageDesktop = document.getElementById('stage-desktop');
  var stageMobile = document.getElementById('stage-mobile');
  var loaderDesktop = document.getElementById('loader');
  var loaderMobile = document.getElementById('m-loader');
  var splash = document.getElementById('m-splash');

  var state = {
    service: null,
    options: { urgent: false, outOfTown: false, materials: false },
    files: [],
    uploadStatus: 'empty'
  };

  var BREAKPOINT = 768;

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
      if (id === 'form') updateSummary();
      loaderDesktop.classList.remove('active');
      navigating = false;
    }, 600);
  }

  function navigateMobile(id, instant) {
    if (instant) {
      switchScreen(stageMobile, 'm-screen-', id);
      if (id === 'form') updateSummary();
      return;
    }
    if (navigating) return;
    navigating = true;
    loaderMobile.classList.add('active');
    setTimeout(function () {
      switchScreen(stageMobile, 'm-screen-', id);
      if (id === 'form') updateSummary();
      loaderMobile.classList.remove('active');
      navigating = false;
    }, 600);
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
  var externalLinks = { instagram: '', viber: '' };

  document.querySelectorAll('[data-call]').forEach(function (el) {
    el.addEventListener('click', function () { window.location.href = 'tel:' + phoneLink; });
  });

  document.querySelectorAll('[data-external]').forEach(function (el) {
    el.addEventListener('click', function () {
      var url = externalLinks[el.getAttribute('data-external')];
      if (url) window.open(url, '_blank');
    });
  });

  /* ===== Модальные окна ===== */
  var modalShortorder = document.getElementById('m-modal-shortorder');
  var modalSent = document.getElementById('m-modal-sent');

  function showModal(el) { if (el) el.classList.add('active'); }
  function hideModal(el) { if (el) el.classList.remove('active'); }

  stageMobile.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showModal(document.getElementById('m-modal-' + btn.getAttribute('data-modal')));
    });
  });

  var confirmShortorder = document.getElementById('m-confirm-shortorder');
  if (confirmShortorder) {
    confirmShortorder.addEventListener('click', function () {
      submitOrder({
        name: getVal('m-so-name'),
        phone: getVal('m-so-phone'),
        description: '',
        service: null,
        options: { urgent: false, outOfTown: false, materials: false },
        files: [],
        source: 'Быстрая заявка'
      });
      hideModal(modalShortorder);
      showModal(modalSent);
    });
  }

  var formSubmit = document.getElementById('m-form-submit');
  if (formSubmit) {
    formSubmit.addEventListener('click', function () {
      submitOrder({
        name: getVal('m-input-name'),
        phone: getVal('m-input-phone'),
        description: getVal('m-input-desc'),
        service: state.service,
        options: state.options,
        files: state.files,
        source: 'Форма'
      });
      navigateMobile('main', true);
      showModal(modalSent);
    });
  }

  var dFormSubmit = document.getElementById('d-form-submit');
  if (dFormSubmit) {
    dFormSubmit.addEventListener('click', function () {
      submitOrder({
        name: getVal('input-name'),
        phone: getVal('input-phone'),
        description: getVal('input-desc'),
        service: state.service,
        options: state.options,
        files: state.files,
        source: 'Форма'
      });
      navigateDesktop('success');
    });
  }

  if (modalSent) {
    modalSent.addEventListener('click', function () {
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

  function simulateUpload(count, addFileEl, titleEl, subEl, fillEl) {
    state.uploadStatus = 'uploading';
    addFileEl.classList.remove('done');
    addFileEl.classList.add('uploading');
    titleEl.textContent = 'Загружаем: ' + count + ' ' + pluralFiles(count);
    subEl.style.display = 'none';
    fillEl.style.width = '0%';

    var p = 0;
    var interval = setInterval(function () {
      p += 4;
      if (p >= 100) p = 100;
      fillEl.style.width = p + '%';
      if (p >= 100) {
        clearInterval(interval);
        state.uploadStatus = 'done';
        addFileEl.classList.remove('uploading');
        addFileEl.classList.add('done');
        titleEl.textContent = 'Загружено!';
      }
    }, 60);
  }

  function setupUpload(addFileEl, inputEl, titleEl, subEl, fillEl) {
    addFileEl.addEventListener('click', function () { inputEl.click(); });
    inputEl.addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      if (!files.length) return;
      state.files = files;
      simulateUpload(files.length, addFileEl, titleEl, subEl, fillEl);
    });
  }

  setupUpload(
    document.getElementById('add-file'),
    document.getElementById('file-input'),
    document.getElementById('add-file-title'),
    document.getElementById('add-file-sub'),
    document.querySelector('#upload-progress .progress-fill'));

  setupUpload(
    document.getElementById('m-add-file'),
    document.getElementById('m-file-input'),
    document.getElementById('m-add-file-title'),
    document.getElementById('m-add-file-sub'),
    document.querySelector('#m-upload-progress .m-progress-fill'));

  /* ===== Сводка на форме ===== */
  function yesNo(v) { return v ? 'Да' : 'Нет'; }
  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }

  function updateSummary() {
    setText('sum-service', state.service || '—');
    setText('sum-urgent', yesNo(state.options.urgent));
    setText('sum-outtown', yesNo(state.options.outOfTown));
    setText('sum-materials', yesNo(state.options.materials));
    setText('m-sum-service', state.service || '—');
    setText('m-sum-urgent', yesNo(state.options.urgent));
    setText('m-sum-outtown', yesNo(state.options.outOfTown));
    var n = state.files.length;
    var fileText = n === 0 ? 'Нет файлов' : n + ' ' + pluralFiles(n);
    setText('sum-files', fileText);
    setText('m-sum-files', fileText);
  }

  /* ===== Сброс состояния ===== */
  function resetAddFile(addFileEl, titleEl, subEl, fillEl, inputEl) {
    addFileEl.classList.remove('uploading', 'done');
    titleEl.textContent = 'Добавить фото';
    subEl.style.display = '';
    fillEl.style.width = '0%';
    inputEl.value = '';
  }

  function resetState() {
    state.service = null;
    state.options = { urgent: false, outOfTown: false, materials: false };
    state.files = [];
    state.uploadStatus = 'empty';

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
      document.querySelector('#upload-progress .progress-fill'),
      document.getElementById('file-input'));

    resetAddFile(
      document.getElementById('m-add-file'),
      document.getElementById('m-add-file-title'),
      document.getElementById('m-add-file-sub'),
      document.querySelector('#m-upload-progress .m-progress-fill'),
      document.getElementById('m-file-input'));

    ['input-name', 'input-phone', 'input-desc', 'm-input-name', 'm-input-phone', 'm-input-desc', 'm-so-name', 'm-so-phone'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  /* ===== Backend / API ===== */
  function getVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }

  function submitOrder(data) {
    var fd = new FormData();
    fd.append('name', data.name || '');
    fd.append('phone', data.phone || '');
    fd.append('service', data.service || '');
    fd.append('description', data.description || '');
    fd.append('source', data.source || 'Форма');
    fd.append('urgent', data.options.urgent ? '1' : '0');
    fd.append('outOfTown', data.options.outOfTown ? '1' : '0');
    fd.append('materials', data.options.materials ? '1' : '0');
    (data.files || []).forEach(function (f) { fd.append('files', f); });

    return fetch('/api/order', { method: 'POST', body: fd })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function (e) { console.error('Order submit error:', e); });
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
    if (s.intro) document.querySelectorAll('[data-field="intro"]').forEach(function (el) { el.textContent = s.intro; });
    if (s.subtitle) document.querySelectorAll('[data-field="subtitle"]').forEach(function (el) { el.textContent = s.subtitle; });
    if (s.copyright) document.querySelectorAll('[data-field="copyright"]').forEach(function (el) { el.textContent = s.copyright; });
  }

  function loadSettings() {
    fetch('/api/settings')
      .then(function (r) { return r.json(); })
      .then(applySettings)
      .catch(function () { /* оставляем значения по умолчанию */ });
  }

  /* ===== Заставка ===== */
  function initSplash() {
    if (isMobileMode()) {
      splash.classList.add('active');
      setTimeout(function () { splash.classList.remove('active'); }, 1500);
    }
  }

  /* ===== Старт ===== */
  applyMode();
  initSplash();
  loadSettings();
})();
