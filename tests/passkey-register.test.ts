import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  begin: vi.fn(),
  finish: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
}))
const message = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))

vi.mock('@/api/passkey', () => ({
  passkeyList: api.list,
  passkeyRegisterBegin: api.begin,
  passkeyRegisterFinish: api.finish,
  passkeyRename: api.rename,
  passkeyDelete: api.remove,
}))
vi.mock('naive-ui', async () => {
  const button = defineComponent({
    inheritAttrs: false,
    emits: ['click'],
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  })
  const input = defineComponent({
    props: ['value'],
    emits: ['update:value'],
    template: '<input :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
  })
  const passthrough = defineComponent({ template: '<div><slot /><slot name="footer" /></div>' })
  return {
    NButton: button, NInput: input, NCard: passthrough, NSpace: passthrough,
    NDataTable: passthrough, NModal: passthrough, NForm: passthrough,
    NFormItem: passthrough, NAlert: passthrough,
    useMessage: () => message,
    useDialog: () => ({ warning: vi.fn() }),
  }
})
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (key: string) => key }),
}))

import PasskeyList from '@/views/my/components/PasskeyList.vue'

const validCreationOptions = {
  challenge: 'AQ',
  rp: { name: 'test' },
  user: { id: 'AQ', name: 'alice', displayName: 'Alice' },
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

async function mountAndOpen(name = 'Laptop'): Promise<VueWrapper> {
  api.list.mockResolvedValue({ data: [] })
  const wrapper = mount(PasskeyList)
  await nextTick()
  await wrapper.findAll('button')[0].trigger('click')
  await wrapper.find('input').setValue(name)
  return wrapper
}

describe('PasskeyList registration real component path', () => {
  let credentialsDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    credentialsDescriptor = Object.getOwnPropertyDescriptor(navigator, 'credentials')
    vi.clearAllMocks()
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
    Object.defineProperty(window, 'PublicKeyCredential', {
      configurable: true,
      value: { isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true) },
    })
    api.begin.mockResolvedValue({ data: { challenge_id: 'challenge', public_key: validCreationOptions } })
  })

  afterEach(() => {
    if (credentialsDescriptor) Object.defineProperty(navigator, 'credentials', credentialsDescriptor)
    else delete (navigator as unknown as { credentials?: unknown }).credentials
    vi.restoreAllMocks()
  })

  it.each([
    ['SecurityError', 'mySecurity.passkeySecurityError'],
    ['NotAllowedError', 'mySecurity.passkeyCancelled'],
    ['InvalidStateError', 'mySecurity.passkeyInvalidState'],
    ['NotSupportedError', 'mySecurity.passkeyNotSupported'],
    ['OtherError', 'mySecurity.passkeyUnknownError'],
  ])('shows one classified browser error for %s and preserves registration state', async (name, key) => {
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { create: vi.fn().mockRejectedValue({ name }) },
    })
    const wrapper = await mountAndOpen()

    await wrapper.findAll('button')[2].trigger('click')
    await nextTick()

    expect(message.error).toHaveBeenCalledOnce()
    expect(message.error).toHaveBeenCalledWith(key)
    expect(api.finish).not.toHaveBeenCalled()
    expect(message.success).not.toHaveBeenCalled()
    expect(api.list).toHaveBeenCalledOnce()
    expect(wrapper.find('input').element.value).toBe('Laptop')
  })

  it('leaves API begin errors to the interceptor without a duplicate page message', async () => {
    api.begin.mockRejectedValue(new Error('already displayed'))
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: vi.fn() } })
    const wrapper = await mountAndOpen()

    await wrapper.findAll('button')[2].trigger('click')

    expect(message.error).not.toHaveBeenCalled()
    expect(api.finish).not.toHaveBeenCalled()
  })

  it('leaves API finish errors to the interceptor without a duplicate page message', async () => {
    const credential = {
      id: 'credential', rawId: new ArrayBuffer(0), type: 'public-key', response: {},
      authenticatorAttachment: null, getClientExtensionResults: () => ({}),
    }
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: vi.fn().mockResolvedValue(credential) } })
    api.finish.mockRejectedValue(new Error('already displayed'))
    const wrapper = await mountAndOpen()

    await wrapper.findAll('button')[2].trigger('click')
    await nextTick()

    expect(message.error).not.toHaveBeenCalled()
    expect(message.success).not.toHaveBeenCalled()
  })

  it('shows a sanitized local error when creation option parsing fails', async () => {
    api.begin.mockResolvedValue({ data: { challenge_id: 'challenge', public_key: { ...validCreationOptions, challenge: '%' } } })
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create: vi.fn() } })
    const wrapper = await mountAndOpen()

    await wrapper.findAll('button')[2].trigger('click')
    await nextTick()

    expect(message.error).toHaveBeenCalledOnce()
    expect(message.error).toHaveBeenCalledWith('mySecurity.passkeyUnknownError')
    expect(api.finish).not.toHaveBeenCalled()
  })

  it('restores loading and ignores concurrent registration clicks', async () => {
    const pending = deferred<PublicKeyCredential | null>()
    const create = vi.fn(() => pending.promise)
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { create } })
    const wrapper = await mountAndOpen()
    const confirm = wrapper.findAll('button')[2]

    await Promise.all([confirm.trigger('click'), confirm.trigger('click')])
    expect(api.begin).toHaveBeenCalledOnce()
    pending.resolve(null)
    await nextTick()
    await nextTick()
    expect(message.error).toHaveBeenCalledWith('mySecurity.passkeyCancelled')
    expect(api.finish).not.toHaveBeenCalled()
  })
})
