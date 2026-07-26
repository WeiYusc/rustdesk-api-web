import { describe, expect, it } from 'vitest'
import * as webauthn from '@/utils/webauthn'
import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh-CN.json'
import zhTW from '@/i18n/locales/zh-TW.json'
import fr from '@/i18n/locales/fr.json'
import ko from '@/i18n/locales/ko.json'
import ru from '@/i18n/locales/ru.json'
import es from '@/i18n/locales/es.json'

const classify = (error: unknown): string => {
  return (webauthn as unknown as { getWebAuthnErrorKey: (value: unknown) => string }).getWebAuthnErrorKey(error)
}

describe('WebAuthn browser error classification', () => {
  it.each([
    ['SecurityError', 'mySecurity.passkeySecurityError'],
    ['NotAllowedError', 'mySecurity.passkeyCancelled'],
    ['AbortError', 'mySecurity.passkeyCancelled'],
    ['InvalidStateError', 'mySecurity.passkeyInvalidState'],
    ['NotSupportedError', 'mySecurity.passkeyNotSupported'],
    ['SomethingElse', 'mySecurity.passkeyUnknownError'],
  ])('classifies %s safely by name', (name, key) => {
    expect(classify({ name })).toBe(key)
  })

  it('does not require instanceof DOMException so cross-realm errors are safe', () => {
    const crossRealmLikeError = Object.create(null) as { name?: string }
    crossRealmLikeError.name = 'SecurityError'
    expect(classify(crossRealmLikeError)).toBe('mySecurity.passkeySecurityError')
  })

  it('falls back safely for null, primitives, and throwing name getters', () => {
    const hostile = Object.defineProperty({}, 'name', { get: () => { throw new Error('cross-realm trap') } })
    for (const value of [null, undefined, 1, 'SecurityError', hostile]) {
      expect(() => classify(value)).not.toThrow()
      expect(classify(value)).toBe('mySecurity.passkeyUnknownError')
    }
  })
})

describe('WebAuthn error locale parity', () => {
  it('provides every registration and login browser error key in all seven locales', () => {
    const locales = [en, zhCN, zhTW, fr, ko, ru, es]
    const keys = [
      'passkeySecurityError',
      'passkeyCancelled',
      'passkeyInvalidState',
      'passkeyNotSupported',
      'passkeyUnknownError',
    ] as const

    for (const locale of locales) {
      for (const key of keys) {
        expect(locale.mySecurity[key], key).toBeTypeOf('string')
        expect(locale.mySecurity[key], key).not.toBe('')
        expect(locale.login[key], key).toBeTypeOf('string')
        expect(locale.login[key], key).not.toBe('')
      }
    }
  })

  it('gives actionable IP RP ID guidance for SecurityError', () => {
    expect(zhCN.mySecurity.passkeySecurityError).toContain('IP')
    expect(zhCN.mySecurity.passkeySecurityError).toContain('RP ID')
    expect(en.mySecurity.passkeySecurityError).toMatch(/IP/i)
    expect(en.mySecurity.passkeySecurityError).toMatch(/RP ID/i)
  })
})
