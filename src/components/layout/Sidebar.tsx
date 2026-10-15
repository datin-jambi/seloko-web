import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { menuService } from '@/services/menu.service'
import { useAppStore } from '@/stores/app-store'
import { MenuIcon } from '@/components/shared/MenuIcon'
import { ChevronDown, ExternalLink, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuItemTree } from '@/types'
// Dipakai hanya bila /api/menus/me gagal. Daftar kosong = user memang tanpa akses.
const FALLBACK_MENUS: MenuItemTree[] = [
  { id: 'fb-dashboard', code: 'dashboard', label: 'Dasbor', icon: 'layout-dashboard', path: '/seloko/dashboard', isExternal: false, sortOrder: 0, items: [] },
]

// Layar < md: sidebar jadi drawer (tersembunyi, dibuka dari tombol menu di Header).
const narrowQuery = '(max-width: 767px)'
function useIsNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(narrowQuery)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => matchMedia(narrowQuery).matches,
  )
}

const itemBase =
  'relative flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-indicator/60'
const itemIdle = 'text-sidebar-foreground hover:bg-sidebar-active/70 hover:text-white'
const itemActive =
  'bg-sidebar-active font-medium text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r before:bg-sidebar-indicator'

// Item aktif = path menu terpanjang yang menjadi prefix URL. Tanpa ini
// /lapak/merchant/verifikasi ikut menyalakan /lapak/merchant.
function findActivePath(menus: MenuItemTree[], current: string) {
  let best = ''
  const walk = (items: MenuItemTree[]) =>
    items.forEach((m) => {
      const base = m.path?.split('?')[0]
      if (!m.isExternal && base && base.length > best.length && (current === base || current.startsWith(`${base}/`)))
        best = base
      walk(m.items)
    })
  walk(menus)
  return best
}

interface NavItemProps {
  item: MenuItemTree
  activePath: string
  collapsed: boolean
  onExpand: () => void
}

function SidebarNavItem({ item, activePath, collapsed, onExpand }: NavItemProps) {
  const children = item.items
  const isChildActive = children.some((c) => c.path === activePath)
  const [isOpen, setIsOpen] = useState(isChildActive)
  // Buka grup saat navigasi masuk ke salah satu anaknya (pola "adjust state on prop change").
  const [prevActive, setPrevActive] = useState(isChildActive)
  if (isChildActive !== prevActive) {
    setPrevActive(isChildActive)
    if (isChildActive) setIsOpen(true)
  }
  const label = <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>

  if (children.length > 0) {
    return (
      <div>
        <button
          type="button"
          title={collapsed ? item.label : undefined}
          aria-expanded={!collapsed && isOpen}
          onClick={() => {
            if (collapsed) {
              onExpand()
              setIsOpen(true)
            } else setIsOpen(!isOpen)
          }}
          className={cn(
            itemBase,
            itemIdle,
            isChildActive && 'text-white',
            collapsed && isChildActive && itemActive,
            collapsed && 'justify-center px-0',
          )}
        >
          <MenuIcon name={item.icon} className="h-4 w-4 shrink-0" />
          {label}
          {!collapsed && (
            <ChevronDown
              className={cn(
                'ml-auto h-4 w-4 shrink-0 opacity-60 transition-transform motion-reduce:transition-none',
                !isOpen && '-rotate-90',
              )}
            />
          )}
        </button>

        {!collapsed && isOpen && (
          <div className="ml-[1.375rem] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
            {children.map((child) => (
              <SidebarNavItem
                key={child.id || child.code}
                item={child}
                activePath={activePath}
                collapsed={false}
                onExpand={onExpand}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const className = cn(
    itemBase,
    item.path === activePath ? itemActive : itemIdle,
    collapsed && 'justify-center px-0',
  )
  const title = collapsed ? item.label : undefined

  if (item.isExternal && item.path) {
    return (
      <a href={item.path} target="_blank" rel="noreferrer" title={title} className={className}>
        <MenuIcon name={item.icon} className="h-4 w-4 shrink-0" />
        {label}
        {!collapsed && <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />}
      </a>
    )
  }

  return (
    <Link to={item.path || '#'} title={title} className={className}>
      <MenuIcon name={item.icon} className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { activeAppCode, sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useAppStore()
  const isNarrow = useIsNarrow()
  // Drawer mobile selalu lebar penuh (label terlihat).
  const collapsed = sidebarCollapsed && !isNarrow

  // Tutup drawer setiap pindah halaman.
  const [prevPath, setPrevPath] = useState(location.pathname)
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    if (mobileNavOpen) setMobileNavOpen(false)
  }

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileNavOpen(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [mobileNavOpen, setMobileNavOpen])

  const { data: menus, isLoading, isError } = useQuery({
    queryKey: ['menus', activeAppCode],
    queryFn: menuService.getMyMenus,
    retry: 1,
  })

  const items = isError ? FALLBACK_MENUS : (menus ?? [])
  const activePath = findActivePath(items, location.pathname)
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <>
      {isNarrow && mobileNavOpen && (
        <div aria-hidden className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileNavOpen(false)} />
      )}
      <aside
        id="sidebar"
        className={cn(
          'flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground motion-reduce:transition-none',
          isNarrow
            ? cn(
                'fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-out',
                !mobileNavOpen && 'invisible -translate-x-full',
              )
            : cn('sticky top-0 transition-[width] duration-200 ease-out', collapsed ? 'w-16' : 'w-60'),
        )}
      >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border',
          collapsed ? 'justify-center' : 'px-4',
        )}
      >
        <img
          src="/Assets/images/LOGO%20SELOKO%20S.png"
          alt="Seloko"
          className="h-8 w-8 shrink-0 object-contain"
        />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-bold tracking-wide text-white">SELOKO</div>
            <div className="truncate text-xs text-sidebar-foreground">BPKPD Provinsi Jambi</div>
          </div>
        )}
      </div>

      <nav aria-label="Menu utama" className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-md bg-sidebar-active/60" />
            ))
          : items.map((item) => (
              <SidebarNavItem
                key={item.id || item.code}
                item={item}
                activePath={activePath}
                collapsed={collapsed}
                onExpand={() => sidebarCollapsed && toggleSidebar()}
              />
            ))}
      </nav>

      {!isNarrow && (
        <div className="shrink-0 border-t border-sidebar-border p-2">
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? 'Perluas sidebar' : undefined}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className={cn(itemBase, itemIdle, collapsed && 'justify-center px-0')}
          >
            <ToggleIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Ciutkan</span>}
          </button>
        </div>
      )}
      </aside>
    </>
  )
}
