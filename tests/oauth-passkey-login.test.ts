import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

const userStore = vi.hoisted(() => ({
  username: '',
  info: vi.fn(),
  login: vi.fn(),
  passkeyLogin: vi.fn(),
}))
const api = vi.hoisted(() => ({ options: vi.fn(), captcha: vi.fn(), confirm: vi.fn() }))
const route = vi.hoisted(() => ({ params: { code: 'oauth-code' } }))

vi.mock('@/stores/user', () => ({ useUserStore: () => userStore }))
vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    t: (key: string) =>
      (
        ({
          'login.passkeySecurityError': '页面来源或安全策略无效，无法使用通行密钥登录',
          'login.noLoginMethod': 'no method',
          'login.noAccess': 'no access',
          'oauth.clientAuthTitle': 'title',
          'oauth.clientAuthDesc': 'desc',
          'oauth.clientAuthPasskeyLogin': 'passkey',
        }) as Record<string, string>
      )[key] || key,
  }),
}))
vi.mock('@/api/login', () => ({ loginOptions: api.options, captcha: api.captcha }))
vi.mock('@/api/oauth', () => ({ confirm: api.confirm }))
vi.mock('@/utils/auth', () => ({ getToken: () => null }))
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('naive-ui', () => {
  const button = defineComponent({
    inheritAttrs: false,
    props: { loading: Boolean },
    emits: ['click'],
    template:
      '<button v-bind="$attrs" :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
  })
  const passthrough = defineComponent({ template: '<div><slot /></div>' })
  return {
    NButton: button,
    NCard: passthrough,
    NSpin: passthrough,
    NText: passthrough,
    NSpace: passthrough,
    NForm: passthrough,
    NFormItem: passthrough,
    NInput: passthrough,
    NAlert: passthrough,
    NImage: passthrough,
  }
})

import { WebAuthnBrowserError } from '@/utils/webauthn'
import OauthLogin from '@/views/oauth/OauthLogin.vue'

function mountOauthLogin() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(OauthLogin, { global: { plugins: [pinia] } })
}

describe('OauthLogin passkey entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStore.username = ''
    api.options.mockResolvedValue({
      data: {
        disable_pwd: true,
        register: false,
        ops: [],
        need_captcha: false,
        auto_oidc: false,
        passkey_enabled: true,
        passkey_discoverable_login_enabled: true,
      },
    })
  })

  it('guards concurrent clicks while passkey login is active', async () => {
    let resolve!: (value: false) => void
    userStore.passkeyLogin.mockReturnValue(
      new Promise((r) => {
        resolve = r
      })
    )
    const wrapper = mountOauthLogin()
    await flushPromises()
    const button = wrapper.get('[data-test="oauth-passkey-login"]')

    const first = button.trigger('click')
    await vi.waitFor(() => expect(userStore.passkeyLogin).toHaveBeenCalledOnce())
    await button.trigger('click')
    expect(userStore.passkeyLogin).toHaveBeenCalledOnce()
    resolve(false)
    await first
    await flushPromises()
    expect(wrapper.text()).not.toContain('no access')
    expect(api.confirm).not.toHaveBeenCalled()
  })

  it('shows the classified sanitized browser error from the branded boundary', async () => {
    userStore.passkeyLogin.mockRejectedValue(
      new WebAuthnBrowserError('mySecurity.passkeySecurityError')
    )
    const wrapper = mountOauthLogin()
    await flushPromises()

    await wrapper.get('[data-test="oauth-passkey-login"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('页面来源或安全策略无效，无法使用通行密钥登录')
    expect(api.confirm).not.toHaveBeenCalled()
  })

  it('leaves API-owned false results without inventing a page error', async () => {
    userStore.passkeyLogin.mockResolvedValue(false)
    const wrapper = mountOauthLogin()
    await flushPromises()

    await wrapper.get('[data-test="oauth-passkey-login"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('no access')
    expect(wrapper.text()).not.toContain('通行密钥登录失败')
    expect(api.confirm).not.toHaveBeenCalled()
  })

  it('confirms the OAuth code once after a successful passkey login and restores loading', async () => {
    userStore.passkeyLogin.mockResolvedValue({ id: 1 })
    api.confirm.mockResolvedValue({ data: null })
    const wrapper = mountOauthLogin()
    await flushPromises()
    const button = wrapper.get('[data-test="oauth-passkey-login"]')

    await button.trigger('click')
    await flushPromises()

    expect(userStore.passkeyLogin).toHaveBeenCalledOnce()
    expect(api.confirm).toHaveBeenCalledOnce()
    expect(api.confirm).toHaveBeenCalledWith({ code: 'oauth-code' })
    expect(wrapper.text()).toContain('oauth.clientAuthSuccess')
    expect(button.attributes('loading')).toBeUndefined()
  })
})
