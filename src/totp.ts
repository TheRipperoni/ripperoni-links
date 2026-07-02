/**
 * TOTP (Time-based One-Time Password) utilities using the Web Crypto API.
 * Implements RFC 6238 with SHA-1, 30-second period, and 6-digit codes.
 */

const STORAGE_KEY = 'linktree-2fa-secret'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(bytes: Uint8Array): string {
  let bits = ''
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0')
  }
  let result = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    result += BASE32[parseInt(bits.substring(i, i + 5), 2)]
  }
  const padding = result.length % 8
  if (padding !== 0) {
    result = result.padEnd(result.length + (8 - padding), '=')
  }
  return result
}

function base32Decode(str: string): Uint8Array {
  const clean = str.replace(/[^A-Za-z2-7]/g, '')
  let bits = ''
  for (const char of clean.toUpperCase()) {
    const idx = BASE32.indexOf(char)
    if (idx >= 0) bits += idx.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  return new Uint8Array(bytes)
}

async function computeToken(secret: string, counter: number): Promise<string> {
  const rawKey = base32Decode(secret)
  const keyBuf = rawKey.slice().buffer as unknown as ArrayBuffer
  const key = await crypto.subtle.importKey('raw', keyBuf, { name: 'HMAC', hash: 'SHA-1' }, false, [
    'sign',
  ])

  const counterBuf = new ArrayBuffer(8)
  const view = new DataView(counterBuf)
  view.setBigUint64(0, BigInt(counter), false)

  const hmac = await crypto.subtle.sign('HMAC', key, counterBuf)
  const hmacArray = new Uint8Array(hmac)

  const offset = hmacArray[hmacArray.length - 1] & 0x0f
  const code =
    ((hmacArray[offset] & 0x7f) << 24) |
    ((hmacArray[offset + 1] & 0xff) << 16) |
    ((hmacArray[offset + 2] & 0xff) << 8) |
    (hmacArray[offset + 3] & 0xff)

  return String(code % 1000000).padStart(6, '0')
}

function getCounter(offset = 0): number {
  return Math.floor(Date.now() / 30000) + offset
}

/**
 * Generate a random base32-encoded TOTP secret.
 * @param length - Number of random bytes (default 20 = 160 bits).
 * @returns Base32-encoded secret.
 */
export function generateSecret(length = 20): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return base32Encode(array)
}

/**
 * Get the current TOTP token for a secret.
 * @param secret - Base32-encoded secret.
 * @param offset - Time step offset (for testing or windowing).
 * @returns 6-digit token.
 */
export async function getToken(secret: string, offset = 0): Promise<string> {
  return computeToken(secret, getCounter(offset))
}

/**
 * Verify a TOTP token against a secret with a time window.
 * @param secret - Base32-encoded secret.
 * @param token - The 6-digit token to verify.
 * @param window - Allowed drift in time steps (±window).
 * @returns Whether the token is valid.
 */
export async function verifyToken(secret: string, token: string, window = 1): Promise<boolean> {
  const counter = getCounter()
  for (let i = -window; i <= window; i++) {
    const expected = await computeToken(secret, counter + i)
    if (expected === token) return true
  }
  return false
}

/**
 * Generate an otpauth:// URI for QR code display.
 * @param secret - Base32-encoded secret.
 * @param issuer - Issuer name.
 * @param account - Account name.
 * @returns otpauth:// URI.
 */
export function getOtpAuthUri(secret: string, issuer = 'LinkTree', account = 'admin'): string {
  const encIssuer = encodeURIComponent(issuer)
  const encAccount = encodeURIComponent(account)
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`
}

/**
 * Get the configured 2FA secret, if any.
 * Priority: env var > localStorage.
 * @returns The secret or null.
 */
export function getConfiguredSecret(): string | null {
  const envSecret = import.meta.env.VITE_2FA_SECRET as string | undefined
  if (envSecret) return envSecret
  return localStorage.getItem(STORAGE_KEY)
}

/**
 * Check if 2FA is configured.
 * @returns Whether 2FA is enabled.
 */
export function isTwoFactorEnabled(): boolean {
  return !!getConfiguredSecret()
}

/**
 * Persist a 2FA secret to localStorage.
 * @param secret - The secret to save.
 */
export function saveSecret(secret: string): void {
  localStorage.setItem(STORAGE_KEY, secret)
}

/**
 * Remove the 2FA secret from localStorage (only if no env var is set).
 */
export function clearSecret(): void {
  if (!import.meta.env.VITE_2FA_SECRET) {
    localStorage.removeItem(STORAGE_KEY)
  }
}
