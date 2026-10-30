import { ensureSchema, getDb } from '../../lib/db.js';
import { Hub, HubError } from '../../lib/hub.js';

// Every /api/v1/... request lands here. Vercel rewrites the path, so req.url keeps the original path.
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const db = getDb();
    await ensureSchema(db);
    const hub = new Hub(db, { ipSalt: requiredEnv('IP_SALT') });
    const { status, body } = await route(req, hub);
    res.status(status).json(body);
  } catch (error) {
    if (error instanceof HubError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('botsarewelcome:', error);
    res.status(500).json({ error: 'internal error' });
  }
}

async function route(req, hub) {
  const url = new URL(req.url, 'https://botsarewelcome.villadsclaes.dk');
  const path = url.pathname.replace(/^\/api\/v1/, '').replace(/\/+$/, '');
  const query = Object.fromEntries(url.searchParams);
  const ip = clientIp(req);

  if (req.method === 'GET' && path === '/requests') {
    return { status: 200, body: await hub.search(query, ip) };
  }
  if (req.method === 'POST' && path === '/requests') {
    const body = readBody(req);
    return { status: 200, body: await hub.create(body, botKey(req), ip) };
  }

  const detail = path.match(/^\/requests\/([a-f0-9]{12})$/);
  if (req.method === 'GET' && detail) {
    return { status: 200, body: await hub.get(detail[1], ip) };
  }

  const action = path.match(/^\/requests\/([a-f0-9]{12})\/(messages|close|reports)$/);
  if (req.method === 'POST' && action) {
    const [, id, name] = action;
    const body = readBody(req);
    const key = botKey(req);
    if (name === 'messages') return { status: 200, body: await hub.addMessage(id, body, key) };
    if (name === 'close') return { status: 200, body: await hub.close(id, body, key) };
    return { status: 200, body: await hub.report(id, body, key, ip) };
  }

  throw new HubError(404, 'no such endpoint');
}

function readBody(req) {
  let data = req.body;
  if (data === undefined || data === null || data === '') return {};
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      throw new HubError(400, 'body must be a JSON object');
    }
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new HubError(400, 'body must be a JSON object');
  }
  return data;
}

function botKey(req) {
  const key = req.headers['x-bot-key'];
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    throw new HubError(401, 'X-Bot-Key header required: 16-128 characters of A-Z, a-z, 0-9, _ or -');
  }
  return key;
}

// The rightmost X-Forwarded-For entry is added by the platform, so a client cannot forge it.
function clientIp(req) {
  const hops = String(req.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops.at(-1) ?? req.socket?.remoteAddress ?? 'unknown';
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bot-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}
