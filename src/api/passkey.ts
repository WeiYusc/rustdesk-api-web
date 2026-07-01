import { createAdminRequest } from '@/utils/request'
import request from '@/utils/request'
import type { ApiResponse, UserInfo } from '@/types'
import type { PublicKeyCredentialJSON } from '@/types/webauthn'

const adminRequest = createAdminRequest()

export function passkeyLoginBegin(): Promise<ApiResponse<{ challenge_id: string; public_key: Record<string, unknown> }>> {
  return request.post('/passkey/login/begin', {})
}

export function passkeyLoginFinish(data: {
  challenge_id: string
  credential: PublicKeyCredentialJSON
  platform?: string
}): Promise<ApiResponse<UserInfo>> {
  return request.post('/passkey/login/finish', data)
}

export function passkeyList(): Promise<ApiResponse<unknown[]>> {
  return adminRequest.get('/passkey/list')
}

export function passkeyRegisterBegin(data: {
  name: string
}): Promise<ApiResponse<{ challenge_id: string; public_key: Record<string, unknown> }>> {
  return adminRequest.post('/passkey/register/begin', data)
}

export function passkeyRegisterFinish(data: {
  challenge_id: string
  name: string
  credential: PublicKeyCredentialJSON
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/passkey/register/finish', data)
}

export function passkeyRename(data: {
  id: number
  name: string
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/passkey/rename', data)
}

export function passkeyDelete(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/passkey/delete', data)
}
