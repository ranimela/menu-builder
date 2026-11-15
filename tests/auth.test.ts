import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  AUTH_STORAGE_KEY,
  BLOCKED_MESSAGE,
  DEFAULT_GATE_DIGEST,
  MAX_FAILED_ATTEMPTS,
  getAuthState,
  lockApp,
  sha256Hex,
  submitPasswordAttempt,
  verifyPassword,
  type StorageLike,
} from '../src/utils/auth.ts';

function createMemoryStorage(): StorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('password gate & custom domain setup', () => {
  it('computes SHA-256 and verifies expected password without storing plaintext', () => {
    const testCandidate = ['m', 'e', 'n', 'u'].join('');
    assert.equal(sha256Hex(testCandidate), DEFAULT_GATE_DIGEST);
    assert.equal(verifyPassword(testCandidate), true);
    assert.equal(verifyPassword('  MENU  '), true);
    assert.equal(verifyPassword('wrong'), false);
  });

  it('starts locked, unlocks on valid password, and locks again via lockApp', () => {
    const storage = createMemoryStorage();
    const initial = getAuthState(storage);
    assert.equal(initial.isUnlocked, false);
    assert.equal(initial.failedAttempts, 0);
    assert.equal(initial.isBlocked, false);

    const unlocked = submitPasswordAttempt(['m', 'e', 'n', 'u'].join(''), storage);
    assert.equal(unlocked.isUnlocked, true);
    assert.equal(unlocked.failedAttempts, 0);
    assert.equal(unlocked.isBlocked, false);

    const relocked = lockApp(storage);
    assert.equal(relocked.isUnlocked, false);
    assert.equal(relocked.isBlocked, false);
  });

  it('blocks access after 5 failed attempts and persists lockout state', () => {
    const storage = createMemoryStorage();
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
      const state = submitPasswordAttempt(`wrong-${i}`, storage);
      assert.equal(state.isUnlocked, false);
      assert.equal(state.failedAttempts, i);
      assert.equal(state.isBlocked, false);
    }

    const fifthAttempt = submitPasswordAttempt('wrong-5', storage);
    assert.equal(fifthAttempt.isUnlocked, false);
    assert.equal(fifthAttempt.failedAttempts, 5);
    assert.equal(fifthAttempt.isBlocked, true);
    assert.equal(BLOCKED_MESSAGE, 'Blocked out of website. Contact Admin');

    // Even a valid password must remain blocked once 5 failed attempts are reached
    const afterBlock = submitPasswordAttempt(['m', 'e', 'n', 'u'].join(''), storage);
    assert.equal(afterBlock.isUnlocked, false);
    assert.equal(afterBlock.isBlocked, true);

    // Corrupted JSON recovers safely
    storage.setItem(AUTH_STORAGE_KEY, '{corrupted_json');
    const recovered = getAuthState(storage);
    assert.equal(recovered.isUnlocked, false);
    assert.equal(recovered.isBlocked, false);
  });

  it('configures CNAME for menu.melameds.net and removes legacy /menu-builder/ paths', () => {
    const rootDir = path.resolve(import.meta.dirname, '..');
    const cname = fs.readFileSync(path.join(rootDir, 'public/CNAME'), 'utf-8').trim();
    assert.equal(cname, 'menu.melameds.net');

    const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    assert.ok(!indexHtml.includes('/menu-builder/'));

    const manifest = fs.readFileSync(path.join(rootDir, 'public/manifest.json'), 'utf-8');
    assert.ok(!manifest.includes('/menu-builder/'));

    const sw = fs.readFileSync(path.join(rootDir, 'public/sw.js'), 'utf-8');
    assert.ok(!sw.includes('/menu-builder/'));
  });
});
