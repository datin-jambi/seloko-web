import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, APP_CODES } from '@/config/constants'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiResponse } from '@/types'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Pasang Bearer Token & Header Wajib X-App-Code
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Gateway multi-tenancy — untuk dashboard internal ini SELALU "seloko".
    // Backend (authenticate) mewajibkan X-App-Code == appCode token; konteks
    // aplikasi lain (bapenda-profile dkk) dikirim lewat query param atau path
    // API (/api/bapenda/*), BUKAN lewat header ini. Mengikuti activeAppCode UI
    // di sini menyebabkan 403 lintas konteks dan 401 saat login.
    config.headers['X-App-Code'] = APP_CODES.SELOKO

    return config
  },
  (error) => Promise.reject(error),
)

// Response Interceptor: Tangani 401 dan Rotasi Token Asinkron
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (!originalRequest) return Promise.reject(error)

    // Abaikan jika error 401 berasal dari endpoint login atau refresh itu sendiri
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResponse = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            // Refresh token terbit untuk konteks gateway — wajib cocok dengan
            // X-App-Code, kalau tidak backend membalas 400/403.
            headers: { 'X-App-Code': APP_CODES.SELOKO },
          },
        )

        const newToken = refreshResponse.data.data.accessToken
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          useAuthStore.getState().setAuth(newToken, currentUser)
        }

        processQueue(null)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error)
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
