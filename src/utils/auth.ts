const TOKEN_KEY = 'access_token'
const OIDC_CODE_KEY = 'oidc_code'
const OIDC_CODE_EXPIRY_KEY = 'oidc_code_expiry'
const WC_PREFIX = 'wc-'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(`${WC_PREFIX}option:local:access_token`, token)
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(`${WC_PREFIX}option:local:access_token`)
}

export function setCode(code: string): void {
  const now = Date.now()
  const expiry = now + 60 * 1000
  localStorage.setItem(OIDC_CODE_KEY, code)
  localStorage.setItem(OIDC_CODE_EXPIRY_KEY, String(expiry))
}

export function getCode(): string | null {
  const expiry = localStorage.getItem(OIDC_CODE_EXPIRY_KEY)
  const now = Date.now()
  if (expiry && now > parseInt(expiry, 10)) {
    removeCode()
    return null
  }
  return localStorage.getItem(OIDC_CODE_KEY)
}

export function removeCode(): void {
  localStorage.removeItem(OIDC_CODE_KEY)
  localStorage.removeItem(OIDC_CODE_EXPIRY_KEY)
}

export function setWcConfig(config: {
  id_server: string
  key: string
  api_server: string
}): void {
  localStorage.setItem(`${WC_PREFIX}custom-rendezvous-server`, config.id_server)
  localStorage.setItem(`${WC_PREFIX}key`, config.key)
  localStorage.setItem(`${WC_PREFIX}api-server`, config.api_server)
}

export function getWcPrefix(): string {
  return WC_PREFIX
}
