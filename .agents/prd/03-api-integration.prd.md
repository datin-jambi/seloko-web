# PRD 03: Standar Komunikasi API & Axios Interceptors

## 1. Konfigurasi Client Axios (`src/lib/api-client.ts`)
* `baseURL`: Mengambil nilai dari `import.meta.env.VITE_API_BASE_URL` (default: `http://localhost:3000/api`).
* `withCredentials: true`: Wajib diset true agar browser mengirim dan menerima HttpOnly cookie `refreshToken`.
* `timeout: 30000`.

## 2. Request Interceptor
```typescript
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const activeApp = useAppStore.getState().activeAppCode;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-App-Code'] = activeApp || 'seloko';
  return config;
});
```

## 3. Response Interceptor & Token Refresh Queue
* Menangkap status HTTP `401 Unauthorized`.
* Jika bukan request ke endpoint `/auth/login` atau `/auth/refresh`, antre request yang tertunda dan lakukan `POST /api/auth/refresh`.
* Setelah refresh sukses, perbarui token di `useAuthStore` dan jalankan kembali request yang tertunda.
* Jika refresh gagal (cookie kedaluwarsa/revoked), bersihkan sesi dan arahkan pengguna ke `/login`.

## 4. Format Standard Response Backend
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```
