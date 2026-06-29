import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export function uploadFile(file: File): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
