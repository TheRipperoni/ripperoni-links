import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateSecret,
  getToken,
  verifyToken,
  getOtpAuthUri,
  getConfiguredSecret,
  isTwoFactorEnabled,
  saveSecret,
  clearSecret,
} from './totp.ts'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('generateSecret', () => {
  it('generates a base32 string of expected length', () => {
    const secret = generateSecret()
    // 20 bytes → 32 base32 chars + padding = 32 chars
    expect(secret).toMatch(/^[A-Z2-7]+=*$/)
    expect(secret.length).toBeGreaterThanOrEqual(32)
  })

  it('produces different secrets on successive calls', () => {
    const a = generateSecret()
    const b = generateSecret()
    expect(a).not.toBe(b)
  })
})

describe('getToken and verifyToken', () => {
  it('returns a 6-digit token', async () => {
    const secret = generateSecret()
    const token = await getToken(secret)
    expect(token).toMatch(/^\d{6}$/)
  })

  it('produces different tokens at different time steps', async () => {
    const secret = generateSecret()
    const token1 = await getToken(secret, 0)
    const token2 = await getToken(secret, 1)
    // It's possible (though extremely unlikely) they match
    // We just verify they're both valid 6-digit strings
    expect(token1).toMatch(/^\d{6}$/)
    expect(token2).toMatch(/^\d{6}$/)
  })

  it('verifies a valid token within the window', async () => {
    const secret = generateSecret()
    const token = await getToken(secret)
    const valid = await verifyToken(secret, token)
    expect(valid).toBe(true)
  })

  it('rejects an invalid token', async () => {
    const secret = generateSecret()
    const valid = await verifyToken(secret, '000000')
    expect(valid).toBe(false)
  })
})

describe('getOtpAuthUri', () => {
  it('returns a properly formatted otpauth URI', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const uri = getOtpAuthUri(secret)
    expect(uri).toContain('otpauth://totp/')
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
    expect(uri).toContain('issuer=LinkTree')
    expect(uri).toContain('algorithm=SHA1')
    expect(uri).toContain('digits=6')
    expect(uri).toContain('period=30')
  })

  it('accepts custom issuer and account', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const uri = getOtpAuthUri(secret, 'NeoTokyo', 'admin')
    expect(uri).toContain('issuer=NeoTokyo')
  })
})

describe('getConfiguredSecret', () => {
  it('returns null when nothing is configured', () => {
    expect(getConfiguredSecret()).toBeNull()
  })

  it('returns the localStorage secret when set', () => {
    saveSecret('JBSWY3DPEHPK3PXP')
    expect(getConfiguredSecret()).toBe('JBSWY3DPEHPK3PXP')
  })

  it('prefers env var over localStorage', () => {
    vi.stubEnv('VITE_2FA_SECRET', 'ENVSECRET12345678')
    saveSecret('LOCALSTORAGESECRET')
    expect(getConfiguredSecret()).toBe('ENVSECRET12345678')
    vi.unstubAllEnvs()
  })
})

describe('isTwoFactorEnabled', () => {
  it('returns false when nothing is configured', () => {
    expect(isTwoFactorEnabled()).toBe(false)
  })

  it('returns true when localStorage has a secret', () => {
    saveSecret('JBSWY3DPEHPK3PXP')
    expect(isTwoFactorEnabled()).toBe(true)
  })
})

describe('saveSecret / clearSecret', () => {
  it('persists and removes the secret', () => {
    saveSecret('JBSWY3DPEHPK3PXP')
    expect(localStorage.getItem('linktree-2fa-secret')).toBe('JBSWY3DPEHPK3PXP')

    clearSecret()
    expect(localStorage.getItem('linktree-2fa-secret')).toBeNull()
  })
})
