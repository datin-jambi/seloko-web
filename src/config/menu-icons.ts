import type { ElementType } from 'react'
import {
  BadgeCheck,
  Building2,
  Circle,
  ExternalLink,
  EyeOff,
  File,
  FileDown,
  FileText,
  FolderTree,
  Handshake,
  House,
  Image,
  Images,
  Key,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Newspaper,
  Package,
  Receipt,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Tags,
  User,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'

/**
 * Nama ikon Lucide yang dikenali sidebar. Nilai `menuItem.icon` adalah nama ini
 * (disimpan sebagai string di DB, bukan komponen).
 *
 * Satu sumber untuk dua pemakai: `Sidebar` (merender) dan form menu (memilih),
 * supaya operator tidak bisa memilih ikon yang tidak akan pernah muncul.
 * Ikon tak dikenal → `Circle` sebagai penanda netral.
 */
export const MENU_ICONS: Record<string, ElementType> = {
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
  'badge-check': BadgeCheck,
  'eye-off': EyeOff,
  'file-down': FileDown,
  handshake: Handshake,
  home: House,
  'shopping-cart': ShoppingCart,
  smartphone: Smartphone,
}

/** Urut abjad untuk dropdown pemilihan ikon. */
export const MENU_ICON_NAMES = Object.keys(MENU_ICONS).sort()

export function menuIcon(name?: string | null): ElementType {
  return (name && MENU_ICONS[name]) || Circle
}
