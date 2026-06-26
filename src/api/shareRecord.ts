import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, ShareRecord } from '@/types'

const adminRequest = createAdminRequest()

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
}): Promise<ApiResponse<PageResult<ShareRecord>>> {
  return adminRequest.get('/share_record/list', { params })
}

export function deleteShareRecord(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/share_record/delete', data)
}

export function batchDelete(data: {
  ids: number[]
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/share_record/batchDelete', data)
}
