import { createAdminRequest } from '@/utils/request'
import type { ApiResponse, PageResult, ServerCmd } from '@/types'

const adminRequest = createAdminRequest()

export interface SendCmdForm {
  cmd: string
  option?: string
  target: string
}

export interface ServerCmdForm {
  id?: number
  cmd: string
  alias?: string
  option?: string
  explain?: string
  target?: string
}

export function sendCmd(data: SendCmdForm): Promise<ApiResponse<string>> {
  return adminRequest.post('/rustdesk/sendCmd', data)
}

export function cmdList(params: {
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageResult<ServerCmd>>> {
  return adminRequest.get('/rustdesk/cmdList', { params })
}

export function cmdDelete(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/rustdesk/cmdDelete', data)
}

export function cmdCreate(data: ServerCmdForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/rustdesk/cmdCreate', data)
}

export function cmdUpdate(data: ServerCmdForm & { id: number }): Promise<ApiResponse<null>> {
  return adminRequest.post('/rustdesk/cmdUpdate', data)
}
