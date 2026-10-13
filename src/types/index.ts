// Format Respons Standar Backend SELOKO API
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// User Profile (dari /api/auth/me atau /api/auth/login)
export interface AuthUser {
  id: string
  email: string
  username: string | null
  fullName: string
  nip: string | null
  phoneNumber?: string | null
  avatarUrl: string | null
  avatarFileId?: string | null
  accountType: 'INTERNAL' | 'PUBLIC'
  isSuperAdmin: boolean
  roles?: string[]
  permissions?: string[]
}

// Aplikasi yang terdaftar di ekosistem
export interface ApplicationItem {
  id: string
  code: string
  name: string
  description?: string | null
  baseUrl?: string | null
  icon?: string | null
  audience: 'INTERNAL' | 'PUBLIC'
  tagline?: string | null
  logoUrl?: string | null
  isActive: boolean
}

// Item Menu Dinamis (dari GET /api/menus/me → data.menus)
export interface MenuItemTree {
  id: string
  code: string
  label: string
  icon: string | null
  path: string | null
  isExternal: boolean
  sortOrder: number
  items: MenuItemTree[]
}
