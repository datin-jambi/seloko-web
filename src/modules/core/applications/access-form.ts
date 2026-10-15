import type { Audience } from '@/types/core'

// Cermin CreateRoleBodySchema & CreatePermissionBodySchema
// (../seloko-api/src/modules/core/roles/roles.schema.ts, permissions/permissions.schema.ts).
// Server tetap memvalidasi; ini hanya agar operator tahu salahnya sebelum submit.

export type RoleFormValues = { name: string; description: string; audience: Audience; isActive: boolean }
export type PermissionFormValues = { code: string; name: string; module: string }

type Errors<T> = Partial<Record<keyof T, string>>

export function validateRole(v: RoleFormValues): Errors<RoleFormValues> {
  const e: Errors<RoleFormValues> = {}
  if (v.name.trim().length < 3) e.name = 'Nama role minimal 3 karakter'
  else if (v.name.trim().length > 50) e.name = 'Nama role maksimal 50 karakter'
  else if (!/^[a-z0-9-]+$/.test(v.name.trim()))
    e.name = 'Hanya huruf kecil, angka, atau tanda hubung'
  if (v.description.length > 500) e.description = 'Deskripsi maksimal 500 karakter'
  return e
}

export function validatePermission(v: PermissionFormValues): Errors<PermissionFormValues> {
  const e: Errors<PermissionFormValues> = {}
  const code = v.code.trim()
  if (code.length < 3) e.code = 'Kode minimal 3 karakter'
  else if (code.length > 100) e.code = 'Kode maksimal 100 karakter'
  else if (!/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(code))
    e.code = 'Format <entity>:<action>, contoh user:list'

  const name = v.name.trim()
  if (name.length < 3) e.name = 'Nama minimal 3 karakter'
  else if (name.length > 150) e.name = 'Nama maksimal 150 karakter'

  const module = v.module.trim()
  if (module.length < 2) e.module = 'Modul minimal 2 karakter'
  else if (module.length > 50) e.module = 'Modul maksimal 50 karakter'
  return e
}
