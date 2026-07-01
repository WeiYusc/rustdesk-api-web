import request from '@/utils/request'
import type { ApiResponse, SmtpSettings, EmailVerificationSettings, PasskeySettings, AuthPolicySettings } from '@/types'

export function getSmtpSettings(): Promise<ApiResponse<SmtpSettings>> {
  return request.get('/settings/smtp')
}

export function saveSmtpSettings(data: SmtpSettings): Promise<ApiResponse<null>> {
  return request.post('/settings/smtp', data)
}

export function testSmtpSend(data: { to: string }): Promise<ApiResponse<null>> {
  return request.post('/settings/smtp/test', data)
}

export function getEmailVerificationSettings(): Promise<ApiResponse<EmailVerificationSettings>> {
  return request.get('/settings/email-verification')
}

export function saveEmailVerificationSettings(data: EmailVerificationSettings): Promise<ApiResponse<null>> {
  return request.post('/settings/email-verification', data)
}

export function getPasskeySettings(): Promise<ApiResponse<PasskeySettings>> {
  return request.get('/settings/passkey')
}

export function savePasskeySettings(data: PasskeySettings): Promise<ApiResponse<null>> {
  return request.post('/settings/passkey', data)
}

export function getAuthPolicySettings(): Promise<ApiResponse<AuthPolicySettings>> {
  return request.get('/settings/auth')
}

export function saveAuthPolicySettings(data: AuthPolicySettings): Promise<ApiResponse<null>> {
  return request.post('/settings/auth', data)
}
