(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var loader = document.getElementById('loader');

  var state = {
    service: null,
    options: { urgent: false, outOfTown: false, materials: false },
    files: [],
    uploadStatus: 'empty'
  };

  /* ===== Масштабирование под окно (без скролла) ===== */
  function scale() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1001);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  window.addEventListener('resize', scale);
  scale();

  /* ===== Навигация через лоадер ===== */
  var screens = document.querySelectorAll('.screen');
  var navigating = false;

  function navigateTo(id) {
    if (navigating) return;
    navigating = true;
    loader.classList.add('active');
    setTimeout(function () {
      screens.forEach(function (s) { s.classList.remove('active'); });
      document.getElementById('screen-' + id).classList.add('active');
      if (id === 'form') updateSummary();
      loader.classList.remove('active');
      navigating = false;
    }, 600);
  }

  document.querySelectorAll('[data-nav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-nav');
      if (btn.hasAttribute('data-reset')) resetState();
      navigateTo(target);
    });
  });

  /* ===== Выбор услуги ===== */
  var serviceItems = document.querySelectorAll('.service-item');
  var nextMain = document.getElementById('next-main');

  serviceItems.forEach(function (item) {
    item.addEventListener('click', function () {
      serviceItems.forEach(function (i) { i.classList.remove('active'); });
      item.classList.add('active');
      state.service = item.getAttribute('data-service');
      nextMain.disabled = false;
    });
  });

  /* ===== Переключатели опций ===== */
  document.querySelectorAll('.option-row').forEach(function (row) {
    row.addEventListener('click', function () {
      var key = row.getAttribute('data-opt');
      state.options[key] = !state.options[key];
      row.classList.toggle('on', state.options[key]);
    });
  });

  /* ===== Загрузка файлов ===== */
  var addFile = document.getElementById('add-file');
  var fileInput = document.getElementById('file-input');
  var addFileTitle = document.getElementById('add-file-title');
  var addFileSub = document.getElementById('add-file-sub');
  var progressFill = document.querySelector('#upload-progress .progress-fill');

  function pluralFiles(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'файл';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'файла';
    return 'файлов';
  }

  addFile.addEventListener('click', function () { fileInput.click(); });

  fileInput.addEventListener('change', function (e) {
    var files = Array.prototype.slice.call(e.target.files);
    if (!files.length) return;
    state.files = files;
    simulateUpload(files.length);
  });

  function simulateUpload(count) {
    state.uploadStatus = 'uploading';
    addFile.classList.remove('done');
    addFile.classList.add('uploading');
    addFileTitle.textContent = 'Загружаем: ' + count + ' ' + pluralFiles(count);
    addFileSub.style.display = 'none';
    progressFill.style.width = '0%';

    var p = 0;
    var interval = setInterval(function () {
      p += 4;
      if (p >= 100) p = 100;
      progressFill.style.width = p + '%';
      if (p >= 100) {
        clearInterval(interval);
        state.uploadStatus = 'done';
        addFile.classList.remove('uploading');
        addFile.classList.add('done');
        addFileTitle.textContent = 'Загружено!';
      }
    }, 60);
  }

  /* ===== Сводка на форме ===== */
  function yesNo(v) { return v ? 'Да' : 'Нет'; }

  function updateSummary() {
    document.getElementById('sum-service').textContent = state.service || '—';
    document.getElementById('sum-urgent').textContent = yesNo(state.options.urgent);
    document.getElementById('sum-outtown').textContent = yesNo(state.options.outOfTown);
    document.getElementById('sum-materials').textContent = yesNo(state.options.materials);
    var n = state.files.length;
    document.getElementById('sum-files').textContent = n === 0 ? 'Нет файлов' : n + ' ' + pluralFiles(n);
  }

  /* ===== Сброс состояния ===== */
  function resetState() {
    state.service = null;
    state.options = { urgent: false, outOfTown: false, materials: false };
    state.files = [];
    state.uploadStatus = 'empty';

    serviceItems.forEach(function (i) { i.classList.remove('active'); });
    nextMain.disabled = true;

    document.querySelectorAll('.option-row').forEach(function (row) {
      row.classList.remove('on');
    });

    addFile.classList.remove('uploading', 'done');
    addFileTitle.textContent = 'Добавить фото';
    addFileSub.style.display = '';
    progressFill.style.width = '0%';
    fileInput.value = '';

    document.getElementById('input-name').value = '';
    document.getElementById('input-phone').value = '';
    document.getElementById('input-desc').value = '';
  }
})();
