---
name: api-query-workflow
description: Standar pengelolaan data server dengan TanStack Query dan multi-app cache invalidation
---

# SOP Integrasi Data Server (TanStack Query Standards)

Dokumen ini mengatur cara penulisan custom query hooks dan mutasi data agar selaras dengan arsitektur multi-tenancy `X-App-Code`.

---

## 1. Aturan Query Keys Factory
Seluruh query key yang datanya terikat pada konteks aplikasi **wajib menyertakan `activeAppCode`** agar tidak terjadi tumpang tindih cache saat user mengganti aplikasi di App Switcher.

Pola Query Key Factory:
```typescript
export const uptdKeys = {
  all: (appCode: string) => ['uptds', appCode] as const,
  lists: (appCode: string) => [...uptdKeys.all(appCode), 'list'] as const,
  list: (appCode: string, filters: Record<string, unknown>) =>
    [...uptdKeys.lists(appCode), filters] as const,
  details: (appCode: string) => [...uptdKeys.all(appCode), 'detail'] as const,
  detail: (appCode: string, id: string) =>
    [...uptdKeys.details(appCode), id] as const,
}
```

---

## 2. Pola Penulisan Query Hook
```typescript
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { uptdService } from '@/services/uptd.service'
import { uptdKeys } from './uptd-keys'

export function useUptdList(params: { page: number; search?: string }) {
  const { activeAppCode } = useAppStore()

  return useQuery({
    queryKey: uptdKeys.list(activeAppCode, params),
    queryFn: () => uptdService.list(params),
    staleTime: 1000 * 60 * 3, // 3 menit
    placeholderData: (prev) => prev, // Menjaga UI tetap stabil saat ganti halaman
  })
}
```

---

## 3. Pola Penulisan Mutasi & Auto-Invalidation
Setiap kali melakukan operasi create/update/delete (feedback toast wajib, top loader otomatis lewat `apiClient`):
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { useAppStore } from '@/stores/app-store'
import { uptdService } from '@/services/uptd.service'
import { uptdKeys } from './uptd-keys'

export function useCreateUptd() {
  const queryClient = useQueryClient()
  const { activeAppCode } = useAppStore()

  return useMutation({
    mutationFn: uptdService.create,
    onSuccess: () => {
      // Invalidate hanya daftar UPTD pada aplikasi aktif
      queryClient.invalidateQueries({ queryKey: uptdKeys.lists(activeAppCode) })
      toast.success('UPTD disimpan')
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      // Error field (400 details) dipetakan ke bawah input; sisanya toast.
      toast.error('Gagal menyimpan', {
        description: error.response?.data?.message ?? error.message,
      })
    },
  })
}
```
