export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export interface PaginatedList<T> {
  list: T[]
  total: number
  page?: number
  pageSize?: number
}

export interface UserInfo {
  username: string
  email: string
  avatar: string
  token: string
  route_names: string[]
  nickname: string
}

export interface LoginOptionsResponse {
  ops: string[]
  register: boolean
  need_captcha: boolean
  disable_pwd: boolean
  auto_oidc: boolean
}

export interface ServerConfig {
  id_server: string
  key: string
  relay_server: string
  api_server: string
}

export interface AdminConfig {
  title: string
  hello?: string
}

export interface AppConfig {
  web_client: number
}

export interface CaptchaResponse {
  captcha: {
    id: string
    b64: string
  }
}

export interface OidcAuthResponse {
  code: string
  url: string
}

export interface UserOauthItem {
  op: string
  status: number
}

export interface PageResult<T> {
  list: T[]
  page: number
  total: number
  page_size: number
}

export interface AdminUser {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  group_id: number
  is_admin: boolean | null
  status: number
  remark: string
  created_at: string
  updated_at: string
}

export interface Peer {
  row_id: number
  id: string
  cpu: string
  hostname: string
  memory: string
  os: string
  username: string
  uuid: string
  version: string
  user_id: number
  user?: AdminUser
  last_online_time: number
  last_online_ip: string
  group_id: number
  alias: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  user_id: number
  color: number
  collection_id: number
  collection?: AddressBookCollection
  created_at: string
  updated_at: string
}

export interface AddressBook {
  row_id: number
  id: string
  username: string
  password: string
  hostname: string
  alias: string
  platform: string
  tags: string[]
  hash: string
  user_id: number
  forceAlwaysRelay: boolean
  rdpPort: string
  rdpUsername: string
  online: boolean
  loginName: string
  sameServer: boolean
  collection_id: number
  collection?: AddressBookCollection
  created_at: string
  updated_at: string
}

export interface AddressBookCollection {
  id: number
  user_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface AddressBookCollectionRule {
  id: number
  user_id: number
  collection_id: number
  rule: number
  type: number
  to_id: number
  created_at: string
  updated_at: string
}

export interface Group {
  id: number
  name: string
  type: number
  created_at: string
  updated_at: string
}

export interface DeviceGroup {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Oauth {
  id: number
  op: string
  oauth_type: string
  client_id: string
  client_secret: string
  auto_register: boolean | null
  scopes: string
  issuer: string
  pkce_enable: boolean | null
  pkce_method: string
  created_at: string
  updated_at: string
}

export interface OauthCacheItem {
  user_id: number
  id: string
  op: string
  action: string
  uuid: string
  device_name: string
  device_os: string
  device_type: string
  open_id: string
  username: string
  name: string
  email: string
  verifier: string
  nonce: string
}

export interface LoginLog {
  id: number
  user_id: number
  client: string
  device_id: string
  uuid: string
  ip: string
  type: string
  platform: string
  user_token_id: number
  is_deleted: number
  created_at: string
  updated_at: string
}

export interface AuditConn {
  id: number
  action: string
  conn_id: number
  peer_id: string
  from_peer: string
  from_name: string
  ip: string
  session_id: string
  type: number
  uuid: string
  close_time: number
  created_at: string
  updated_at: string
}

export interface AuditFile {
  id: number
  from_peer: string
  info: string
  is_file: boolean
  path: string
  peer_id: string
  type: number
  uuid: string
  ip: string
  num: number
  from_name: string
  created_at: string
  updated_at: string
}

export interface ShareRecord {
  id: number
  user_id: number
  peer_id: string
  share_token: string
  password_type: string
  password: string
  expire: number
  created_at: string
  updated_at: string
}

export interface UserToken {
  id: number
  user_id: number
  device_uuid: string
  device_id: string
  token: string
  expired_at: number
  created_at: string
  updated_at: string
}

export interface ServerCmd {
  id: number
  cmd: string
  alias: string
  option: string
  explain: string
  target: string
  created_at: string
  updated_at: string
}

export interface ShareByWebClientResult {
  share_token: string
}

export interface OauthBindResult {
  code: string
  url: string
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    keepAlive?: boolean
    hide?: boolean
  }
}
