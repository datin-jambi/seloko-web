import type { CreateOrganizationBody, OrganizationType, UpdateOrganizationBody } from '@/types/core'

/**
 * Validasi form Organisasi — cermin CreateOrganizationBodySchema /
 * UpdateOrganizationBodySchema di seloko-api/src/modules/core/organizations/
 * organizations.schema.ts. Fungsi murni, diuji lewat npm run check:forms.
 */
export interface OrganizationFormValues {
  code: string
  name: string
  shortName: string
  type: OrganizationType
  parentId: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  isActive: boolean
}

export type OrganizationErrors = Partial<Record<keyof OrganizationFormValues, string>>

export const EMPTY_ORGANIZATION: OrganizationFormValues = {
  code: '',
  name: '',
  shortName: '',
  type: 'OPD',
  parentId: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  isActive: true,
}

export const ORGANIZATION_TYPES: OrganizationType[] = ['OPD', 'UPTD', 'BIRO', 'LAINNYA']

export const ORGANIZATION_TYPE_LABEL: Record<OrganizationType, string> = {
  OPD: 'OPD',
  UPTD: 'UPTD',
  BIRO: 'Biro',
  LAINNYA: 'Lainnya',
}

// Kode dipakai sebagai segmen URL publik (/lapak/opd/<code>) dan kunci seeder.
const CODE_RE = /^[A-Za-z0-9_-]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isUrl = (value: string): boolean => {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateOrganization(v: OrganizationFormValues, isEdit: boolean): OrganizationErrors {
  const e: OrganizationErrors = {}

  // `code` terkunci setelah dibuat — tidak divalidasi saat edit.
  if (!isEdit) {
    const code = v.code.trim()
    if (!code) e.code = 'Kode wajib diisi'
    else if (code.length < 2) e.code = 'Minimal 2 karakter'
    else if (code.length > 50) e.code = 'Maksimal 50 karakter'
    else if (!CODE_RE.test(code)) e.code = 'Hanya huruf, angka, underscore, atau tanda hubung'
  }

  const name = v.name.trim()
  if (!name) e.name = 'Nama wajib diisi'
  else if (name.length < 2) e.name = 'Minimal 2 karakter'
  else if (name.length > 200) e.name = 'Maksimal 200 karakter'

  if (v.shortName.trim().length > 100) e.shortName = 'Maksimal 100 karakter'
  if (v.description.trim().length > 1000) e.description = 'Maksimal 1000 karakter'
  if (v.address.trim().length > 500) e.address = 'Maksimal 500 karakter'
  if (v.phone.trim().length > 30) e.phone = 'Maksimal 30 karakter'

  const email = v.email.trim()
  if (email && (!EMAIL_RE.test(email) || email.length > 100)) e.email = 'Format email tidak valid'

  const website = v.website.trim()
  if (website && (!isUrl(website) || website.length > 255)) e.website = 'URL harus diawali http:// atau https://'

  return e
}

/** String kosong → tidak dikirim (create) atau null (update = mengosongkan). */
const nullableText = <K extends keyof CreateOrganizationBody>(key: K, raw: string, isEdit: boolean) => {
  const t = raw.trim()
  if (t) return { [key]: t } as Partial<CreateOrganizationBody>
  return isEdit ? ({ [key]: null } as Partial<CreateOrganizationBody>) : {}
}

export function buildOrganizationBody(
  v: OrganizationFormValues,
  isEdit: boolean,
): UpdateOrganizationBody {
  const base: UpdateOrganizationBody = {
    name: v.name.trim(),
    type: v.type,
    isActive: v.isActive,
  }

  return {
    ...base,
    ...nullableText('shortName', v.shortName, isEdit),
    ...nullableText('description', v.description, isEdit),
    ...nullableText('address', v.address, isEdit),
    ...nullableText('phone', v.phone, isEdit),
    ...nullableText('email', v.email, isEdit),
    ...nullableText('website', v.website, isEdit),
    // `logoUrl`/`logoFileId` TIDAK di sini: nilainya berasal dari
    // /storage/upload dan ditempelkan pemanggil (OrganizationFormDialog).
    // parentId: kosong = tanpa induk (null saat update, tidak dikirim saat create).
    ...(v.parentId ? { parentId: v.parentId } : isEdit ? { parentId: null } : {}),
  }
}

/** Body POST — wajib membawa `code` karena hanya diisi saat create. */
export function buildCreateOrganizationBody(v: OrganizationFormValues): CreateOrganizationBody {
  const update = buildOrganizationBody(v, false)
  return {
    code: v.code.trim(),
    name: update.name!,
    type: update.type,
    isActive: update.isActive,
    ...update,
  }
}

/**
 * Semua id TURUNAN (anak, cucu, dst.) dari `rootId`.
 * Dipakai untuk mencegah siklus hierarki: organisasi tidak boleh memilih
 * dirinya sendiri atau turunannya sebagai induk.
 */
export function descendantIds<T extends { id: string; parentId: string | null }>(
  all: T[],
  rootId: string,
): Set<string> {
  const children = new Map<string, T[]>()
  for (const o of all) {
    if (!o.parentId) continue
    const list = children.get(o.parentId)
    if (list) list.push(o)
    else children.set(o.parentId, [o])
  }
  const out = new Set<string>()
  const walk = (id: string) => {
    for (const c of children.get(id) ?? []) {
      if (out.has(c.id)) continue // penjaga bila data sudah terlanjur bersiklus
      out.add(c.id)
      walk(c.id)
    }
  }
  walk(rootId)
  return out
}

/**
 * Induk yang boleh dipilih: buang diri sendiri DAN seluruh turunannya.
 * Server tetap menolak siklus (400), tetapi menyingkirkannya di UI mencegah
 * pengguna memilih opsi yang pasti gagal.
 */
export function parentChoices<T extends { id: string; code: string; name: string; parentId: string | null }>(
  all: T[],
  selfId?: string,
): [string, string][] {
  const blocked = selfId ? descendantIds(all, selfId) : new Set<string>()
  if (selfId) blocked.add(selfId)
  return all.filter((o) => !blocked.has(o.id)).map((o) => [o.id, `${o.code} — ${o.name}`])
}
