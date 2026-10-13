import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { menuService } from '@/services/menu.service'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/auth-store'
import { APP_CONFIGS } from '@/config/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import type { MenuItemTree } from '@/types'

// Dasbor tiap aplikasi: pintasan ke menu yang memang boleh diakses user (dari /menus/me).
export function DashboardPage() {
  const activeAppCode = useAppStore((s) => s.activeAppCode)
  const user = useAuthStore((s) => s.user)
  const { data: menus } = useQuery({ queryKey: ['menus', activeAppCode], queryFn: menuService.getMyMenus })

  const groups = (menus ?? []).filter((m) => m.items.length > 0)
  const app = APP_CONFIGS[activeAppCode]

  return (
    <>
      <PageHeader
        title={`Dasbor ${app?.name ?? ''}`.trim()}
        description={user ? `Selamat datang, ${user.fullName}.` : undefined}
      />
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <section key={g.id}>
            <h2 className="mb-2 text-sm font-semibold">{g.label}</h2>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {g.items.map((item) => (
                <ShortcutRow key={item.id} item={item} />
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
