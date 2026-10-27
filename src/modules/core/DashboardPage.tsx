import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { menuService } from '@/services/menu.service'
import { useAuthStore } from '@/stores/auth-store'
import { useActiveApp } from '@/hooks/use-apps'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import type { MenuItemTree } from '@/types'

/**
 * Beranda tiap environment. Isinya pintasan ke menu yang memang boleh diakses
 * user (dari `/menus/me`), bukan metrik karangan — super app ini tidak punya
 * data statistik sendiri.
 */
export function DashboardPage() {
  const { activeAppCode, current: app } = useActiveApp()
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()
  const menusQuery = useQuery({
    queryKey: ['menus', activeAppCode],
    queryFn: () => menuService.getMyMenus(activeAppCode),
    enabled: !!activeAppCode,
  })

  // Menu yang menunjuk halaman ini sendiri ("Dashboard") dibuang: pintasan ke
  // beranda yang sedang dibuka tidak berguna dan tampil sebagai grup aneh.
  const menus = (menusQuery.data ?? []).filter((m) => m.path !== pathname)
  // Menu tingkat atas tanpa anak tetap ditampilkan (mis. portal publik hanya
  // punya satu menu datar); tanpa ini beranda tampak kosong padahal ada akses.
  const groups = menus.filter((m) => m.items.length > 0)
  const leaves = menus.filter((m) => m.items.length === 0)

  return (
    <>
      <PageHeader
        title={app ? `Dasbor ${app.name}` : 'Dasbor'}
        description={app?.tagline ?? app?.description ?? (user ? `Selamat datang, ${user.fullName}.` : undefined)}
      />

      {!menusQuery.isPending && groups.length === 0 && leaves.length === 0 && (
        <EmptyState
          title="Belum ada menu untuk environment ini"
          description="Akun Anda belum punya role aktif di aplikasi ini, atau admin belum menambahkan menu."
        />
      )}

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
        {[...groups, ...leaves].map((g) => (
          <section key={g.id || g.code}>
            <h2 className="mb-2 text-sm font-semibold">{g.label}</h2>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {(g.items.length > 0 ? g.items : [g]).map((item) => (
                <ShortcutRow key={item.id || item.code} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function ShortcutRow({ item }: { item: MenuItemTree }) {
  const className =
    'flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none'
  const body = (
    <>
      {item.label}
      <ChevronRight className="size-4 text-muted-foreground" />
    </>
  )
  return (
    <li>
      {item.isExternal ? (
        <a href={item.path ?? '#'} target="_blank" rel="noreferrer" className={className}>
          {body}
        </a>
      ) : (
        <Link to={item.path ?? '#'} className={className}>
          {body}
        </Link>
      )}
    </li>
  )
}
