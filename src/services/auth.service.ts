import { apiClient } from '@/lib/api-client'
import { APP_CODES } from '@/config/constants'
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
    // Login SELALU lewat gateway internal "seloko" — jangan pakai konteks
    // aktif dari localStorage. Jika konteks tersisa "bapenda-profile" /
    // "lapak-jambi-web" (audience PUBLIC), backend mencari akun publik dan
    // membalas 401 "Invalid credentials" meski password benar.
    const res = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      payload,
      { headers: { 'X-App-Code': APP_CODES.SELOKO } },
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
