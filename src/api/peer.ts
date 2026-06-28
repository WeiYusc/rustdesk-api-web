import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, Peer } from '@/types'

const adminRequest = createAdminRequest()

export interface PeerForm {
  row_id?: number
  id?: string
  cpu?: string
  hostname?: string
  memory?: string
  os?: string
  username?: string
  uuid?: string
  version?: string
  group_id?: number
  alias?: string
}

export function list(params: {
  page?: number
  page_size?: number
  time_ago?: number
  id?: string
  hostname?: string
  uuids?: string
  ip?: string
  username?: string
  alias?: string
}): Promise<ApiResponse<PageResult<Peer>>> {
  return adminRequest.get('/peer/list', { params })
}

export function detail(id: number): Promise<ApiResponse<Peer>> {
  return adminRequest.get(`/peer/detail/${id}`)
}

export function create(data: PeerForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/peer/create', data)
}

export function update(data: PeerForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/peer/update', data)
}

export function deletePeer(data: {
  row_id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/peer/delete', data)
}

export function batchDelete(data: {
  row_ids: number[]
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/peer/batchDelete', data)
}

export function simpleData(data: {
  ids: string[]
}): Promise<ApiResponse<PageResult<Peer>>> {
  return adminRequest.post('/peer/simpleData', data)
}
