import request from '@/utils/request'
import { createAdminRequest } from '@/utils/request'
import type {
  ApiResponse,
  PageResult,
  Oauth,
  OauthCacheItem,
  OauthBindResult,
} from '@/types'

const adminRequest = createAdminRequest()

export interface OauthForm {
  id?: number
  op?: string
  oauth_type: string
  issuer?: string
  scopes?: string
  client_id: string
  client_secret?: string
  auto_register?: boolean | null
  pkce_enable?: boolean | null
  pkce_method?: string
}

export function list(params: {
  page?: number
  page_size?: number
}): Promise<ApiResponse<PageResult<Oauth>>> {
  return adminRequest.get('/oauth/list', { params })
}

export function detail(id: number): Promise<ApiResponse<Oauth>> {
  return adminRequest.get(`/oauth/detail/${id}`)
}

export function create(data: OauthForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/oauth/create', data)
}

export function update(data: OauthForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/oauth/update', data)
}

export function deleteOauth(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/oauth/delete', data)
}

export function confirm(data: {
  code: string
}): Promise<ApiResponse<OauthCacheItem>> {
  return request.post('/oauth/confirm', data)
}

export function bind(data: {
  op: string
}): Promise<ApiResponse<OauthBindResult>> {
  return request.post('/oauth/bind', data)
}

export function bindConfirm(data: {
  code: string
}): Promise<ApiResponse<OauthCacheItem>> {
  return request.post('/oauth/bindConfirm', data)
}

export function unbind(data: {
  op: string
}): Promise<ApiResponse<null>> {
  return request.post('/oauth/unbind', data)
}

export function info(params: {
  code: string
}): Promise<ApiResponse<OauthCacheItem>> {
  return request.get('/oauth/info', { params })
}
