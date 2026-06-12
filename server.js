const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '200kb' }));

// Serve the whole folder as static (for CSS + page files)
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
const REG_PATH = path.join(DATA_DIR, 'registrations.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REG_PATH)) fs.writeFileSync(REG_PATH, JSON.stringify([], null, 2), 'utf-8');
}

ensureDataFile();

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/register', (req, res) => {
  try {
    const body = req.body || {};
    const required = ['fullName', 'collegeName', 'email', 'phone', 'department', 'year'];

    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === '') {
        return res.status(400).json({ ok: false, error: `Missing field: ${k}` });
      }
    }

    if (body.consent !== true) {
      return res.status(400).json({ ok: false, error: 'Consent required.' });
    }

    const record = {
      ...body,
      submittedAt: new Date().toISOString()
    };

    const raw = fs.readFileSync(REG_PATH, 'utf-8');
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(record);
    fs.writeFileSync(REG_PATH, JSON.stringify(arr, null, 2), 'utf-8');

    return res.json({ ok: true, message: 'Registration saved.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

