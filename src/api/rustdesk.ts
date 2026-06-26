import request from '@/utils/request'
import type { ApiResponse, PageResult, ServerCmd } from '@/types'

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
  return request.post('/rustdesk/sendCmd', data)
}

export function cmdList(params: {
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageResult<ServerCmd>>> {
  return request.get('/rustdesk/cmdList', { params })
}

export function cmdDelete(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return request.post('/rustdesk/cmdDelete', data)
}

export function cmdCreate(data: ServerCmdForm): Promise<ApiResponse<null>> {
  return request.post('/rustdesk/cmdCreate', data)
}
