import request from '@/utils/request'
import type { ApiResponse, PageResult, ShareRecord } from '@/types'

export function list(params: {
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageResult<ShareRecord>>> {
  return request.get('/my/share_record/list', { params })
}

export function deleteShareRecord(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return request.post('/my/share_record/delete', data)
}

export function batchDelete(data: {
  ids: number[]
}): Promise<ApiResponse<null>> {
  return request.post('/my/share_record/batchDelete', data)
}
