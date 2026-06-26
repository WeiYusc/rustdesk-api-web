import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, LoginLog } from '@/types'

const adminRequest = createAdminRequest()

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
  is_my?: number
}): Promise<ApiResponse<PageResult<LoginLog>>> {
  return adminRequest.get('/login_log/list', { params })
}

export function deleteLoginLog(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/login_log/delete', data)
}

export function batchDelete(data: {
  ids: number[]
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/login_log/batchDelete', data)
}
