import request from '@/utils/request'
import type {
  ApiResponse,
  PageResult,
  AddressBookCollection,
} from '@/types'

export interface AddressBookCollectionForm {
  id?: number
  name: string
  user_id?: number
}

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
  is_my?: number
}): Promise<ApiResponse<PageResult<AddressBookCollection>>> {
  return request.get('/my/address_book_collection/list', { params })
}

export function listShared(params: {
  page?: number
  page_size?: number
  user_id?: number
  is_my?: number
}): Promise<ApiResponse<PageResult<AddressBookCollection>>> {
  return request.get('/my/address_book_collection/list_shared', { params })
}

export function create(
  data: AddressBookCollectionForm,
): Promise<ApiResponse<null>> {
  return request.post('/my/address_book_collection/create', data)
}

export function update(
  data: AddressBookCollectionForm,
): Promise<ApiResponse<null>> {
  return request.post('/my/address_book_collection/update', data)
}

export function deleteCollection(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return request.post('/my/address_book_collection/delete', data)
}
