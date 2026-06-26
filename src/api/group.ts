import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, Group } from '@/types'

const adminRequest = createAdminRequest()

export interface GroupForm {
  id?: number
  name: string
  type?: number
}

export function list(params: {
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageResult<Group>>> {
  return adminRequest.get('/group/list', { params })
}

export function detail(id: number): Promise<ApiResponse<Group>> {
  return adminRequest.get(`/group/detail/${id}`)
}

export function create(data: GroupForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/group/create', data)
}

export function update(data: GroupForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/group/update', data)
}

export function deleteGroup(data: { id: number }): Promise<ApiResponse<null>> {
  return adminRequest.post('/group/delete', data)
}
