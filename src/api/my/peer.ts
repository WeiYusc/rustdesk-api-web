import request from '@/utils/request'
import type { ApiResponse, PageResult, Peer } from '@/types'

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
  return request.get('/my/peer/list', { params })
}
