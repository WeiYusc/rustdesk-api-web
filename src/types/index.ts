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

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    keepAlive?: boolean
    hide?: boolean
  }
}
