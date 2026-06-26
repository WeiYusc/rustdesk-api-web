import request from '@/utils/request'
import type { ApiResponse, PageResult, LoginLog } from '@/types'

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
  is_my?: number
}): Promise<ApiResponse<PageResult<LoginLog>>> {
  return request.get('/my/login_log/list', { params })
}

export function deleteLoginLog(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return request.post('/my/login_log/delete', data)
}

export function batchDelete(data: {
  ids: number[]
}): Promise<ApiResponse<null>> {
  return request.post('/my/login_log/batchDelete', data)
}
