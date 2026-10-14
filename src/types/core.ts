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

export interface RoleListItem {
  id: string
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

export interface ApplicationListItem {
  id: string
  code: string
  name: string
  tagline: string | null
  audience: Audience
  isActive: boolean
  counts: { permissions: number; roles: number; menuItems: number; userAppRoles: number }
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
