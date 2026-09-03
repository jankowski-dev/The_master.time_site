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

  function scaleStage(stage, w, h, isMobile) {
    var vp = getViewport();
    var scale;
    if (isMobile) {
      scale = vp.width / w;
      stage.style.height = (vp.height / scale) + 'px';
    } else {
      scale = Math.min(vp.width / w, vp.height / h);
    }
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
    scaleStage(stageDesktop, 1920, 1001, false);
    scaleStage(stageMobile, 402, 874, true);
    document.body.style.background = mobile ? '#ffffff' : '#161312';
  }
  window.addEventListener('resize', applyMode);

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

  function navigateMobile(id) {
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

  stageMobile.querySelectorAll('[data-call]').forEach(function (el) {
    el.addEventListener('click', function () { window.location.href = 'tel:+375257076793'; });
  });

  stageMobile.querySelectorAll('[data-external]').forEach(function (el) {
    el.addEventListener('click', function () { /* заглушка: реальные ссылки не заданы */ });
  });

  stageMobile.querySelectorAll('.m-screen-modal .m-overlay').forEach(function (ov) {
    ov.addEventListener('click', function () { navigateMobile('main'); });
  });

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
})();
