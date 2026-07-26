import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

const passkeyApi = vi.hoisted(() => ({ begin: vi.fn(), finish: vi.fn() }))
const auth = vi.hoisted(() => ({ setToken: vi.fn() }))
const router = vi.hoisted(() => ({ push: vi.fn() }))
const message = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() }))
const loginApi = vi.hoisted(() => ({ options: vi.fn(), captcha: vi.fn() }))

vi.mock('@/api/passkey', () => ({ passkeyLoginBegin: passkeyApi.begin, passkeyLoginFinish: passkeyApi.finish }))
vi.mock('@/utils/webauthn', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/webauthn')>()),
  serializeCredential: vi.fn(() => ({ id: 'credential', rawId: '', type: 'public-key', response: {}, clientExtensionResults: {} })),
}))
vi.mock('@/utils/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/auth')>()),
  setToken: auth.setToken,
}))
vi.mock('@/api/login', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/login')>()),
  loginOptions: loginApi.options,
  captcha: loginApi.captcha,
}))
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => router,
}))
vi.mock('naive-ui', () => {
  const button = defineComponent({
    inheritAttrs: false,
    props: { loading: Boolean },
    emits: ['click'],
    template: '<button v-bind="$attrs" :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
  })
  const passthrough = defineComponent({ template: '<div><slot /><slot name="footer" /></div>' })
  return {
    NButton: button, NCard: passthrough, NForm: passthrough, NFormItem: passthrough,
    NInput: passthrough, NSpace: passthrough, NDivider: passthrough, NImage: passthrough,
    NText: passthrough, NSpin: passthrough, NModal: passthrough,
    useMessage: () => message,
  }
})

import { useUserStore } from '@/stores/user'
import Login from '@/views/login/Login.vue'

const requestOptions = { challenge: 'AQ', userVerification: 'preferred' }
const user = {
  id: 1, username: 'alice', email: '', avatar: '', nickname: 'Alice', token: 'token',
  status: 1, is_admin: true, created_at: '', updated_at: '', route_names: [], email_verified_at: '',
}

function mountLogin() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useUserStore(pinia)
  const wrapper = mount(Login, { global: { plugins: [pinia] } })
  return { wrapper, store }
}

describe('passkey login Store to Login page path', () => {
  let credentialsDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    credentialsDescriptor = Object.getOwnPropertyDescriptor(navigator, 'credentials')
    vi.clearAllMocks()
    localStorage.setItem('app_dark_mode', 'false')
    setActivePinia(createPinia())
    passkeyApi.begin.mockResolvedValue({ data: { challenge_id: 'challenge', public_key: requestOptions } })
    loginApi.options.mockResolvedValue({
      data: { disable_pwd: true, register: false, ops: [], passkey_enabled: true, passkey_discoverable_login_enabled: true },
    })
  })

  afterEach(() => {
    if (credentialsDescriptor) Object.defineProperty(navigator, 'credentials', credentialsDescriptor)
    else delete (navigator as unknown as { credentials?: unknown }).credentials
    vi.restoreAllMocks()
  })

  it('shows one classified browser error, does not finish/save/redirect, and restores loading', async () => {
    const getCredential = vi.fn().mockRejectedValue(new DOMException('blocked', 'SecurityError'))
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get: getCredential },
    })
    const { wrapper } = mountLogin()
    await flushPromises()

    const button = wrapper.get('[data-test="passkey-login"]')
    await button.trigger('click')
    await flushPromises()

    await vi.waitFor(() => expect(message.error).toHaveBeenCalledOnce())
    expect(passkeyApi.begin).toHaveBeenCalledOnce()
    expect(getCredential).toHaveBeenCalledOnce()
    expect(message.error).toHaveBeenCalledWith('页面来源或安全策略无效，无法使用通行密钥登录')
    expect(passkeyApi.finish).not.toHaveBeenCalled()
    expect(auth.setToken).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
    expect(button.attributes('loading')).toBeUndefined()
  })

  it('keeps credential=null silent and false without finish/save/redirect', async () => {
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get: vi.fn().mockResolvedValue(null) } })
    const store = useUserStore()

    await expect(store.passkeyLogin()).resolves.toBe(false)
    expect(message.error).not.toHaveBeenCalled()
    expect(passkeyApi.finish).not.toHaveBeenCalled()
    expect(auth.setToken).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('leaves begin and finish API errors to the interceptor without page messages or side effects', async () => {
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get: vi.fn().mockResolvedValue({}) } })
    const store = useUserStore()
    passkeyApi.begin.mockRejectedValueOnce(new Error('begin displayed'))
    await expect(store.passkeyLogin()).resolves.toBe(false)
    passkeyApi.finish.mockRejectedValueOnce(new Error('finish displayed'))
    await expect(store.passkeyLogin()).resolves.toBe(false)

    expect(message.error).not.toHaveBeenCalled()
    expect(auth.setToken).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('preserves successful Store to page save, success message, and redirect', async () => {
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get: vi.fn().mockResolvedValue({}) } })
    passkeyApi.finish.mockResolvedValue({ data: user })
    const { wrapper } = mountLogin()
    await flushPromises()

    const button = wrapper.get('[data-test="passkey-login"]')
    await button.trigger('click')
    await flushPromises()

    expect(passkeyApi.finish).toHaveBeenCalledOnce()
    expect(auth.setToken).toHaveBeenCalledWith('token')
    expect(message.success).toHaveBeenCalledOnce()
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('ignores a concurrent login click while a ceremony is active', async () => {
    let resolveCredential!: (value: PublicKeyCredential | null) => void
    const credentialPromise = new Promise<PublicKeyCredential | null>((resolve) => { resolveCredential = resolve })
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get: vi.fn(() => credentialPromise) },
    })
    const { wrapper } = mountLogin()
    await flushPromises()
    const button = wrapper.get('[data-test="passkey-login"]')

    const firstClick = button.trigger('click')
    await vi.waitFor(() => expect(passkeyApi.begin).toHaveBeenCalledOnce())
    await button.trigger('click')
    expect(passkeyApi.begin).toHaveBeenCalledOnce()
    resolveCredential(null)
    await firstClick
    await flushPromises()
  })

  it('shows a sanitized local error when request option parsing fails', async () => {
    passkeyApi.begin.mockResolvedValue({ data: { challenge_id: 'challenge', public_key: { challenge: '*' } } })
    const { wrapper } = mountLogin()
    await flushPromises()

    await wrapper.get('[data-test="passkey-login"]').trigger('click')
    await flushPromises()

    expect(message.error).toHaveBeenCalledOnce()
    expect(message.error).toHaveBeenCalledWith('通行密钥登录失败')
    expect(passkeyApi.finish).not.toHaveBeenCalled()
  })
})
