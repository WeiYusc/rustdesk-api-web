import request from '@/utils/request'
import type { ApiResponse, PageResult, Tag } from '@/types'

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
  return request.get('/my/tag/list', { params })
}

export function create(data: TagForm): Promise<ApiResponse<null>> {
  return request.post('/my/tag/create', data)
}

export function update(data: TagForm): Promise<ApiResponse<null>> {
  return request.post('/my/tag/update', data)
}

export function deleteTag(data: { id: number }): Promise<ApiResponse<null>> {
  return request.post('/my/tag/delete', data)
}
