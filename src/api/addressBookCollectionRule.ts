import { createAdminRequest } from '@/utils/request'
import type {
  ApiResponse,
  PageResult,
  AddressBookCollectionRule,
} from '@/types'

const adminRequest = createAdminRequest()

export interface AddressBookCollectionRuleForm {
  id?: number
  user_id?: number
  collection_id: number
  rule: number
  type: number
  to_id: number
}

export function list(params: {
  page?: number
  page_size?: number
  user_id?: number
  collection_id?: number
  is_my?: number
}): Promise<ApiResponse<PageResult<AddressBookCollectionRule>>> {
  return adminRequest.get('/address_book_collection_rule/list', { params })
}

export function detail(
  id: number,
): Promise<ApiResponse<AddressBookCollectionRule>> {
  return adminRequest.get(`/address_book_collection_rule/detail/${id}`)
}

export function create(
  data: AddressBookCollectionRuleForm,
): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book_collection_rule/create', data)
}

export function update(
  data: AddressBookCollectionRuleForm,
): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book_collection_rule/update', data)
}

export function deleteRule(data: {
  id: number
}): Promise<ApiResponse<null>> {
  return adminRequest.post('/address_book_collection_rule/delete', data)
}
