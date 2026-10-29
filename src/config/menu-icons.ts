import type { ElementType } from 'react'
import {
  BadgeCheck,
  BedDouble,
  Building2,
  Circle,
  Dumbbell,
  ExternalLink,
  EyeOff,
  File,
  FileDown,
  FileText,
  FlaskConical,
  FolderTree,
  Globe,
  Handshake,
  House,
  Image,
  Images,
  Landmark,
  Key,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  ListTree,
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
  Sprout,
  Store,
  Tags,
  User,
  UserCog,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react'

/**
 * Nama ikon Lucide yang dikenali sidebar. Nilai `menuItem.icon` / `application.icon`
 * adalah nama ini (disimpan sebagai string di DB, bukan komponen).
 *
 * Satu sumber untuk dua pemakai: `MenuIcon` (merender menu & ikon aplikasi) dan
 * form menu (memilih), supaya operator tidak bisa memilih ikon yang tidak akan
 * pernah muncul. Ikon tak dikenal → `Circle` sebagai penanda netral.
 *
 * Setiap nama yang dipakai seeder (`../seloko-api/prisma/seeds/core/menus.json`
 * & `applications.json`) WAJIB terdaftar di sini.
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
  'list-tree': ListTree,
  'list-tree-x': FolderTree,
  'scroll-text': FileText,
  'external-link': ExternalLink,
  'building-2': Building2,
  globe: Globe,
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
  // Kategori Layanan Lapak (`prisma/seeds/lapak/categories.json`). Nama ikon
  // disimpan di DB, jadi tanpa entri di sini kategori tampil sebagai lingkaran.
  'bed-double': BedDouble,
  landmark: Landmark,
  dumbbell: Dumbbell,
  wrench: Wrench,
  'flask-conical': FlaskConical,
  sprout: Sprout,
}

/** Urut abjad untuk dropdown pemilihan ikon. */
export const MENU_ICON_NAMES = Object.keys(MENU_ICONS).sort()

export function menuIcon(name?: string | null): ElementType {
  return (name && MENU_ICONS[name]) || Circle
}
