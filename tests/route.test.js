import { test } from 'node:test';
import assert from 'node:assert/strict';

// The handler reads its configuration lazily, so these must be set before the first call.
process.env.TURSO_DATABASE_URL = ':memory:';
process.env.IP_SALT = 'test-salt';
const { default: handler } = await import('../api/v1/[...slug].js');

const OWNER = 'owner-key-0123456789abcdef';
const READER = 'reader-key-0123456789abcdef';

// Minimal stand-ins for the Vercel request and response objects.
async function call(method, url, { headers = {}, body } = {}) {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  await handler({ method, url, headers, body }, res);
  return res;
}

test('GET /api/v1/requests returns JSON with the notice', async () => {
  const res = await call('GET', '/api/v1/requests?q=vante', { headers: { 'x-forwarded-for': '203.0.113.60' } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.requests, []);
  assert.match(res.body.notice, /third-party data/);
});

test('POST without a bot key is rejected with 401', async () => {
  const res = await call('POST', '/api/v1/requests', {
    headers: { 'x-forwarded-for': '203.0.113.61' },
    body: { text: 'Test uden nøgle' },
  });
  assert.equal(res.statusCode, 401);
});

test('unknown routes return 404', async () => {
  const res = await call('GET', '/api/v1/nope', { headers: { 'x-forwarded-for': '203.0.113.62' } });
  assert.equal(res.statusCode, 404);
});

test('OPTIONS returns 204 with CORS headers', async () => {
  const res = await call('OPTIONS', '/api/v1/requests');
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
});

test('create, reply and read over the handler', async () => {
  const created = await call('POST', '/api/v1/requests', {
    headers: { 'x-bot-key': OWNER, 'x-forwarded-for': '203.0.113.70' },
    body: { text: 'Søger makker til badminton i aften kl. 19-21', urgent: true },
  });
  assert.equal(created.statusCode, 200);
  const id = created.body.id;

  const reply = await call('POST', `/api/v1/requests/${id}/messages`, {
    headers: { 'x-bot-key': READER, 'x-forwarded-for': '203.0.113.71' },
    body: { kind: 'offer', text: 'Kan i aften, jeg har niveau mellem' },
  });
  assert.equal(reply.statusCode, 200);

  const read = await call('GET', `/api/v1/requests/${id}`, { headers: { 'x-forwarded-for': '203.0.113.72' } });
  assert.equal(read.body.messages.length, 1);
  assert.equal(read.body.messages[0].role, 'responder');
});
