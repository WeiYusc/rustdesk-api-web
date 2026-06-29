import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, Tag } from '@/types'

const adminRequest = createAdminRequest()

export interface TagForm {
  id?: number
  name: string
  color: number
  user_id?: number
  collection_id?: number
}

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
  is_my?: number
  collection_id?: number
}): Promise<ApiResponse<PageResult<Tag>>> {
  return adminRequest.get('/tag/list', { params })
}

export function detail(id: number): Promise<ApiResponse<Tag>> {
  return adminRequest.get(`/tag/detail/${id}`)
}

export function create(data: TagForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/tag/create', data)
}

export function update(data: TagForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/tag/update', data)
}

export function deleteTag(data: { id: number }): Promise<ApiResponse<null>> {
  return adminRequest.post('/tag/delete', data)
}

export function batchDelete(data: { ids: number[] }): Promise<ApiResponse<null>> {
  return adminRequest.post('/tag/batchDelete', data)
}
