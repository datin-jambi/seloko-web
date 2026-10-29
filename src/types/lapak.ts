/**
 * Tipe modul Lapak Jambi — cermin schema backend di
 * `../seloko-api/src/modules/lapak/<modul>/<modul>.schema.ts` dan dokumentasi
 * https://seloko.apidog.io/lapak-jambi-11080002f0.
 *
 * Kontrak backend masih berkembang. Semua bentuk respons yang dipakai UI
 * sebaiknya dideklarasikan di sini supaya penyesuaian nanti cukup satu tempat.
 */

/** Satuan tarif. Dipakai kategori (`default*`) dan produk. */
export type PricingUnit =
  | 'SESSION'
  | 'HOUR'
  | 'DAY'
  | 'NIGHT'
  | 'MONTH'
  | 'YEAR'
  | 'PERSON'
  | 'UNIT'
  | 'M2'
  | 'TEST'
  | 'TRIP'

/** Cara ketersediaan dihitung. */
export type AvailabilityType = 'SLOT' | 'DATE_RANGE' | 'CONTRACT' | 'STOCK' | 'SCHEDULE'

/** Bentuk pemenuhan setelah pesanan dibayar. */
export type FulfillmentType = 'TICKET_QR' | 'BOOKING' | 'CONTRACT' | 'SCHEDULE' | 'RESULT' | 'DOCUMENT_SKRD'

/** Status konten — dipakai produk, tarif, dan artikel. */
export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED'

// ─── Kategori Layanan ─────────────────────────────────────────────────────────

/** Objek penuh (CMS). */
export interface LapakCategory {
  id: string
  applicationId: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
  /**
   * Tiga nilai bawaan yang DIWARISI produk baru pada kategori ini.
   * `null` = OPD wajib memilih sendiri saat membuat produk.
   */
  defaultPricingUnit: PricingUnit | null
  defaultAvailabilityType: AvailabilityType | null
  defaultFulfillmentType: FulfillmentType | null
  createdAt: string
  updatedAt: string
}

/** Bentuk ringkas untuk portal (`/public`): hanya 5 field. */
export interface PublicLapakCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
}

export interface CreateLapakCategoryBody {
  name: string
  /** Kebab-case; bila kosong diturunkan server dari `name`. */
  slug?: string
  description?: string | null
  icon?: string | null
  sortOrder?: number
  isActive?: boolean
  defaultPricingUnit?: PricingUnit | null
  defaultAvailabilityType?: AvailabilityType | null
  defaultFulfillmentType?: FulfillmentType | null
}

/** PUT — semua field POST opsional, minimal satu. */
export type UpdateLapakCategoryBody = Partial<CreateLapakCategoryBody>

// ─── Produk / Aset Katalog ────────────────────────────────────────────────────

/** Tipe field persyaratan dokumen produk. */
export type RequirementFieldType = 'FILE' | 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT'

/** Tarif — anak produk. `id` ada = perbarui baris itu (replace-set saat PUT). */
export interface LapakRate {
  id: string
  name: string
  unit: PricingUnit
  price: number
  minQty: number
  maxQty: number | null
  /** `HH:MM` — hanya untuk tarif berbasis slot. */
  startTime: string | null
  endTime: string | null
  status: ContentStatus
  effectiveFrom: string | null
  isActive: boolean
}

export interface LapakAddon {
  id: string
  name: string
  unit: PricingUnit
  price: number
  isActive: boolean
}

export interface LapakRequirement {
  id: string
  label: string
  fieldType: RequirementFieldType
  /** Wajib & hanya boleh untuk `SELECT`. */
  options: string[] | null
  isRequired: boolean
  sortOrder: number
}

export interface LapakFacility {
  id: string
  name: string
  icon: string | null
}

export interface LapakProductImage {
  id: string
  url: string
  fileId: string | null
  altText: string | null
  isPrimary: boolean
  sortOrder: number
}

/** Objek penuh (CMS). */
export interface LapakProduct {
  id: string
  applicationId: string
  organizationId: string
  categoryId: string
  retributionObjectId: string | null
  name: string
  slug: string
  excerpt: string | null
  description: string
  address: string | null
  latitude: number | null
  longitude: number | null
  capacity: number | null
  areaM2: number | null
  pricingUnit: PricingUnit
  availabilityType: AvailabilityType
  fulfillmentType: FulfillmentType
  status: ContentStatus
  publishedAt: string | null
  coverUrl: string | null
  coverFileId: string | null
  organization: { id: string; code: string; name: string }
  category: { id: string; name: string; slug: string }
  rates: LapakRate[]
  addons: LapakAddon[]
  requirements: LapakRequirement[]
  facilities: LapakFacility[]
  images: LapakProductImage[]
  createdAt: string
  updatedAt: string
}

/** Kartu ringkas katalog publik. */
export interface PublicLapakProduct {
  id: string
  name: string
  slug: string
  excerpt: string | null
  coverUrl: string | null
  address: string | null
  pricingUnit: PricingUnit
  /** Tarif aktif termurah. */
  startingPrice: number | null
  organization: { code: string; name: string }
  category: { name: string; slug: string }
}

/** Aksi alur persetujuan (`PATCH /:id/status/:action`). */
export type ProductStatusAction = 'submit' | 'approve' | 'reject' | 'publish' | 'unpublish'

/**
 * Body anak-anak produk. Bentuk kiriman = replace-set saat PUT: item dengan `id`
 * diperbarui, tanpa `id` dibuat, dan yang tidak dikirim di-soft-delete.
 */
export interface ProductRateInput {
  id?: string
  name: string
  unit: PricingUnit
  price: number
  minQty?: number
  maxQty?: number | null
  startTime?: string | null
  endTime?: string | null
  isActive?: boolean
}

export interface ProductAddonInput {
  id?: string
  name: string
  unit: PricingUnit
  price: number
  isActive?: boolean
}

export interface ProductRequirementInput {
  id?: string
  label: string
  fieldType: RequirementFieldType
  options?: string[] | null
  isRequired?: boolean
  sortOrder?: number
}

export interface ProductFacilityInput {
  id?: string
  name: string
  icon?: string | null
}

export interface ProductImageInput {
  id?: string
  url: string
  fileId?: string | null
  altText?: string | null
  isPrimary?: boolean
  sortOrder?: number
}

export interface CreateLapakProductBody {
  organizationId: string
  categoryId: string
  name: string
  slug?: string
  excerpt?: string | null
  description: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  capacity?: number | null
  areaM2?: number | null
  /** `null` = warisi bawaan kategori. */
  pricingUnit?: PricingUnit | null
  availabilityType?: AvailabilityType | null
  fulfillmentType?: FulfillmentType | null
  coverUrl?: string | null
  coverFileId?: string | null
  rates?: ProductRateInput[]
  addons?: ProductAddonInput[]
  requirements?: ProductRequirementInput[]
  facilities?: ProductFacilityInput[]
  images?: ProductImageInput[]
}

/** PUT — semua field POST opsional, minimal satu. */
export type UpdateLapakProductBody = Partial<CreateLapakProductBody>
