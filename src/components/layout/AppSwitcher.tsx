import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/stores/app-store'
import { useActiveApp, type MyApplication } from '@/hooks/use-apps'
import { AppLogo } from '@/components/shared/AppLogo'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { appHome } from '@/config/constants'
import { cn } from '@/lib/utils'
import { applicationKeys, menuKeys } from '@/lib/query-keys'

/**
 * Pemilih environment super app.
 *
 * Daftar DIISI `GET /applications/me` yang sudah tersaring role & permission
 * akun, lalu disaring lagi oleh `useActiveApp()`:
 *   - hanya `audience === 'INTERNAL'` (CMS) — situs publik bukan alat kerja;
 *   - hanya aplikasi yang punya halaman di frontend ini (`hasCmsRoute`).
 *
 * Berpindah environment mengganti daftar menu sidebar (`/menus/me?appCode=`)
 * DAN berpindah ke beranda workspace tujuan. Navigasi wajib: path halaman lama
 * berprefix workspace lain, sehingga membiarkannya terbuka menghasilkan 404
 * (mis. tetap di `/bapenda/kontent/berita` setelah pindah ke Lapak).
 */
export function AppSwitcher() {
  const { activeAppCode, allowed, current, home, isLoading, isError, refetch } = useActiveApp()
  const setActiveAppCode = useAppStore((s) => s.setActiveAppCode)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const select = (app: MyApplication) => {
    if (app.code === activeAppCode) return
    setActiveAppCode(app.code)
    // Menu bergantung pada appCode → buang cache agar sidebar tidak sempat
    // menampilkan menu environment sebelumnya.
    void queryClient.invalidateQueries({ queryKey: menuKeys.all })
    void queryClient.invalidateQueries({ queryKey: applicationKeys.mine })
    navigate(appHome(app.code))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 min-w-0 max-w-[280px] items-center gap-2 rounded-md px-2 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-accent"
        >
          {current ? (
            <AppLogo app={current} size="md" />
          ) : (
            <Loader2 className={cn('size-4 shrink-0 text-muted-foreground', isLoading && 'animate-spin')} />
          )}
          <span className="truncate font-semibold text-foreground">
            {current?.name ?? (isLoading ? 'Memuat…' : 'Pilih environment')}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Environment</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading && (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat…
          </div>
        )}

        {!isLoading && isError && (
          <div className="space-y-2 px-2 py-3 text-sm text-muted-foreground">
            <p>Gagal memuat daftar environment.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="font-medium text-primary underline underline-offset-2"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!isLoading && !isError && allowed.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            Akun ini belum punya akses ke environment mana pun.
          </div>
        )}

        {allowed.map((app) => {
          const selected = app.code === activeAppCode
          return (
            <DropdownMenuItem key={app.id} onClick={() => select(app)} className="items-start gap-3 py-2">
              <AppLogo
                key={`${app.logoUrl ?? ''}|${app.logoDarkUrl ?? ''}|${app.icon ?? ''}`}
                app={app}
                size="lg"
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{app.name}</div>
                {(app.tagline ?? app.description) && (
                  <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {app.tagline ?? app.description}
                  </div>
                )}
                {/* Role yang dipegang di platform ini — inilah yang menentukan
                    menu apa saja yang muncul di sidebar. */}
                {app.roles.length > 0 && (
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">Sebagai: {app.roles.join(', ')}</div>
                )}
              </div>
              {selected && <Check className="mt-1 shrink-0 text-primary" />}
            </DropdownMenuItem>
          )
        })}

        {/* Beranda workspace aktif berguna sebagai jalan pulang dari halaman dalam. */}
        {home && activeAppCode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(home)}>Buka beranda</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
