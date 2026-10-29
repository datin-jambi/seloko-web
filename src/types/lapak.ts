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
