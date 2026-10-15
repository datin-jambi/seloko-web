// Item list SELOKO API — dibaca dari ../seloko-api/src/modules/core/*/*.schema.ts

export type Audience = 'INTERNAL' | 'PUBLIC'

export interface UserListItem {
  id: string
  nip: string | null
  username: string | null
  email: string
  fullName: string
  accountType: Audience
  isSuperAdmin: boolean
  isActive: boolean
  lastLoginAt: string | null
  totalRoles: number
  applications: { id: string; code: string; name: string }[]
}

// GET /users/:id — UserDetailShape
export interface UserDetail extends Omit<UserListItem, 'applications'> {
  phoneNumber: string | null
  avatarUrl: string | null
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
  totalApplications: number
  applications: {
    id: string
    code: string
    name: string
    roles: { id: string; roleId: string; roleName: string; expiresAt: string | null; createdAt: string }[]
  }[]
}

// POST /users — CreateUserBodySchema. Hanya membuat akun INTERNAL (pegawai).
export interface CreateUserBody {
  username: string
  email: string
  fullName: string
  password: string
  nip?: string
  phoneNumber?: string
  isSuperAdmin: boolean
}

// PATCH /users/:id — UpdateUserBodySchema. Username, email, jenis akun tidak bisa diubah.
export interface UpdateUserBody {
  fullName?: string
  nip?: string | null
  phoneNumber?: string | null
  isSuperAdmin?: boolean
}

// POST /users/:id/roles — AssignRoleBodySchema. Idempoten: pasangan yang sama hanya memperbarui expiresAt.
export interface AssignRoleBody {
  applicationId: string
  roleId: string
  expiresAt?: string
}

export interface RoleListItem {
  id: string
  applicationId: string
  applicationName: string
  name: string
  description: string | null
  audience: Audience
  isSystemRole: boolean
  isActive: boolean
  permissionCount: number
  userCount: number
}

export interface PermissionListItem {
  id: string
  applicationCode: string
  code: string
  name: string
  module: string
  roleCount: number
  menuCount: number
}

export interface ApplicationSettings {
  branding?: {
    shortName?: string | null
    primaryColor?: string | null
    accentColor?: string | null
    faviconUrl?: string | null
  } | null
  contact?: {
    email?: string | null
    phone?: string | null
    whatsapp?: string | null
    address?: string | null
    googleMapsUrl?: string | null
    workingHours?: string | null
  } | null
  features?: {
    maintenanceMode?: boolean
    maintenanceMessage?: string | null
    enablePayment?: boolean
    enableRegistration?: boolean
  } | null
  [key: string]: unknown
}

export interface ApplicationListItem {
  id: string
  code: string
  name: string
  tagline: string | null
  description?: string | null
  baseUrl?: string | null
  icon?: string | null
  audience: Audience
  logoUrl?: string | null
  isActive: boolean
  counts: { permissions: number; roles: number; menuItems: number; userAppRoles: number }
}

export interface ApplicationDetailRole {
  id: string
  name: string
  description: string | null
  audience: Audience
  isSystemRole: boolean
  isActive: boolean
  permissionCount: number
}

export interface ApplicationPermissionGroup {
  module: string
  permissions: { id: string; code: string; name: string }[]
}

export interface ApplicationDetail extends ApplicationListItem {
  description: string | null
  baseUrl: string | null
  icon: string | null
  logoUrl: string | null
  logoDarkUrl: string | null
  faviconUrl: string | null
  ogImageUrl: string | null
  settings: ApplicationSettings
  createdAt: string
  updatedAt: string
  roles: ApplicationDetailRole[]
  permissionsByModule: ApplicationPermissionGroup[]
}

export interface CreateApplicationDTO {
  code: string
  name: string
  audience: Audience
  tagline?: string | null
  description?: string | null
  baseUrl?: string | null
  icon?: string | null
  logoUrl?: string | null
  isActive?: boolean
  settings?: ApplicationSettings
}

export interface UpdateApplicationDTO {
  name?: string
  tagline?: string | null
  description?: string | null
  baseUrl?: string | null
  icon?: string | null
  logoUrl?: string | null
  isActive?: boolean
  settings?: ApplicationSettings
}

export interface MenuListItem {
  id: string
  application: { id: string; code: string; name: string }
  parent: { id: string; code: string; label: string } | null
  code: string
  label: string
  path: string | null
  isExternal: boolean
  sortOrder: number
  isActive: boolean
  permission: { code: string } | null
}
