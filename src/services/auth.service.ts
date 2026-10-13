import { apiClient } from '@/lib/api-client'
import type { ApiResponse, AuthUser } from '@/types'

export interface LoginPayload {
  identity: string
  password: string
}

export interface LoginResponseData {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      payload,
    )
    return res.data.data
  },

  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get<ApiResponse<AuthUser>>('/auth/me')
    return res.data.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  async logoutAll(): Promise<void> {
    await apiClient.post('/auth/logout-all')
  },
}
