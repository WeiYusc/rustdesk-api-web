import request from '@/utils/request'
import { createAdminRequest } from '@/utils/request'
import type {
  ApiResponse,
  UserInfo,
  UserOauthItem,
  PageResult,
  AdminUser,
} from '@/types'

const adminRequest = createAdminRequest()

export interface UserForm {
  id?: number
  username: string
  password?: string
  email?: string
  nickname?: string
  avatar?: string
  group_id: number
  is_admin?: boolean | null
  status: number
  remark?: string
}

export function current(): Promise<ApiResponse<UserInfo>> {
  return request.get('/user/current')
}

export function changeCurPwd(data: {
  old_password: string
  new_password: string
}): Promise<ApiResponse<null>> {
  return request.post('/user/changeCurPwd', data)
}

export function myOauth(): Promise<ApiResponse<UserOauthItem[]>> {
  return request.post('/user/myOauth')
}

export function register(data: {
  username: string
  password: string
  confirm_password: string
  email?: string
}): Promise<ApiResponse<UserInfo | null>> {
  return request.post('/user/register', data)
}

export function groupUsers(data: {
  group_id: number
}): Promise<ApiResponse<unknown>> {
  return request.post('/user/groupUsers', data)
}

export function list(params: {
  page?: number
  page_size?: number
  username?: string
}): Promise<ApiResponse<PageResult<AdminUser>>> {
  return adminRequest.get('/user/list', { params })
}

export function detail(id: number): Promise<ApiResponse<AdminUser>> {
  return adminRequest.get(`/user/detail/${id}`)
}

export function createUser(data: UserForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/user/create', data)
}

export function updateUser(data: UserForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/user/update', data)
}

export function deleteUser(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/user/delete', data)
}

export function changePwd(data: {
  id: number
  password: string
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/user/changePwd', data)
}
