import request from '@/utils/request'
import type { ApiResponse, ServerConfig, AdminConfig, AppConfig } from '@/types'

export function adminConfig(): Promise<ApiResponse<AdminConfig>> {
  return request.get('/config/admin')
}

export function serverConfig(): Promise<ApiResponse<ServerConfig>> {
  return request.get('/config/server')
}

export function appConfig(): Promise<ApiResponse<AppConfig>> {
  return request.get('/config/app')
}
