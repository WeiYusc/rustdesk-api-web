import { createAdminRequest } from '@/utils/request'
import type {
  ApiResponse,
  PageResult,
  AuditConn,
  AuditFile,
} from '@/types'

const adminRequest = createAdminRequest()

export function connList(params: {
  page?: number
  page_size?: number
  peer_id?: string
  from_peer?: string
}): Promise<ApiResponse<PageResult<AuditConn>>> {
  return adminRequest.get('/audit_conn/list', { params })
}

export function connDelete(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/audit_conn/delete', data)
}

export function connBatchDelete(data: {
  ids: number[]
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/audit_conn/batchDelete', data)
}

export function fileList(params: {
  page?: number
  page_size?: number
  peer_id?: string
  from_peer?: string
}): Promise<ApiResponse<PageResult<AuditFile>>> {
  return adminRequest.get('/audit_file/list', { params })
}

export function fileDelete(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/audit_file/delete', data)
}

export function fileBatchDelete(data: {
  ids: number[]
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/audit_file/batchDelete', data)
}
