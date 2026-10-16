import { messages } from './messages.js';

export function createServer({ store, mail, token = '', staleMs }) {
  async function sweep() {
    for (const item of store.stale(staleMs)) {
      try {
        await mail.send(item.device.partnerEmail, messages.silent.subject, messages.silent.body);
        store.markAlert(item.id, 'silent');
        console.log(`aviso de silêncio enviado para ${item.device.partnerEmail}`);
      } catch (error) {
        console.error('e-mail silêncio:', error);
      }
    }
  }

  function authorized(req) {
    if (!token) return true;
    const header = req.headers.authorization ?? '';
    const alt = req.headers['x-stay-pure-token'] ?? '';
    return header === `Bearer ${token}` || alt === token;
  }

  async function readJson(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (!chunks.length) return {};
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }

  function sendJson(res, status, value) {
    const body = JSON.stringify(value);
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  }

  async function handleWatch(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405).end('method');
      return;
    }
    if (!authorized(req)) {
      res.writeHead(401).end('unauthorized');
      return;
    }
    let body;
    try {
      body = await readJson(req);
    } catch {
      res.writeHead(400).end('payload');
      return;
    }
    const deviceId = String(body.deviceId ?? '').trim();
    if (!deviceId) {
      res.writeHead(400).end('payload');
      return;
    }
    const email = String(body.partnerEmail ?? '')
      .trim()
      .toLowerCase();
    const prev = store.get(deviceId);
    const enabled = Boolean(body.enabled);
    const shieldOn = Boolean(body.shieldOn);
    const device = store.upsert(deviceId, email, enabled, shieldOn);
    if (prev?.enabled && !enabled && device.partnerEmail) {
      await mail.send(device.partnerEmail, messages.offAccount.subject, messages.offAccount.body);
      store.markAlert(deviceId, 'accountability_off');
    }
    sendJson(res, 200, { ok: true });
  }

  async function handleHeartbeat(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405).end('method');
      return;
    }
    if (!authorized(req)) {
      res.writeHead(401).end('unauthorized');
      return;
    }
    let body;
    try {
      body = await readJson(req);
    } catch {
      res.writeHead(400).end('payload');
      return;
    }
    const deviceId = String(body.deviceId ?? '');
    if (!deviceId) {
      res.writeHead(400).end('payload');
      return;
    }
    if (!store.heartbeat(deviceId, Boolean(body.shieldOn))) {
      res.writeHead(404).end('unknown');
      return;
    }
    sendJson(res, 200, { ok: true });
  }

  async function handleEvent(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405).end('method');
      return;
    }
    if (!authorized(req)) {
      res.writeHead(401).end('unauthorized');
      return;
    }
    let body;
    try {
      body = await readJson(req);
    } catch {
      res.writeHead(400).end('payload');
      return;
    }
    const deviceId = String(body.deviceId ?? '');
    if (!deviceId) {
      res.writeHead(400).end('payload');
      return;
    }
    const device = store.get(deviceId);
    if (!device?.enabled || !device.partnerEmail) {
      sendJson(res, 200, { ok: true, skipped: true });
      return;
    }
    const kind = body.kind || 'shield_off';
    store.heartbeat(deviceId, kind === 'shield_on');
    if (kind === 'shield_on') {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (kind === 'test') {
      await mail.send(device.partnerEmail, messages.test.subject, messages.test.body);
      sendJson(res, 200, { ok: true });
      return;
    }
    try {
      await mail.send(device.partnerEmail, messages.offShield.subject, messages.offShield.body);
    } catch {
      res.writeHead(502).end('mail');
      return;
    }
    store.markAlert(deviceId, kind);
    sendJson(res, 200, { ok: true });
  }

  async function handler(req, res) {
    try {
      if (req.url === '/health') {
        res.writeHead(200).end('ok');
        return;
      }
      if (req.url === '/v1/watch') {
        await handleWatch(req, res);
        return;
      }
      if (req.url === '/v1/heartbeat') {
        await handleHeartbeat(req, res);
        return;
      }
      if (req.url === '/v1/event') {
        await handleEvent(req, res);
        return;
      }
      res.writeHead(404).end('not found');
    } catch (error) {
      console.error(error);
      res.writeHead(500).end('error');
    }
  }

  return { handler, sweep };
}

export function parseDuration(raw, fallbackMs) {
  if (!raw) return fallbackMs;
  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(String(raw).trim());
  if (!match) return fallbackMs;
  const value = Number(match[1]);
  const unit = match[2] ?? 'ms';
  const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return value * mult;
}
