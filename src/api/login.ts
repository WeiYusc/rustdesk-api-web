import request from '@/utils/request'
import type {
  ApiResponse,
  CaptchaResponse,
  LoginOptionsResponse,
  OidcAuthResponse,
  UserInfo,
} from '@/types'

export function login(data: {
  username: string
  password: string
  captcha_id?: string
  captcha?: string
  platform?: string
}): Promise<ApiResponse<UserInfo>> {
  return request.post('/login', data)
}

export function loginOptions(): Promise<ApiResponse<LoginOptionsResponse>> {
  return request.get('/login-options')
}

export function captcha(): Promise<ApiResponse<CaptchaResponse>> {
  return request.get('/captcha')
}

export function requestForgotPassword(data: {
  email: string
}): Promise<ApiResponse<{ ok: boolean }>> {
  return request.post('/forgot-password/request', data)
}

export function resetForgotPassword(data: {
  token: string
  password: string
  confirm_password: string
}): Promise<ApiResponse<{ ok: boolean }>> {
  return request.post('/forgot-password/reset', data)
}

export function logout(): Promise<ApiResponse<null>> {
  return request.post('/logout')
}

export function oidcAuth(data: {
  op: string
  id: string
  uuid: string
  deviceInfo: {
    name: string
    os: string
    type: string
  }
}): Promise<ApiResponse<OidcAuthResponse>> {
  return request.post('/oidc/auth', data)
}

export function oidcQuery(params: {
  code: string
  uuid: string
}): Promise<ApiResponse<UserInfo>> {
  return request.get('/oidc/auth-query', { params })
}
