import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, DeviceGroup } from '@/types'

const adminRequest = createAdminRequest()

export interface DeviceGroupForm {
  id?: number
  name: string
}

export function list(params: {
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageResult<DeviceGroup>>> {
  return adminRequest.get('/device_group/list', { params })
}

export function detail(id: number): Promise<ApiResponse<DeviceGroup>> {
  return adminRequest.get(`/device_group/detail/${id}`)
}

export function create(data: DeviceGroupForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/device_group/create', data)
}

export function update(data: DeviceGroupForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/device_group/update', data)
}

export function deleteDeviceGroup(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/device_group/delete', data)
}
