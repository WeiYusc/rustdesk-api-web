import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { getToken, removeToken } from '@/utils/auth'
import type { ApiResponse } from '@/types'

interface ExtendedRequestConfig extends AxiosRequestConfig {
  _adminOnly?: boolean
}

const service: AxiosInstance = axios.create({
  baseURL: '/api/admin',
  timeout: 50000,
  withCredentials: true,
})

function getLang(): string {
  try {
    const appStore = useAppStore()
    return appStore.locale || 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

function needCaptchaCallback(code: number): void {
  if (code !== 110) return
  const event = new CustomEvent('need-captcha')
  window.dispatchEvent(event)
}

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token: string | null
    try {
      const userStore = useUserStore()
      token = userStore.token || getToken()
    } catch {
      token = getToken()
    }
    if (token) {
      config.headers['api-token'] = token
    }
    config.headers['Accept-Language'] = getLang()
    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    const ext = response.config as ExtendedRequestConfig

    if (res.code === 0) {
      return res as unknown as typeof response
    }

    if (res.code === 403) {
      if (ext._adminOnly) {
        showError(res.message)
        return Promise.reject(res)
      }
      removeToken()
      const redirect = window.location.hash.replace('#', '')
      if (!redirect.startsWith('/login')) {
        window.location.hash = '#/login'
      }
      return Promise.reject(res)
    }

    if (res.code === 110) {
      needCaptchaCallback(res.code)
      return Promise.reject(res)
    }

    showError(res.message)
    return Promise.reject(res)
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        removeToken()
        window.location.hash = '#/login'
      } else if (status === 400) {
        const msg = error.response.data?.error || error.message
        showError(msg)
      } else {
        showError(error.message)
      }
    } else if (
      error.code === 'ECONNABORTED' &&
      error.message.indexOf('timeout') > -1
    ) {
      showError('Connection Time Out!')
    } else {
      showError(error.message)
    }
    return Promise.reject(error)
  },
)

let messageInstance: { error: (msg: string) => void } | null = null

export function registerErrorHandler(handler: {
  error: (msg: string) => void
}): void {
  messageInstance = handler
}

function showError(msg: string): void {
  if (messageInstance) {
    messageInstance.error(msg)
  }
}

export function createAdminRequest(): AxiosInstance {
  const instance = axios.create({
    baseURL: '/api/admin',
    timeout: 50000,
    withCredentials: true,
  })

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const ext = config as InternalAxiosRequestConfig & ExtendedRequestConfig
      ext._adminOnly = true
      let token: string | null
      try {
        const userStore = useUserStore()
        token = userStore.token || getToken()
      } catch {
        token = getToken()
      }
      if (token) {
        config.headers['api-token'] = token
      }
      config.headers['Accept-Language'] = getLang()
      return config
    },
    (error) => Promise.reject(error),
  )

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const res = response.data
      if (res.code === 0) {
        return res as unknown as typeof response
      }
      if (res.code === 403) {
        showError(res.message)
        return Promise.reject(res)
      }
      if (res.code === 110) {
        needCaptchaCallback(res.code)
        return Promise.reject(res)
      }
      showError(res.message)
      return Promise.reject(res)
    },
    (error) => {
      if (error.response) {
        const status = error.response.status
        if (status === 401) {
          removeToken()
          window.location.hash = '#/login'
        } else {
          const msg = error.response.data?.error || error.message
          showError(msg)
        }
      } else {
        showError(error.message)
      }
      return Promise.reject(error)
    },
  )

  return instance
}

export default service
export type { ExtendedRequestConfig }
