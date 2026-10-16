import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export class FileStore {
  #path;
  #data = new Map();

  constructor(filePath) {
    this.#path = filePath;
  }

  static open(filePath) {
    const store = new FileStore(filePath);
    try {
      const raw = readFileSync(filePath, 'utf8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        for (const [id, device] of Object.entries(parsed ?? {})) {
          store.#data.set(id, { ...device });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return store;
  }

  upsert(id, email, enabled, shieldOn) {
    const now = Math.floor(Date.now() / 1000);
    const current = this.#data.get(id) ?? {};
    const next = {
      partnerEmail: email ? email : (current.partnerEmail ?? ''),
      enabled,
      shieldOn,
      lastSeen: now,
      lastAlertKind: current.lastAlertKind,
      lastAlertAt: current.lastAlertAt,
    };
    this.#data.set(id, next);
    this.#flush();
    return { ...next };
  }

  heartbeat(id, shieldOn) {
    const current = this.#data.get(id);
    if (!current) return null;
    current.shieldOn = shieldOn;
    current.lastSeen = Math.floor(Date.now() / 1000);
    if (shieldOn) {
      current.lastAlertKind = undefined;
    } else if (current.lastAlertKind === 'silent') {
      current.lastAlertKind = undefined;
    }
    this.#data.set(id, current);
    this.#flush();
    return { ...current };
  }

  get(id) {
    const current = this.#data.get(id);
    return current ? { ...current } : null;
  }

  markAlert(id, kind) {
    const current = this.#data.get(id);
    if (!current) return;
    current.lastAlertKind = kind;
    current.lastAlertAt = Math.floor(Date.now() / 1000);
    this.#data.set(id, current);
    this.#flush();
  }

  forceLastSeen(id, unix) {
    const current = this.#data.get(id);
    if (!current) return;
    current.lastSeen = unix;
    this.#data.set(id, current);
    this.#flush();
  }

  stale(afterMs) {
    const cutoff = Math.floor((Date.now() - afterMs) / 1000);
    const out = [];
    for (const [id, device] of this.#data.entries()) {
      if (!device.enabled || !device.partnerEmail) continue;
      if (device.lastSeen >= cutoff) continue;
      if (device.lastAlertKind === 'silent') continue;
      out.push({ id, device: { ...device } });
    }
    return out;
  }

  #flush() {
    const dir = path.dirname(this.#path);
    if (dir && dir !== '.') {
      mkdirSync(dir, { recursive: true });
    }
    const payload = Object.fromEntries(this.#data.entries());
    const tmp = `${this.#path}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
    renameSync(tmp, this.#path);
  }
}
