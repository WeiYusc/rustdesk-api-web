import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export function sendEmailVerification(data: Record<string, never>): Promise<ApiResponse<null>> {
  return request.post('/email/verification/send', data)
}

export function confirmEmailVerification(data: {
  code: string
}): Promise<ApiResponse<null>> {
  return request.post('/email/verification/confirm', data)
}

export function beginEmailChange(data: {
  email: string
}): Promise<ApiResponse<null>> {
  return request.post('/email/change/begin', data)
}

export function confirmEmailChange(data: {
  email: string
  code: string
}): Promise<ApiResponse<null>> {
  return request.post('/email/change/confirm', data)
}
