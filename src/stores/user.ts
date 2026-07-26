import { defineStore } from 'pinia'
import { ref } from 'vue'
import { current } from '@/api/user'
import { login as loginApi, oidcAuth, oidcQuery, logout as logoutApi } from '@/api/login'
import { setToken, removeToken, setCode, getCode, removeCode, clearWcConfig } from '@/utils/auth'
import { useRouteStore } from '@/stores/router'
import { useAppStore } from '@/stores/app'
import { useTagsStore } from '@/stores/tags'
import type { UserInfo } from '@/types'
import { detectPlatform } from '@/utils/platform'

function validateOidcUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const useUserStore = defineStore('user', () => {
  const username = ref('')
  const email = ref('')
  const avatar = ref('')
  const token = ref('')
  const nickname = ref('')
  const routeNames = ref<string[]>([])
  const emailVerifiedAt = ref('')

  function saveUserData(userData: UserInfo): void {
    setToken(userData.token)
    username.value = userData.username
    email.value = userData.email
    avatar.value = userData.avatar
    nickname.value = userData.nickname
    token.value = userData.token
    emailVerifiedAt.value = userData.email_verified_at || ''
    routeNames.value = userData.route_names || []
    useRouteStore().addRoutes(routeNames.value)
  }

  async function login(form: {
    username: string
    password: string
    captcha_id?: string
    captcha?: string
  }): Promise<UserInfo> {
    const res = await loginApi({
      ...form,
      platform: detectPlatform(),
    })
    useAppStore().initConfig()
    saveUserData(res.data)
    return res.data
  }

  async function info(): Promise<UserInfo | false> {
    try {
      const res = await current()
      if (res.data) {
        useAppStore().initConfig()
        setToken(res.data.token)
        username.value = res.data.username
        email.value = res.data.email
        avatar.value = res.data.avatar
        nickname.value = res.data.nickname
        token.value = res.data.token
        emailVerifiedAt.value = res.data.email_verified_at || ''
        routeNames.value = res.data.route_names || []
        useRouteStore().addRoutes(routeNames.value)
        return res.data
      }
      return false
    } catch {
      return false
    }
  }

  async function oidc(provider: string): Promise<void> {
    const platform = detectPlatform()
    const data = {
      op: provider,
      id: `${platform}-browser`,
      uuid: '',
      deviceInfo: {
        name: navigator.userAgent,
        os: platform,
        type: 'webadmin',
      },
    }
    const res = await oidcAuth(data)
    if (!validateOidcUrl(res.data.url)) {
      throw new Error('Invalid OIDC redirect URL')
    }
    setCode(res.data.code)
    if (provider === 'webauth') {
      window.open(res.data.url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = res.data.url
    }
  }

  async function queryOidc(code: string): Promise<UserInfo | false> {
    const params = { code, uuid: '' }
    const res = await oidcQuery(params)
    removeCode()
    useAppStore().initConfig()
    saveUserData(res.data)
    return res.data
  }

  async function passkeyLogin(): Promise<UserInfo | false> {
    try {
      const { passkeyLoginBegin, passkeyLoginFinish } = await import('@/api/passkey')
      const { getWebAuthnErrorKey, parseRequestOptions, serializeCredential } = await import('@/utils/webauthn')
      const beginRes = await passkeyLoginBegin()
      let publicKey: ReturnType<typeof parseRequestOptions>
      try {
        publicKey = parseRequestOptions(beginRes.data.public_key as never)
      } catch {
        throw { webAuthnErrorKey: 'mySecurity.passkeyUnknownError' }
      }
      let credential: PublicKeyCredential | null
      try {
        credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential | null
      } catch (error) {
        throw { webAuthnErrorKey: getWebAuthnErrorKey(error) }
      }
      if (!credential) return false
      const serialized = serializeCredential(credential)
      const res = await passkeyLoginFinish({
        challenge_id: beginRes.data.challenge_id,
        credential: serialized,
        platform: detectPlatform(),
      })
      useAppStore().initConfig()
      saveUserData(res.data)
      return res.data
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'webAuthnErrorKey' in error) throw error
      return false
    }
  }

  function logout(): void {
    logoutApi().catch(() => {})
    removeToken()
    removeCode()
    clearWcConfig()
    token.value = ''
    username.value = ''
    email.value = ''
    avatar.value = ''
    nickname.value = ''
    routeNames.value = []
    useRouteStore().clearRoutes()
    useTagsStore().clearTags()
    useAppStore().configLoaded = false
    useAppStore().adminConfig = { title: 'RustDesk API Admin' }
    useAppStore().serverConfig = null
  }

  function getStoredOidcCode(): string | null {
    return getCode()
  }

  return {
    username,
    email,
    avatar,
    token,
    nickname,
    routeNames,
    emailVerifiedAt,
    saveUserData,
    login,
    info,
    oidc,
    queryOidc,
    passkeyLogin,
    logout,
    getStoredOidcCode,
  }
})
