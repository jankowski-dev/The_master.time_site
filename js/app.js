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
    shortorderFiles: [],
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
  var externalLinks = { instagram: '', viber: '', youtube: '', twitter: '' };

  document.querySelectorAll('[data-call]').forEach(function (el) {
    el.addEventListener('click', function () { window.location.href = 'tel:' + phoneLink; });
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

  function sendOrder(data) {
    showModal(modalSent);
    setModalState('loading');
    isSending = true;

    var minDelay = new Promise(function (resolve) { setTimeout(resolve, 2000); });
    var done = false;
    var timeoutId = setTimeout(function () { finishOrderFail(); }, 10000);

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

    if (!isBelarusPhone(data.phone)) {
      console.log('[submit] телефон невалидный:', data.phone);
      setTimeout(finishOrderFail, 2000);
      return;
    }

    Promise.allSettled([submitOrder(data), minDelay])
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
      hideModal(modalShortorder);
      sendOrder({
        name: getVal('m-so-name'),
        phone: getVal('m-so-phone'),
        description: '',
        service: null,
        options: { urgent: false, outOfTown: false, materials: false },
        files: state.shortorderFiles,
        source: 'Быстрая заявка'
      });
      state.shortorderFiles = [];
    });
  }

  /* ===== Отзыв ===== */
  var modalReview = document.getElementById('m-modal-review');
  var modalReviewSent = document.getElementById('m-modal-review-sent');
  var rvName = document.getElementById('m-rv-name');
  var rvText = document.getElementById('m-rv-text');
  var rvAnon = document.getElementById('m-rv-anon');
  var rvSentMessage = document.getElementById('m-review-sent-message');
  var rvConfirm = document.getElementById('m-confirm-review');
  var rvAnonymous = false;

  function setReviewState(state) {
    if (!rvSentMessage) return;
    rvSentMessage.querySelectorAll('.m-state').forEach(function (el) {
      el.classList.toggle('active', el.classList.contains('m-state-' + state));
    });
  }

  if (rvAnon && rvName) {
    rvAnon.addEventListener('click', function () {
      rvAnonymous = !rvAnonymous;
      rvAnon.classList.toggle('on', rvAnonymous);
      if (rvAnonymous) {
        rvName.disabled = true;
        rvName.value = '';
      } else {
        rvName.disabled = false;
      }
    });
  }

  function sendReview() {
    var review = rvText ? rvText.value.trim() : '';
    var name = rvAnonymous ? '' : (rvName ? rvName.value.trim() : '');
    if (!review) {
      if (rvText) rvText.focus();
      return;
    }
    hideModal(modalReview);
    showModal(modalReviewSent);
    setReviewState('loading');

    var minDelay = new Promise(function (resolve) { setTimeout(resolve, 2000); });
    var done = false;
    var timeoutId = setTimeout(function () { finishReview(false); }, 10000);

    function finishReview(success) {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      setReviewState(success ? 'success' : 'error');
      setTimeout(function () {
        hideModal(modalReviewSent);
        resetReview();
      }, 1600);
    }

    Promise.allSettled([
      fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, review: review, anonymous: rvAnonymous })
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }),
      minDelay
    ]).then(function (results) {
      var r = results[0];
      finishReview(r.status === 'fulfilled' && r.value && r.value.ok);
    });
  }

  function resetReview() {
    rvAnonymous = false;
    if (rvAnon) rvAnon.classList.remove('on');
    if (rvName) { rvName.disabled = false; rvName.value = ''; }
    if (rvText) rvText.value = '';
    if (rvSentMessage) {
      rvSentMessage.querySelectorAll('.m-state').forEach(function (el) { el.classList.remove('active'); });
    }
  }

  if (rvConfirm) {
    rvConfirm.addEventListener('click', sendReview);
  }

  /* ===== Отзыв (десктоп) ===== */
  var dModalReview = document.getElementById('d-modal-review');
  var dModalReviewSent = document.getElementById('d-modal-review-sent');
  var dRvName = document.getElementById('d-rv-name');
  var dRvText = document.getElementById('d-rv-text');
  var dRvAnon = document.getElementById('d-rv-anon');
  var dRvSentMessage = document.getElementById('d-review-sent-message');
  var dRvConfirm = document.getElementById('d-confirm-review');
  var dRvAnonymous = false;

  function setDReviewState(state) {
    if (!dRvSentMessage) return;
    dRvSentMessage.querySelectorAll('.d-state').forEach(function (el) {
      el.classList.toggle('active', el.classList.contains('d-state-' + state));
    });
  }

  if (dRvAnon && dRvName) {
    dRvAnon.addEventListener('click', function () {
      dRvAnonymous = !dRvAnonymous;
      dRvAnon.classList.toggle('on', dRvAnonymous);
      if (dRvAnonymous) {
        dRvName.disabled = true;
        dRvName.value = '';
      } else {
        dRvName.disabled = false;
      }
    });
  }

  function resetDReview() {
    dRvAnonymous = false;
    if (dRvAnon) dRvAnon.classList.remove('on');
    if (dRvName) { dRvName.disabled = false; dRvName.value = ''; }
    if (dRvText) dRvText.value = '';
    if (dRvSentMessage) {
      dRvSentMessage.querySelectorAll('.d-state').forEach(function (el) { el.classList.remove('active'); });
    }
  }

  function sendDReview() {
    var review = dRvText ? dRvText.value.trim() : '';
    var name = dRvAnonymous ? '' : (dRvName ? dRvName.value.trim() : '');
    if (!review) {
      if (dRvText) dRvText.focus();
      return;
    }
    hideModal(dModalReview);
    showModal(dModalReviewSent);
    setDReviewState('loading');

    var minDelay = new Promise(function (resolve) { setTimeout(resolve, 2000); });
    var done = false;
    var timeoutId = setTimeout(function () { finishDReview(false); }, 10000);

    function finishDReview(success) {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      setDReviewState(success ? 'success' : 'error');
      setTimeout(function () {
        hideModal(dModalReviewSent);
        resetDReview();
      }, 1600);
    }

    Promise.allSettled([
      fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, review: review, anonymous: dRvAnonymous })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }),
      minDelay
    ]).then(function (results) {
      var r = results[0];
      finishDReview(r.status === 'fulfilled' && r.value && r.value.ok);
    });
  }

  if (dRvConfirm) {
    dRvConfirm.addEventListener('click', sendDReview);
  }

  stageDesktop.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showModal(document.getElementById('d-modal-' + btn.getAttribute('data-modal')));
    });
  });

  document.querySelectorAll('#d-modal-review .d-modal-overlay, #d-modal-review-sent .d-modal-overlay').forEach(function (ov) {
    ov.addEventListener('click', function () {
      if (document.activeElement) document.activeElement.blur();
      hideModal(dModalReview);
      hideModal(dModalReviewSent);
      resetDReview();
    });
  });

  var formSubmit = document.getElementById('m-form-submit');
  if (formSubmit) {
    formSubmit.addEventListener('click', function () {
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
        document.querySelector('#so-upload-progress .m-progress-fill'),
        document.getElementById('so-file-input'));
      state.shortorderFiles = [];
    });
  }

  var reviewOverlay = document.querySelector('#m-modal-review .m-overlay');
  if (reviewOverlay) {
    reviewOverlay.addEventListener('click', function () {
      if (document.activeElement) document.activeElement.blur();
      hideModal(modalReview);
      resetReview();
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
      var err = validateFiles(files);
      if (err === 'non-image') {
        state.files = [];
        showFileError(addFileEl, inputEl, titleEl, subEl, 'Загружать можно только фото');
        return;
      }
      if (err === 'too-many') {
        state.files = [];
        showFileError(addFileEl, inputEl, titleEl, subEl, 'Не более 5 файлов');
        return;
      }
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

  /* ===== Загрузка файлов — быстрая заявка ===== */
  (function () {
    var addEl = document.getElementById('so-add-file');
    var inputEl = document.getElementById('so-file-input');
    var titleEl = document.getElementById('so-add-file-title');
    var subEl = document.getElementById('so-add-file-sub');
    var fillEl = document.querySelector('#so-upload-progress .m-progress-fill');
    if (!addEl || !inputEl) return;

    addEl.addEventListener('click', function () { inputEl.click(); });
    inputEl.addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      if (!files.length) return;
      var err = validateFiles(files);
      if (err === 'non-image') {
        state.shortorderFiles = [];
        showFileError(addEl, inputEl, titleEl, subEl, 'Загружать можно только фото');
        return;
      }
      if (err === 'too-many') {
        state.shortorderFiles = [];
        showFileError(addEl, inputEl, titleEl, subEl, 'Не более 5 файлов');
        return;
      }
      state.shortorderFiles = files;
      simulateUpload(files.length, addEl, titleEl, subEl, fillEl);
    });
  })();

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
    addFileEl.classList.remove('uploading', 'done', 'error');
    titleEl.textContent = 'Добавить фото';
    subEl.style.display = '';
    fillEl.style.width = '0%';
    inputEl.value = '';
    var key = inputEl.id;
    if (fileErrorTimers[key]) { clearTimeout(fileErrorTimers[key]); fileErrorTimers[key] = null; }
  }

  function resetState() {
    state.service = null;
    state.options = { urgent: false, outOfTown: false, materials: false };
    state.files = [];
    state.shortorderFiles = [];
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

    resetAddFile(
      document.getElementById('so-add-file'),
      document.getElementById('so-add-file-title'),
      document.getElementById('so-add-file-sub'),
      document.querySelector('#so-upload-progress .m-progress-fill'),
      document.getElementById('so-file-input'));

    ['input-name', 'input-phone', 'input-desc', 'm-input-name', 'm-input-phone', 'm-input-desc', 'm-so-name', 'm-so-phone'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  /* ===== Backend / API ===== */
  function getVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function isBelarusPhone(phone) {
    var p = (phone || '').replace(/[^0-9+]/g, '');
    return /^\+375\d{9}$/.test(p) || /^80\d{9}$/.test(p);
  }

  function submitOrder(data) {
    console.log('[submit] отправка заявки:', JSON.stringify({
      name: data.name, phone: data.phone, service: data.service,
      description: data.description, source: data.source,
      options: data.options, filesCount: (data.files || []).length
    }));
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
      .then(function (r) { console.log('[submit] ответ статус:', r.status); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
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
    if (s.subtitle) document.querySelectorAll('[data-field="subtitle"]').forEach(function (el) { el.textContent = s.subtitle; });
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
    fetch('/api/settings')
      .then(function (r) { console.log('[settings] статус:', r.status); return r.json(); })
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
    if (!isMobileMode()) return;
    splash.classList.add('active');
    var minDelay = new Promise(function (resolve) { setTimeout(resolve, 1500); });
    var windowLoad = new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });
    Promise.all([minDelay, waitForFonts(), windowLoad]).then(function () {
      splash.classList.remove('active');
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
