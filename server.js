const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_ORDERS_DB = process.env.NOTION_ORDERS_DB;
const NOTION_SETTINGS_DB = process.env.NOTION_SETTINGS_DB;

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

// POST /api/order — сохранить заявку в Notion
app.post('/api/order', upload.array('files', 10), async function (req, res) {
  if (!notionConfigured()) {
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

    const properties = {
      'Имя': { title: [{ text: { content: name || 'Без имени' } }] },
      'Описание': { rich_text: description ? [{ text: { content: description } }] : [] },
      'Источник': { select: { name: source } },
      'Срочный вызов': { checkbox: toBool(b.urgent) },
      'За городом': { checkbox: toBool(b.outOfTown) },
      'Закупка материалов': { checkbox: toBool(b.materials) }
    };
    if (phone) properties['Телефон'] = { phone_number: phone };
    if (service) properties['Услуга'] = { select: { name: service } };

    const files = (req.files || []).map(function (f) {
      return {
        type: 'external',
        name: f.originalname,
        external: { url: req.protocol + '://' + req.get('host') + '/uploads/' + f.filename }
      };
    });
    if (files.length) properties['Файлы'] = { files: files };

    await notionApi('POST', 'https://api.notion.com/v1/pages', {
      parent: { database_id: NOTION_ORDERS_DB },
      properties: properties
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Order error:', e.message);
    res.status(500).json({ error: 'Ошибка сохранения заявки' });
  }
});

// GET /api/settings — настройки и контент сайта
app.get('/api/settings', async function (req, res) {
  if (!notionConfigured()) {
    res.status(503).json({ error: 'Notion не настроен' });
    return;
  }
  try {
    const data = await notionApi('POST', 'https://api.notion.com/v1/databases/' + NOTION_SETTINGS_DB + '/query', { page_size: 1 });
    const row = data.results && data.results[0];
    if (!row) {
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
    res.json({
      phone: text('Телефон (показ)'),
      phoneLink: text('Телефон (tel)'),
      instagram: url('Instagram'),
      viber: url('Viber'),
      intro: text('Интро'),
      subtitle: text('Подзаголовок'),
      copyright: text('Копирайт')
    });
  } catch (e) {
    console.error('Settings error:', e.message);
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
  console.log('Pracue is running on port ' + PORT);
});
