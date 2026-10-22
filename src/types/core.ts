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
  applicationId: string
  applicationCode: string
  code: string
  name: string
  module: string
  createdAt: string
  roleCount: number
  menuCount: number
}

// GET /permissions/:id — PermissionDetailShape
export interface PermissionDetail extends PermissionListItem {
  roles: { id: string; name: string }[]
  menus: { id: string; label: string }[]
}

// POST/PATCH /permissions — kode & aplikasi terkunci setelah dibuat.
export interface CreatePermissionBody {
  applicationId: string
  code: string
  name: string
  module: string
}

export interface UpdatePermissionBody {
  name?: string
  module?: string
}

// GET /roles/:id — RoleDetailShape: SELURUH permission aplikasi + tanda `granted`.
export interface RoleDetail extends RoleListItem {
  createdAt: string
  updatedAt: string
  permissionsByModule: {
    module: string
    permissions: { id: string; code: string; name: string; granted: boolean }[]
  }[]
}

// POST/PATCH /roles — `applicationId` & `audience` terkunci setelah dibuat.
export interface CreateRoleBody {
  applicationId: string
  name: string
  audience: Audience
  description?: string
  permissionIds?: string[]
  isActive?: boolean
}

export interface UpdateRoleBody {
  name?: string
  description?: string | null
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

// ── Menu CMS (../seloko-api/src/modules/core/menus/menus.schema.ts) ────────────

// GET /menus?tree=true — MenuItemCmsNodeSchema (rekursif).
export interface MenuCmsNode {
  id: string
  applicationId: string
  parentId: string | null
  code: string
  label: string
  icon: string | null
  path: string | null
  isExternal: boolean
  sortOrder: number
  isActive: boolean
  permissionId: string | null
  permission: { id: string; code: string; name: string } | null
  roles: { id: string; name: string }[]
  items: MenuCmsNode[]
}

// GET /menus tanpa `tree` — MenuListItemShape. Bentuknya BERBEDA dari node pohon:
// tidak ada `parentId`/`items`, tetapi ada `parent` (objek), `rolesCount`, `childrenCount`.
// Menyangka ada `parentId` membuat semua item dianggap tingkat atas.
export interface MenuListItemFull {
  id: string
  application: { id: string; code: string; name: string }
  parent: { id: string; code: string; label: string } | null
  code: string
  label: string
  icon: string | null
  path: string | null
  isExternal: boolean
  sortOrder: number
  isActive: boolean
  permission: { id: string; code: string; name: string; module: string } | null
  rolesCount: number
  childrenCount: number
  createdAt: string
  updatedAt: string
}

// POST/PATCH /menus — `code` dan `applicationId` terkunci setelah dibuat.
export interface CreateMenuBody {
  applicationId: string
  parentId?: string | null
  code: string
  label: string
  icon?: string | null
  path?: string | null
  isExternal?: boolean
  sortOrder?: number
  isActive?: boolean
  permissionId?: string | null
  roleIds?: string[]
}

export interface UpdateMenuBody {
  parentId?: string | null
  label?: string
  icon?: string | null
  path?: string | null
  isExternal?: boolean
  sortOrder?: number
  isActive?: boolean
  permissionId?: string | null
  roleIds?: string[]
}

// PATCH /menus/reorder — urutan (dan induk) banyak item sekaligus.
export interface ReorderMenusBody {
  applicationId: string
  items: { id: string; sortOrder: number; parentId?: string | null }[]
}

// ─── Organisasi (OPD / Unit Kerja) ────────────────────────────────────────────
// Cermin organizations.schema.ts. Application = batas menu dan permission;
// Organization = batas DATA (hierarki lewat parentId: OPD → UPTD).
export type OrganizationType = 'OPD' | 'UPTD' | 'BIRO' | 'LAINNYA'

export interface OrganizationListItem {
  id: string
  code: string
  name: string
  shortName: string | null
  type: OrganizationType
  parentId: string | null
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  logoFileId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  /**
   * Jumlah sub-unit langsung. Hanya ada di respons DAFTAR
   * (ListOrganizationsResponseSchema). Di endpoint detail, angka ini ada di
   * `counts.children` bersama `userAppRoleScopes`.
   */
  counts?: { children: number }
}

// GET /organizations/:id — detail menambah induk dan hitungan.
export interface OrganizationDetail extends OrganizationListItem {
  parent: { id: string; code: string; name: string } | null
  counts: { children: number; userAppRoleScopes: number }
}
// POST /organizations — `code` unik GLOBAL (entitas pemerintah yang sama di semua aplikasi).
export interface CreateOrganizationBody {
  code: string
  name: string
  shortName?: string | null
  type?: OrganizationType
  parentId?: string | null
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  logoUrl?: string | null
  logoFileId?: string | null
  isActive?: boolean
}

// PUT /organizations/:id — semua field POST kecuali `code`; minimal satu field.
export type UpdateOrganizationBody = Partial<Omit<CreateOrganizationBody, 'code'>>
