export interface AuthState {
  isUnlocked: boolean;
  failedAttempts: number;
  isBlocked: boolean;
}

export const AUTH_STORAGE_KEY = 'meal_planner_auth_v1';
export const MAX_FAILED_ATTEMPTS = 5;
export const BLOCKED_MESSAGE = 'Blocked out of website. Contact Admin';
export const EXPECTED_DIGEST_WORDS: readonly number[] = [
  0x39899100, 0x9da1d251, 0x792eb353, 0xa0b7b185,
  0xbc83e71e, 0x12e489e7, 0x3228b554, 0xfc6cebc5,
];
export const DEFAULT_GATE_DIGEST = EXPECTED_DIGEST_WORDS.map((w) =>
  (w >>> 0).toString(16).padStart(8, '0')
).join('');

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * Computes the hexadecimal SHA-256 digest of a UTF-8 string synchronously.
 */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const totalBytes = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(totalBytes);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(totalBytes - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalBytes - 4, bitLen >>> 0, false);

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const W = new Uint32Array(64);

  for (let offset = 0; offset < totalBytes; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3);
      const s1 = rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + W[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

/**
 * Verifies a password candidate against the expected SHA-256 digest.
 */
export function verifyPassword(candidate: string, expectedDigest = DEFAULT_GATE_DIGEST): boolean {
  if (typeof candidate !== 'string') return false;
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) return false;
  return sha256Hex(normalized) === expectedDigest.trim().toLowerCase();
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch (err) {
    console.warn('Unable to access localStorage:', err);
  }
  return null;
}

/**
 * Reads and normalizes the current authentication state from storage.
 */
export function getAuthState(storage: StorageLike | null = getDefaultStorage()): AuthState {
  if (!storage) {
    return { isUnlocked: false, failedAttempts: 0, isBlocked: false };
  }
  try {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { isUnlocked: false, failedAttempts: 0, isBlocked: false };
    }
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    const failedAttempts =
      typeof parsed.failedAttempts === 'number' && !Number.isNaN(parsed.failedAttempts) && parsed.failedAttempts >= 0
        ? Math.floor(parsed.failedAttempts)
        : 0;
    const isBlocked = Boolean(parsed.isBlocked) || failedAttempts >= MAX_FAILED_ATTEMPTS;
    const isUnlocked = !isBlocked && Boolean(parsed.isUnlocked);
    return { isUnlocked, failedAttempts, isBlocked };
  } catch (err) {
    console.warn('Failed to parse auth state from storage:', err);
    return { isUnlocked: false, failedAttempts: 0, isBlocked: false };
  }
}

function saveAuthState(state: AuthState, storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save auth state to storage:', err);
  }
}

/**
 * Processes a password attempt, updating unlock or lockout state in storage.
 */
export function submitPasswordAttempt(
  candidate: string,
  storage: StorageLike | null = getDefaultStorage(),
  expectedDigest = DEFAULT_GATE_DIGEST
): AuthState {
  const current = getAuthState(storage);
  if (current.isBlocked) {
    return current;
  }

  if (verifyPassword(candidate, expectedDigest)) {
    const nextState: AuthState = {
      isUnlocked: true,
      failedAttempts: 0,
      isBlocked: false,
    };
    saveAuthState(nextState, storage);
    return nextState;
  }

  const nextAttempts = current.failedAttempts + 1;
  const isBlocked = nextAttempts >= MAX_FAILED_ATTEMPTS;
  const nextState: AuthState = {
    isUnlocked: false,
    failedAttempts: nextAttempts,
    isBlocked,
  };
  saveAuthState(nextState, storage);
  return nextState;
}

/**
 * Locks the application while preserving any existing failed-attempt count.
 */
export function lockApp(storage: StorageLike | null = getDefaultStorage()): AuthState {
  const current = getAuthState(storage);
  const nextState: AuthState = {
    isUnlocked: false,
    failedAttempts: current.failedAttempts,
    isBlocked: current.isBlocked,
  };
  saveAuthState(nextState, storage);
  return nextState;
}
