import React, { useState } from 'react'
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
  ChevronRight,
  Circle,
  HelpCircle,
  Store,
  Package,
  Receipt,
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

function resolveIcon(iconName?: string | null): React.ElementType {
  if (!iconName) return Circle
  return ICON_MAP[iconName] || Circle
}

interface MenuItemProps {
  item: MenuItemTree
  currentPath: string
}

function SidebarNavItem({ item, currentPath }: MenuItemProps) {
  const hasChildren = item.children && item.children.length > 0
  const isChildActive =
    hasChildren &&
    item.children?.some(
      (c) => c.path && currentPath.startsWith(c.path.split('?')[0]),
    )
  const [isOpen, setIsOpen] = useState(isChildActive ?? false)

  const IconComp = resolveIcon(item.icon)
  const isActive = item.path
    ? currentPath === item.path || currentPath.startsWith(`${item.path}/`)
    : false

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground',
            (isOpen || isChildActive) && 'text-foreground',
          )}
        >
          <div className="flex items-center gap-2.5">
            <IconComp className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{item.label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          )}
        </button>

        {isOpen && (
          <div className="ml-4 space-y-1 border-l border-border/60 pl-2">
            {item.children?.map((child) => (
              <SidebarNavItem
                key={child.id || child.code}
                item={child}
                currentPath={currentPath}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (item.isExternal && item.path) {
    return (
      <a
        href={item.path}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <div className="flex items-center gap-2.5">
          <IconComp className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </div>
        <ExternalLink className="h-3 w-3 text-muted-foreground/70" />
      </a>
    )
  }

  return (
    <Link
      to={item.path || '#'}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
          : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground',
      )}
    >
      <IconComp
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-primary-foreground' : 'text-muted-foreground',
        )}
      />
      <span>{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { activeAppCode } = useAppStore()

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', activeAppCode],
    queryFn: menuService.getMyMenus,
    retry: 1,
  })

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-border/70 bg-card/70 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border/70 px-4">
        <img
          src="/Assets/images/LOGO%20SELOKO%20S.png"
          alt="Seloko Logo"
          className="h-9 w-9 object-contain shrink-0 rounded-lg"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold tracking-tight text-foreground truncate">
            SELOKO DASHBOARD
          </span>
          <span className="text-[10px] font-medium text-muted-foreground truncate">
            BPKPD Provinsi Jambi
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Navigasi Menu
        </div>

        {isLoading ? (
          <div className="space-y-2 px-3 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : menus && menus.length > 0 ? (
          menus.map((item) => (
            <SidebarNavItem
              key={item.id || item.code}
              item={item}
              currentPath={location.pathname}
            />
          ))
        ) : (
          <div className="space-y-1">
            {/* Fallback menu items if not logged in or backend menu is empty */}
            <Link
              to="/dashboard"
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium',
                location.pathname === '/dashboard'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dasbor Utama</span>
            </Link>
            <Link
              to="/bapenda/uptds"
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium',
                location.pathname.startsWith('/bapenda/uptds')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <Building2 className="h-4 w-4" />
              <span>UPTD Samsat Jambi</span>
            </Link>
            <Link
              to="/bapenda/banners"
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium',
                location.pathname.startsWith('/bapenda/banners')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <Layers className="h-4 w-4" />
              <span>Banner Promo</span>
            </Link>
            <Link
              to="/bapenda/news"
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium',
                location.pathname.startsWith('/bapenda/news')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <Newspaper className="h-4 w-4" />
              <span>Berita & Artikel</span>
            </Link>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-border/70 p-3">
        <div className="rounded-lg bg-secondary/50 p-2.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span>Pusat Bantuan ASN</span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed">
            Terhubung dengan Gateway API Seloko v1.0.0
          </p>
        </div>
      </div>
    </aside>
  )
}
