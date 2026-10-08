/**
 * Admin authentication.
 *
 * v0 has exactly one privileged role, so there is no user table: the admin
 * signs in with a password held as a Worker secret and gets a stateless
 * HMAC-signed cookie. Sign-in is throttled per IP in D1 so a leaked /admin
 * URL cannot be brute forced.
 */

const COOKIE_NAME = 'ls_admin';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_FAILS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const encoder = new TextEncoder();

function b64urlEncode(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function sign(secret, payload) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return b64urlEncode(sig);
}

/** Length-independent comparison so we do not leak the secret by timing. */
function timingSafeEqual(a, b) {
  const ab = encoder.encode(String(a));
  const bb = encoder.encode(String(b));
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (ab[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}

function requireSecret(env) {
  const secret = env.SESSION_SECRET;
  if (!secret || String(secret).length < 16) {
    throw new Error('SESSION_SECRET is missing. Run: wrangler secret put SESSION_SECRET');
  }
  return secret;
}

export async function createSessionCookie(env, { secure = true } = {}) {
  const secret = requireSecret(env);
  const payload = b64urlEncode(encoder.encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })));
  const sig = await sign(secret, payload);
  const attrs = [
    COOKIE_NAME + '=' + payload + '.' + sig,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + Math.floor(SESSION_TTL_MS / 1000),
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function clearSessionCookie({ secure = true } = {}) {
  const attrs = [COOKIE_NAME + '=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return '';
}

/** True when the request carries a valid, unexpired admin session. */
export async function isAuthenticated(request, env) {
  try {
    const secret = requireSecret(env);
    const token = readCookie(request, COOKIE_NAME);
    if (!token) return false;
    const dot = token.lastIndexOf('.');
    if (dot < 1) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = await sign(secret, payload);
    if (!timingSafeEqual(sig, expected)) return false;
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function clientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'unknown'
  ).split(',')[0].trim();
}

/** Returns { allowed, retryAfterSec } for the given IP. */
export async function checkLoginRate(db, ip) {
  const row = await db.prepare('SELECT fails, locked_until FROM login_attempts WHERE ip = ?').bind(ip).first();
  if (!row) return { allowed: true, retryAfterSec: 0 };
  const now = Date.now();
  if (row.locked_until && row.locked_until > now) {
    return { allowed: false, retryAfterSec: Math.ceil((row.locked_until - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export async function recordLoginFailure(db, ip) {
  const now = Date.now();
  const row = await db.prepare('SELECT fails, locked_until FROM login_attempts WHERE ip = ?').bind(ip).first();
  const fails = (row ? row.fails : 0) + 1;
  const lockedUntil = fails >= MAX_FAILS ? now + LOCKOUT_MS : 0;
  await db
    .prepare(
      'INSERT INTO login_attempts (ip, fails, locked_until, updated_at) VALUES (?, ?, ?, ?) ' +
        'ON CONFLICT(ip) DO UPDATE SET fails = excluded.fails, locked_until = excluded.locked_until, updated_at = excluded.updated_at'
    )
    .bind(ip, fails >= MAX_FAILS ? 0 : fails, lockedUntil, now)
    .run();
  return { fails, lockedUntil };
}

export async function clearLoginFailures(db, ip) {
  await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
}

/** Constant-time password check against the ADMIN_PASSWORD secret. */
export function passwordMatches(env, candidate) {
  const expected = env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD is missing. Run: wrangler secret put ADMIN_PASSWORD');
  return timingSafeEqual(candidate || '', expected);
}

/**
 * Rejects cross-site form/API posts to the admin endpoints.
 * The session cookie is SameSite=Lax, so this is belt and braces.
 */
export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // same-origin form posts may omit it
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
