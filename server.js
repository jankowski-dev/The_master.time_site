const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_ORDERS_DB = process.env.NOTION_ORDERS_DB;
const NOTION_SETTINGS_DB = process.env.NOTION_SETTINGS_DB;

function log() {
  console.log.apply(console, ['[' + new Date().toISOString() + ']'].concat(Array.prototype.slice.call(arguments)));
}

const app = express();
app.use(express.json());

// --- Загрузка файлов ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use('/uploads', express.static(uploadDir));

// --- Notion API ---
function notionConfigured() {
  return !!(NOTION_TOKEN && NOTION_ORDERS_DB && NOTION_SETTINGS_DB);
}

async function notionApi(method, url, body) {
  const res = await fetch(url, {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + NOTION_TOKEN,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Notion API ' + res.status + ': ' + text);
  }
  return res.json();
}

function toBool(v) {
  return v === true || v === 'true' || v === '1' || v === 'on';
}

// Текущее время в Минске (UTC+3, без DST)
function minskNow() {
  var d = new Date();
  var minsk = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return minsk.toISOString().replace('Z', '+03:00');
}

// Телефон РБ: начинается с +375 или 80
function isBelarusPhone(phone) {
  var p = (phone || '').replace(/[^0-9+]/g, '');
  return /^\+375\d{9}$/.test(p) || /^80\d{9}$/.test(p);
}

// Логируем все API-запросы
app.use('/api', function (req, res, next) {
  const start = Date.now();
  res.on('finish', function () {
    log(req.method, req.originalUrl, '->', res.statusCode, Math.round(Date.now() - start) + 'ms');
  });
  next();
});

// POST /api/order — сохранить заявку в Notion
app.post('/api/order', upload.array('files', 10), async function (req, res) {
  if (!notionConfigured()) {
    log('[order] БЕЗ КОНФИГА: NOTION_TOKEN=', !!NOTION_TOKEN, 'ORDERS_DB=', !!NOTION_ORDERS_DB, 'SETTINGS_DB=', !!NOTION_SETTINGS_DB);
    res.status(503).json({ error: 'Notion не настроен' });
    return;
  }
  try {
    const b = req.body || {};
    const name = (b.name || '').trim();
    const phone = (b.phone || '').trim();
    const service = (b.service || '').trim();
    const description = (b.description || '').trim();
    const source = (b.source || 'Форма').trim();

    const files = (req.files || []);
    log('[order] принято:', {
      name: name, phone: phone, service: service, description: description,
      source: source,
      urgent: toBool(b.urgent), outOfTown: toBool(b.outOfTown), materials: toBool(b.materials),
      files: files.map(function (f) { return f.originalname + ' (' + f.size + 'b)'; })
    });

    if (!isBelarusPhone(phone)) {
      log('[order] ТЕЛЕФОН НЕ ПРОШЁЛ: "' + phone + '"');
      res.status(400).json({ error: 'Некорректный номер телефона' });
      return;
    }

    const properties = {
      'Имя': { title: [{ text: { content: name || 'Без имени' } }] },
      'Описание': { rich_text: description ? [{ text: { content: description } }] : [] },
      'Источник': { select: { name: source } },
      'Статус': { select: { name: 'Новая' } },
      'Прием': { date: { start: minskNow() } },
      'Срочный вызов': { checkbox: toBool(b.urgent) },
      'За городом': { checkbox: toBool(b.outOfTown) },
      'Закупка материалов': { checkbox: toBool(b.materials) }
    };
    if (phone) properties['Телефон'] = { phone_number: phone };
    if (service) properties['Услуга'] = { select: { name: service } };

    if (files.length) {
      properties['Файлы'] = { files: files.map(function (f) {
        return {
          type: 'external',
          name: f.originalname,
          external: { url: req.protocol + '://' + req.get('host') + '/uploads/' + f.filename }
        };
      }) };
    }

    log('[order] шлю в Notion, payload properties:', JSON.stringify(properties));
    const result = await notionApi('POST', 'https://api.notion.com/v1/pages', {
      parent: { database_id: NOTION_ORDERS_DB },
      properties: properties
    });
    log('[order] Notion ОК, page id =', result.id);
    res.json({ ok: true });
  } catch (e) {
    log('[order] ОШИБКА:', e.message);
    res.status(500).json({ error: 'Ошибка сохранения заявки' });
  }
});

// GET /api/settings — настройки и контент сайта
app.get('/api/settings', async function (req, res) {
  if (!notionConfigured()) {
    log('[settings] БЕЗ КОНФИГА: NOTION_TOKEN=', !!NOTION_TOKEN, 'ORDERS_DB=', !!NOTION_ORDERS_DB, 'SETTINGS_DB=', !!NOTION_SETTINGS_DB);
    res.status(503).json({ error: 'Notion не настроен' });
    return;
  }
  try {
    log('[settings] query DB', NOTION_SETTINGS_DB);
    const data = await notionApi('POST', 'https://api.notion.com/v1/databases/' + NOTION_SETTINGS_DB + '/query', { page_size: 1 });
    const row = data.results && data.results[0];
    if (!row) {
      log('[settings] записей нет');
      res.json({});
      return;
    }
    const p = row.properties || {};
    function text(prop) {
      const arr = p[prop] && (p[prop].rich_text || p[prop].title);
      return arr && arr.length ? arr[0].plain_text : '';
    }
    function url(prop) {
      return p[prop] && p[prop].url ? p[prop].url : '';
    }
    const out = {
      phone: text('Телефон (показ)'),
      phoneLink: text('Телефон (tel)'),
      instagram: url('Instagram'),
      viber: url('Viber'),
      intro: text('Интро'),
      subtitle: text('Подзаголовок'),
      copyright: text('Копирайт')
    };
    log('[settings] ОК', JSON.stringify(out));
    res.json(out);
  } catch (e) {
    log('[settings] ОШИБКА:', e.message);
    res.status(500).json({ error: 'Ошибка загрузки настроек' });
  }
});

// --- Статика (только нужные каталоги, без node_modules/.env) ---
app.get('/', function (req, res) { res.sendFile(path.join(__dirname, 'index.html')); });
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(uploadDir));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, function () {
  log('Порт:', PORT, '| Проверки Notion конфига: TOKEN=', !!NOTION_TOKEN, 'ORDERS_DB=', !!NOTION_ORDERS_DB, 'SETTINGS_DB=', !!NOTION_SETTINGS_DB);
});
