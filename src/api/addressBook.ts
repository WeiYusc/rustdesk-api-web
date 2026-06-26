import request from '@/utils/request'
import { createAdminRequest } from '@/utils/request'
import type {
  ApiResponse,
  PageResult,
  AddressBook,
  ShareByWebClientResult,
} from '@/types'

const adminRequest = createAdminRequest()

export interface AddressBookForm {
  row_id?: number
  id: string
  username?: string
  password?: string
  hostname?: string
  alias?: string
  platform?: string
  tags?: string[]
  hash?: string
  user_id?: number
  user_ids?: number[]
  forceAlwaysRelay?: boolean
  rdpPort?: string
  rdpUsername?: string
  online?: boolean
  loginName?: string
  sameServer?: boolean
  collection_id?: number
}

export interface BatchCreateFromPeersForm {
  collection_id?: number
  peer_ids: number[]
  tags?: string[]
  user_id: number
}

export interface ShareByWebClientForm {
  id: string
  password_type: string
  password: string
  expire?: number
}

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
  collection_id?: number
  is_my?: number
  username?: string
  hostname?: string
  id?: string
  alias?: string
}): Promise<ApiResponse<PageResult<AddressBook>>> {
  return adminRequest.get('/address_book/list', { params })
}

export function create(data: AddressBookForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book/create', data)
}

export function update(data: AddressBookForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book/update', data)
}

export function deleteAddressBook(data: {
  row_id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book/delete', data)
}

export function batchCreate(data: AddressBookForm): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book/batchCreate', data)
}

export function batchCreateFromPeers(
  data: BatchCreateFromPeersForm,
): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book/batchCreateFromPeers', data)
}

export function shareByWebClient(
  data: ShareByWebClientForm,
): Promise<ApiResponse<ShareByWebClientResult>> {
  return request.post('/address_book/shareByWebClient', data)
}
