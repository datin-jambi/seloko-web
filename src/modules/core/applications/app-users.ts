import { apiClient } from '@/lib/api-client'
import { userKeys } from '@/lib/query-keys'
import type { UserListItem } from '@/types/core'

// GET /users belum punya filter applicationId, jadi daftar diambil lalu disaring di browser.
// ponytail: batas 10 halaman (1.000 pengguna) agar tidak menarik seluruh tabel.
// Kalau pengguna tumbuh melewati batas ini, tambahkan filter applicationId di API.
const MAX_PAGES = 10
const PER_PAGE = 100

export type AppUsersData = {
  /** Pengguna yang punya akses: superadmin + yang punya penugasan role di aplikasi ini. */
  rows: UserListItem[]
  scanned: number
  capped: boolean
}

/** Kunci cache bersama: tab "Pengguna" dan kartunya memakai satu permintaan yang sama. */
export const appUsersKey = userKeys.byApp

export async function fetchAppUsers(appId: string): Promise<AppUsersData> {
  const first = await apiClient.get<{ data: UserListItem[]; meta?: { totalPages?: number } }>('/users', {
    params: { page: 1, limit: PER_PAGE },
  })
  const totalPages = Math.min(first.data.meta?.totalPages ?? 1, MAX_PAGES)
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      apiClient.get<{ data: UserListItem[] }>('/users', { params: { page: i + 2, limit: PER_PAGE } }),
    ),
  )
  const all = [first.data.data, ...rest.map((r) => r.data.data)].flat()
  return {
    rows: all.filter((u) => u.isSuperAdmin || u.applications.some((a) => a.id === appId)),
    scanned: all.length,
    capped: (first.data.meta?.totalPages ?? 1) > MAX_PAGES,
  }
}
