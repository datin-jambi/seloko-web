import React, { useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { menuService } from '@/services/menu.service'
import { useAppStore } from '@/stores/app-store'
import type { MenuItemTree } from '@/types'
import {
  LayoutDashboard,
  Users,
  User,
  UserPlus,
  UserCog,
  Shield,
  ShieldCheck,
  Key,
  Settings,
  LayoutGrid,
  FolderTree,
  FileText,
  ExternalLink,
  Building2,
  Newspaper,
  Send,
  Tags,
  File,
  Layers,
  Image,
  Images,
  MapPin,
  ChevronDown,
  Circle,
  Store,
  Package,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  users: Users,
  user: User,
  'user-plus': UserPlus,
  'user-cog': UserCog,
  shield: Shield,
  'shield-check': ShieldCheck,
  key: Key,
  settings: Settings,
  'layout-grid': LayoutGrid,
  'list-tree': FolderTree,
  'scroll-text': FileText,
  'external-link': ExternalLink,
  'building-2': Building2,
  newspaper: Newspaper,
  send: Send,
  tags: Tags,
  file: File,
  'file-text': FileText,
  'panel-top': Layers,
  image: Image,
  images: Images,
  'map-pin': MapPin,
  store: Store,
  package: Package,
  receipt: Receipt,
}

function MenuIcon({ name }: { name?: string | null }) {
  return React.createElement((name && ICON_MAP[name]) || Circle, {
    className: 'h-4 w-4 shrink-0',
  })
}

// Dipakai bila /api/menus/me kosong atau gagal.
const FALLBACK_MENUS: MenuItemTree[] = [
  { id: 'fb-dashboard', code: 'dashboard', label: 'Dasbor', icon: 'layout-dashboard', path: '/dashboard', isExternal: false, sortOrder: 0, isActive: true },
  { id: 'fb-uptd', code: 'uptd', label: 'UPTD Samsat', icon: 'building-2', path: '/bapenda/uptds', isExternal: false, sortOrder: 1, isActive: true },
  { id: 'fb-banner', code: 'banner', label: 'Banner', icon: 'panel-top', path: '/bapenda/banners', isExternal: false, sortOrder: 2, isActive: true },
  { id: 'fb-news', code: 'news', label: 'Berita', icon: 'newspaper', path: '/bapenda/news', isExternal: false, sortOrder: 3, isActive: true },
]

// Layar < md selalu mode ikon.
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

function matchPath(path: string | null | undefined, current: string) {
  if (!path) return false
  const base = path.split('?')[0]
  return current === base || current.startsWith(`${base}/`)
}

interface NavItemProps {
  item: MenuItemTree
  currentPath: string
  collapsed: boolean
  onExpand: () => void
}

function SidebarNavItem({ item, currentPath, collapsed, onExpand }: NavItemProps) {
  const children = item.children ?? []
  const isChildActive = children.some((c) => matchPath(c.path, currentPath))
  const [isOpen, setIsOpen] = useState(isChildActive)
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
          <MenuIcon name={item.icon} />
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
                currentPath={currentPath}
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
    matchPath(item.path, currentPath) ? itemActive : itemIdle,
    collapsed && 'justify-center px-0',
  )
  const title = collapsed ? item.label : undefined

  if (item.isExternal && item.path) {
    return (
      <a href={item.path} target="_blank" rel="noreferrer" title={title} className={className}>
        <MenuIcon name={item.icon} />
        {label}
        {!collapsed && <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />}
      </a>
    )
  }

  return (
    <Link to={item.path || '#'} title={title} className={className}>
      <MenuIcon name={item.icon} />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { activeAppCode, sidebarCollapsed, toggleSidebar } = useAppStore()
  const isNarrow = useIsNarrow()
  const collapsed = sidebarCollapsed || isNarrow

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', activeAppCode],
    queryFn: menuService.getMyMenus,
    retry: 1,
  })

  const items = menus && menus.length > 0 ? menus : FALLBACK_MENUS
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none',
        collapsed ? 'w-16' : 'w-60',
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
                currentPath={location.pathname}
                collapsed={collapsed}
                // ponytail: di layar < md grup tidak bisa dibuka (selalu ikon); tambah drawer mobile bila perlu.
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
  )
}
