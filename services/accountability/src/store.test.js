import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { FileStore } from './store.js';

test('stale and recover', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'staypure-watch-'));
  const file = path.join(dir, 'watch.json');
  try {
    const st = FileStore.open(file);
    st.upsert('dev-1', 'amigo@example.com', true, true);
    assert.equal(st.stale(60 * 60 * 1000).length, 0);

    st.forceLastSeen('dev-1', Math.floor(Date.now() / 1000) - 5 * 60 * 60);
    assert.equal(st.stale(4 * 60 * 60 * 1000).length, 1);

    st.markAlert('dev-1', 'silent');
    assert.equal(st.stale(4 * 60 * 60 * 1000).length, 0);

    assert.ok(st.heartbeat('dev-1', false));
    st.forceLastSeen('dev-1', Math.floor(Date.now() / 1000) - 5 * 60 * 60);
    assert.equal(st.stale(4 * 60 * 60 * 1000).length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('disable keeps email', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'staypure-watch-'));
  const file = path.join(dir, 'watch.json');
  try {
    const st = FileStore.open(file);
    st.upsert('dev-1', 'amigo@example.com', true, true);
    const dev = st.upsert('dev-1', '', false, false);
    assert.equal(dev.enabled, false);
    assert.equal(dev.partnerEmail, 'amigo@example.com');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
