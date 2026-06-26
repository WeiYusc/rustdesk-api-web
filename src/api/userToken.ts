import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, UserToken } from '@/types'

const adminRequest = createAdminRequest()

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
}): Promise<ApiResponse<PageResult<UserToken>>> {
  return adminRequest.get('/user_token/list', { params })
}

export function deleteUserToken(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/user_token/delete', data)
}

export function batchDelete(data: {
  ids: number[]
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/user_token/batchDelete', data)
}
