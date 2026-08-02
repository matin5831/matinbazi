import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import Redis from 'ioredis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

// ─── Redis (Render Key Value) with in-memory fallback for local dev ───
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL || '';
let kv;
let memStore = new Map();
let usingMemory = !REDIS_URL;

if (REDIS_URL) {
  kv = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    lazyConnect: false,
    retryStrategy: (times) => (times > 10 ? null : Math.min(times * 500, 3000)),
  });
  kv.on('error', (err) => {
    console.error('[KV] Redis error:', err.message);
    usingMemory = true;
  });
} else {
  console.log('[KV] No REDIS_URL — using in-memory store (local dev only)');
}

async function kvGet(key) {
  if (usingMemory || !kv) return memStore.get(key) ?? null;
  try { return await kv.get(key); } catch { return memStore.get(key) ?? null; }
}

async function kvSet(key, value) {
  if (usingMemory || !kv) { memStore.set(key, value); return; }
  try { await kv.set(key, value); } catch { memStore.set(key, value); }
}

// ─── Keys ───
const LEADS_KEY = 'matinbazi:leads';
const SETTINGS_KEY = 'matinbazi:settings';
const CAMPAIGNS_KEY = 'matinbazi:campaigns';
const ADMIN_PASS_KEY = 'matinbazi:admin_pass_hash';
const ADMIN_SALT_KEY = 'matinbazi:admin_pass_salt';

// ─── Helpers ───
/** Normalize phone: Persian/Arabic digits → English, strip separators, +98 → 0 */
function normalizePhone(phone) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  let s = String(phone || '').trim();
  s = s.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  s = s.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
  s = s.replace(/[\s\-().]/g, '');
  if (s.startsWith('+98')) s = '0' + s.slice(3);
  if (s.startsWith('0098')) s = '0' + s.slice(4);
  return s;
}

function normalizeIg(ig) {
  return String(ig || '').trim().toLowerCase().replace(/^@/, '');
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + ':' + password).digest('hex');
}

async function getLeads() {
  const raw = await kvGet(LEADS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

/** Check if a lead already exists for this campaign by IG or phone (server-side, bypass-proof).
 *  Rule: ONE play per campaign per user — regardless of how many games the campaign contains.
 *  A reset of the campaign (admin) clears its leads, allowing new plays. */
async function findDuplicate(campaignId, cleanIg, cleanPhone) {
  const leads = await getLeads();
  return leads.some((l) => {
    if (l.campaignId !== campaignId) return false;
    const lIg = normalizeIg(l.instagramHandle || '');
    const lPhone = normalizePhone(l.phoneNumber || '');
    const igMatch = cleanIg.length >= 3 && lIg.length >= 3 && cleanIg === lIg;
    const phoneMatch = cleanPhone.length >= 10 && lPhone.length >= 10 && cleanPhone === lPhone;
    return igMatch || phoneMatch;
  });
}

// ─── API Routes ───

/** Health check (used by ping monitor too) */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: usingMemory ? 'memory' : 'redis', time: Date.now() });
});

/** GET all leads (admin dashboard — requires admin password header) */
app.get('/api/leads', async (req, res) => {
  try {
    // Require admin password when one is set (protects customer privacy)
    const salt = await kvGet(ADMIN_SALT_KEY);
    const hash = await kvGet(ADMIN_PASS_KEY);
    if (salt && hash) {
      const provided = req.headers['x-admin-password'] || '';
      if (hashPassword(String(provided), salt) !== hash) {
        return res.status(403).json({ success: false, error: 'unauthorized' });
      }
    }
    res.json({ success: true, leads: await getLeads() });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** GET store settings — public (customer pages need store info: name, logo, IG) */
app.get('/api/settings', async (req, res) => {
  try {
    const raw = await kvGet(SETTINGS_KEY);
    res.json({ success: true, settings: raw ? JSON.parse(raw) : null });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** PUT store settings — admin only (server-side store info so ALL browsers/devices see the same brand) */
app.put('/api/settings', async (req, res) => {
  try {
    const { settings, password } = req.body || {};
    const salt = await kvGet(ADMIN_SALT_KEY);
    const hash = await kvGet(ADMIN_PASS_KEY);
    if (!salt || !hash || hashPassword(String(password || ''), salt) !== hash) {
      return res.status(403).json({ success: false, error: 'unauthorized' });
    }
    if (!settings || typeof settings !== 'object') return res.status(400).json({ success: false, error: 'invalid_settings' });
    await kvSet(SETTINGS_KEY, JSON.stringify(settings));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** GET campaigns — public (customer pages resolve ?play=ID / ?play=random from server data) */
app.get('/api/campaigns', async (req, res) => {
  try {
    const raw = await kvGet(CAMPAIGNS_KEY);
    res.json({ success: true, campaigns: raw ? JSON.parse(raw) : null });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** PUT campaigns — admin only (server-side campaigns so ALL browsers/devices see the same list) */
app.put('/api/campaigns', async (req, res) => {
  try {
    const { campaigns, password } = req.body || {};
    const salt = await kvGet(ADMIN_SALT_KEY);
    const hash = await kvGet(ADMIN_PASS_KEY);
    if (!salt || !hash || hashPassword(String(password || ''), salt) !== hash) {
      return res.status(403).json({ success: false, error: 'unauthorized' });
    }
    if (!Array.isArray(campaigns)) return res.status(400).json({ success: false, error: 'invalid_campaigns' });
    await kvSet(CAMPAIGNS_KEY, JSON.stringify(campaigns));
    // 🧹 Prune leads belonging to campaigns that no longer exist (e.g. old sample campaigns)
    const validIds = new Set(campaigns.map((c) => c.id));
    const allLeads = await getLeads();
    const pruned = allLeads.filter((l) => validIds.has(l.campaignId));
    if (pruned.length !== allLeads.length) {
      await kvSet(LEADS_KEY, JSON.stringify(pruned));
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** POST duplicate check — public, used before a customer starts a game */
app.post('/api/leads/check', async (req, res) => {
  try {
    const { campaignId, instagramHandle, phoneNumber } = req.body || {};
    if (!campaignId) return res.status(400).json({ success: false, error: 'missing_campaign' });
    const cleanIg = normalizeIg(instagramHandle || '');
    const cleanPhone = normalizePhone(phoneNumber || '');
    const duplicate = await findDuplicate(campaignId, cleanIg, cleanPhone);
    res.json({ success: true, duplicate });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** POST a new lead — server-side duplicate check (the core anti-cheat rule) */
app.post('/api/leads', async (req, res) => {
  try {
    const { campaignId, campaignTitle, instagramHandle, phoneNumber, prizeWon, couponCode, gameType } = req.body || {};
    if (!campaignId) return res.status(400).json({ success: false, error: 'missing_campaign' });

    const cleanIg = normalizeIg(instagramHandle || '');
    const cleanPhone = normalizePhone(phoneNumber || '');

    // ⛔ Server-side duplicate check — cannot be bypassed by clearing browser storage
    // Rule: ONE play per campaign per user (admin reset re-opens the campaign)
    const isDuplicate = await findDuplicate(campaignId, cleanIg, cleanPhone);
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        error: 'already_played',
        message: 'شما قبلاً در این بازی شرکت کرده‌اید. هر آیدی و شماره فقط یک بار مجاز است.',
      });
    }

    const now = new Date();
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(now);

    const lead = {
      id: 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      campaignId,
      campaignTitle: campaignTitle || '',
      instagramHandle: instagramHandle ? (instagramHandle.startsWith('@') ? instagramHandle : '@' + instagramHandle) : '',
      phoneNumber: phoneNumber || 'ثبت نشده',
      prizeWon: prizeWon || '',
      couponCode: couponCode || '',
      gameType: gameType || '',
      wonAt: persianDate,
      isRedeemed: false,
    };

    const leads = await getLeads();
    leads.unshift(lead);
    await kvSet(LEADS_KEY, JSON.stringify(leads));

    res.json({ success: true, lead, duplicate: false });
  } catch (e) {
    console.error('[API] add lead error:', e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** Toggle redeem status (admin marks purchase as done) */
app.post('/api/leads/toggle', async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'missing_id' });
    const leads = await getLeads();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'not_found' });
    leads[idx].isRedeemed = !leads[idx].isRedeemed;
    await kvSet(LEADS_KEY, JSON.stringify(leads));
    res.json({ success: true, leads });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** Reset ALL campaigns & leads (admin only — requires password) */
app.post('/api/admin/reset-all', async (req, res) => {
  try {
    const { password } = req.body || {};
    const storedSalt = await kvGet(ADMIN_SALT_KEY);
    const storedHash = await kvGet(ADMIN_PASS_KEY);
    if (!storedSalt || !storedHash) return res.status(403).json({ success: false, error: 'no_admin_password' });
    if (hashPassword(String(password || ''), storedSalt) !== storedHash) {
      return res.status(403).json({ success: false, error: 'wrong_password' });
    }
    await kvSet(LEADS_KEY, JSON.stringify([]));
    res.json({ success: true, message: 'همه لیدها پاک شدند' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** Reset ONE campaign's leads (admin only) — re-opens that campaign for new plays */
app.post('/api/admin/reset-campaign', async (req, res) => {
  try {
    const { password, campaignId } = req.body || {};
    if (!campaignId) return res.status(400).json({ success: false, error: 'missing_campaign' });
    const storedSalt = await kvGet(ADMIN_SALT_KEY);
    const storedHash = await kvGet(ADMIN_PASS_KEY);
    if (!storedSalt || !storedHash) return res.status(403).json({ success: false, error: 'no_admin_password' });
    if (hashPassword(String(password || ''), storedSalt) !== storedHash) {
      return res.status(403).json({ success: false, error: 'wrong_password' });
    }
    const leads = await getLeads();
    const remaining = leads.filter((l) => l.campaignId !== campaignId);
    await kvSet(LEADS_KEY, JSON.stringify(remaining));
    res.json({ success: true, message: `لیدهای کمپین پاک شدند (${leads.length - remaining.length} حذف)` });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** Set admin password (first time only, then hashed & stored server-side) */
app.post('/api/admin/set-password', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password || String(password).length < 4) return res.status(400).json({ success: false, error: 'weak_password' });
    const existingSalt = await kvGet(ADMIN_SALT_KEY);
    if (existingSalt) return res.status(409).json({ success: false, error: 'already_set' });
    const salt = crypto.randomBytes(16).toString('hex');
    await kvSet(ADMIN_SALT_KEY, salt);
    await kvSet(ADMIN_PASS_KEY, hashPassword(String(password), salt));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

/** Verify admin password (for unlocking dashboard) */
app.post('/api/admin/verify', async (req, res) => {
  try {
    const { password } = req.body || {};
    const salt = await kvGet(ADMIN_SALT_KEY);
    const hash = await kvGet(ADMIN_PASS_KEY);
    if (!salt || !hash) return res.json({ success: false, set: false });
    const ok = hashPassword(String(password || ''), salt) === hash;
    res.json({ success: ok, set: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ─── Serve built frontend (SPA fallback) ───
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');
const fs = await import('fs');
if (!fs.existsSync(indexPath)) {
  console.error('[MatinBazi] ⚠️ dist/index.html NOT FOUND — build command likely not run (Render sets "bun install" by default).');
  console.error('[MatinBazi] Fix: Service Settings → Build & Deploy → Build Command → "npm run build" → redeploy.');
}
app.use(express.static(distDir));
app.get(/^(?!\/api\/).*/, (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(
      '<html dir="rtl"><body style="font-family:Tahoma;background:#0b0d12;color:#fbbf24;text-align:center;padding:60px">' +
      '<h2>⚠️ بیلد فرانت‌اند اجرا نشده است</h2>' +
      '<p style="color:#94a3b8">در Render: Settings ← Build &amp; Deploy ← Build Command را روی <code>npm run build</code> تنظیم کنید و دوباره دیپلوی کنید.</p>' +
      '</body></html>'
    );
  }
});

// ─── Start ───
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[MatinBazi] Server running on port ${PORT} (storage: ${usingMemory ? 'in-memory' : 'redis'})`);
});
