import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { appWorkspace, hasCmsRoute, workspaceHome } from '@/config/constants'
import { useAppStore } from '@/stores/app-store'
import type { ApiResponse } from '@/types'

/**
 * Aplikasi yang boleh diakses pengguna yang sedang login.
 *
 * Endpoint: `GET /applications/me` (../seloko-api/src/modules/core/
 * applications/applications.service.ts → `listMyApplications`). Tanpa
 * `requirePermission` — isinya milik pemanggil sendiri dan endpoint ini memang
 * dibuat untuk mengisi launcher super app. Superadmin mendapat semua aplikasi
 * aktif; akun biasa hanya aplikasi yang punya penugasan role aktif & belum
 * kedaluwarsa.
 *
 * JANGAN memakai `GET /applications`: endpoint itu menuntut `application:list`
 * milik seloko, sehingga admin OPD kena 403 dan switcher-nya jadi kosong.
 */
export interface MyApplication {
  id: string
  code: string
  name: string
  /** INTERNAL = CMS (masuk super app SELOKO); PUBLIC = situs untuk warga. */
  audience: 'INTERNAL' | 'PUBLIC'
  tagline: string | null
  description: string | null
  /** Alamat situs publik. BUKAN tujuan halaman CMS di sini. */
  baseUrl: string | null
  /** Nama ikon Lucide (mis. `building-2`). Fallback bila logo tidak ada. */
  icon: string | null
  logoUrl: string | null
  /** Varian untuk tema gelap; dipakai lebih dulu saat mode gelap aktif. */
  logoDarkUrl: string | null
  faviconUrl: string | null
  /** Role yang dipegang di aplikasi ini. Kosong untuk superadmin (bypass). */
  roles: string[]
  /** Kapan akses hilang; null = permanen. */
  expiresAt: string | null
}

export const appService = {
  my: async () => (await apiClient.get<ApiResponse<MyApplication[]>>('/applications/me')).data.data,
}

/** Kunci query dipakai bersama switcher, sidebar, dan halaman dasbor. */
export const MY_APPS_KEY = ['applications', 'me'] as const
export function useMyApplications() {
  const query = useQuery({
    queryKey: MY_APPS_KEY,
    queryFn: appService.my,
    // Daftar aplikasi berubah sangat jarang; hindari request tiap pindah halaman.
    staleTime: 10 * 60_000,
  })

  return {
    apps: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  }
}

/**
 * CMS environment yang boleh dipakai akun ini di SELOKO web.
 *
 * SELOKO web adalah super app: **hanya aplikasi ber-audience `INTERNAL`** yang
 * ditampilkan. Situs publik (`bapenda-portal`, `lapak-jambi-app`) adalah produk
 * untuk warga — bukan alat kerja — jadi tidak pernah masuk switcher walau
 * `/applications/me` mengembalikannya untuk superadmin.
 *
 * Sumber kebenaran = `GET /applications/me` ∩ `audience === 'INTERNAL'` ∩
 * `hasCmsRoute` (halaman workspace-nya benar-benar ada di `src/App.tsx`).
 *
 * `hasCmsRoute` bukan sekadar hiasan: memilih aplikasi INTERNAL yang belum
 * punya UI akan menghasilkan sidebar kosong dan halaman 404. Karena itu
 * aplikasi yang belum dibangun tidak ditawarkan dulu.
 *
 * Nilai `activeAppCode` di store hanya preferensi; bila tidak sah — sisa sesi
 * akun lain atau role dicabut — kita jatuh ke environment pertama yang boleh
 * diakses.
 */
export function useActiveApp() {
  const { apps, isLoading, isError, refetch } = useMyApplications()
  const { activeAppCode, setActiveAppCode } = useAppStore()

  const allowed = apps.filter((a) => a.audience === 'INTERNAL' && hasCmsRoute(a.code))
  const isAllowed = (code: string | null): code is string => !!code && allowed.some((a) => a.code === code)

  // Koreksi dijalankan di render (bukan useEffect) supaya UI tidak sempat
  // menampilkan environment yang salah lalu berkedip.
  if (!isLoading && !isError && allowed.length > 0 && !isAllowed(activeAppCode)) {
    setActiveAppCode(allowed[0].code)
  }

  const current = allowed.find((a) => a.code === activeAppCode) ?? allowed[0] ?? null
  const workspace = current ? appWorkspace(current.code) : null
  return {
    current,
    allowed,
    activeAppCode: current?.code ?? null,
    /** Segmen URL workspace aktif, mis. `lapak`. `null` bila belum ada yang sah. */
    workspace,
    /** Beranda workspace aktif — tujuan setelah ganti environment. */
    home: workspace ? workspaceHome(workspace) : null,
    isLoading,
    isError,
    refetch,
  }
}
