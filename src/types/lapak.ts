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

// ─── Tarif produk (entitas ber-status sendiri) ─────────────────────────────────

/**
 * Tarif adalah entitas TERPISAH dari produk: produk bisa `PUBLISHED` sementara
 * tarifnya masih `DRAFT`, dan revisi harga tidak menurunkan status produk.
 *
 * Alur: DRAFT → PENDING_REVIEW → APPROVED, dengan REJECTED kembali ke PENDING_REVIEW.
 * Portal publik hanya menyajikan `APPROVED`/`PUBLISHED` yang `effectiveFrom`-nya
 * sudah tercapai.
 */
export interface LapakRateDetail {
  id: string
  productId: string
  name: string
  unit: PricingUnit
  price: number
  minQty: number
  maxQty: number | null
  /** `HH:MM` */
  startTime: string | null
  endTime: string | null
  status: ContentStatus
  /** Publik baru melihat tarif setelah tanggal ini. */
  effectiveFrom: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type RateAction = 'submit' | 'approve' | 'reject'

export interface CreateRateBody {
  name: string
  unit: PricingUnit
  price: number
  minQty?: number
  maxQty?: number | null
  startTime?: string | null
  endTime?: string | null
  effectiveFrom?: string | null
  isActive?: boolean
}

/** PUT — semua opsional, minimal satu. */
export type UpdateRateBody = Partial<CreateRateBody>

export interface RateStatusBody {
  /** Wajib saat `reject`. */
  note?: string
}

// ─── Pengguna Lapak (GET /lapak/users) ────────────────────────────────────────

/** Satu penugasan role Lapak milik pengguna. */
export interface LapakUserRole {
  /** ID penugasan (UserAppRole) — bukan roleId. */
  assignmentId: string
  roleId: string
  roleName: string
  expiresAt: string | null
  /** Kosong = berlaku untuk seluruh OPD. */
  organizations: { id: string; code: string; name: string }[]
}

/**
 * Pengguna yang punya penugasan role aktif di aplikasi Lapak.
 * Superadmin tanpa penugasan tidak ikut — halaman ini mendata "siapa yang
 * terdaftar di Lapak", bukan "siapa yang bisa mengakses Lapak".
 */
export interface LapakUser {
  id: string
  fullName: string
  email: string
  username: string | null
  nip: string | null
  phoneNumber: string | null
  avatarUrl: string | null
  accountType: 'INTERNAL' | 'PUBLIC'
  isActive: boolean
  isSuperAdmin: boolean
  lastLoginAt: string | null
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
  roles: LapakUserRole[]
}

/** Pilihan role yang boleh diberikan lewat halaman Lapak (`GET /lapak/users/roles`). */
export interface LapakRoleOption {
  id: string
  name: string
  description: string | null
  /** Audiens role — harus sama dengan jenis akun pengguna. */
  audience: 'INTERNAL' | 'PUBLIC'
}

/** Satu role yang dikirim saat menambah/mengubah pengguna. */
export interface LapakRoleAssignmentInput {
  roleId: string
  /** Kosong = seluruh OPD. */
  organizationIds?: string[]
}

export interface CreateLapakUserBody {
  fullName: string
  /** Wajib untuk INTERNAL; kosong untuk PUBLIC (warga masuk dengan email). */
  username?: string
  email: string
  password: string
  nip?: string
  phoneNumber?: string
  /** INTERNAL = pegawai, PUBLIC = warga/eksternal. */
  accountType?: 'INTERNAL' | 'PUBLIC'
  roles: LapakRoleAssignmentInput[]
}

export interface UpdateLapakUserBody {
  fullName?: string
  nip?: string | null
  phoneNumber?: string | null
  /** Reset kata sandi (opsional, hanya bila diisi). */
  password?: string
  /** Replace-set untuk aplikasi Lapak saja. */
  roles?: LapakRoleAssignmentInput[]
}

// ─── Jadwal Produk (availability) ─────────────────────────────────────────────

/** Satu baris jam buka. Hari tanpa baris = tutup. `weekday` 0 = Minggu … 6 = Sabtu. */
export interface LapakOperatingHour {
  id: string
  weekday: number
  /** HH:MM. `closeTime` < `openTime` = lintas tengah malam. */
  openTime: string
  closeTime: string
}

export interface ReplaceHoursBody {
  hours: { weekday: number; openTime: string; closeTime: string }[]
}

/** Rentang tanggal tutup (inklusif), YYYY-MM-DD. */
export interface LapakBlackout {
  id: string
  startDate: string
  endDate: string
  reason: string | null
}

export interface CreateBlackoutBody {
  startDate: string
  endDate: string
  reason?: string
}

// ─── Pesanan (CMS, daftar saja) ───────────────────────────────────────────────

export type OrderStatus =
  | 'DRAFT'
  | 'MENUNGGU_VERIFIKASI'
  | 'MENUNGGU_PEMBAYARAN'
  | 'MENUNGGU_KONFIRMASI'
  | 'LUNAS'
  | 'AKTIF'
  | 'SELESAI'
  | 'DITOLAK'
  | 'DIBATALKAN'
  | 'KEDALUWARSA'
  | 'REFUND'

export interface LapakOrderItem {
  id: string
  productId: string
  productName: string
  rateName: string
  unit: string
  price: number
  qty: number
  lineTotal: number
  startAt: string | null
  endAt: string | null
  note: string | null
}

/** Pemohon yang sudah dimasking server (NIK `1234********3456`, telepon `0812****7890`). */
export interface LapakOrderApplicant {
  name: string
  nik: string | null
  npwp: string | null
  phone: string | null
  email: string | null
  institution: string | null
  address: string | null
}

/** Ringkasan SKRD yang menempel pada pesanan (null bila belum terbit). */
export interface LapakOrderSkrd {
  id: string
  number: string
  documentType: 'SKRD' | 'DIPERSAMAKAN'
  issuer: 'BAPENDA' | 'OPD'
  issuerCode: string
  issuerName: string
  amount: number
  issuedAt: string
  dueAt: string
  status: 'TERBIT' | 'LUNAS' | 'CANCELLED'
}

export interface LapakOrder {
  id: string
  code: string
  status: OrderStatus
  organization: { code: string; name: string }
  items: LapakOrderItem[]
  subtotal: number
  total: number
  purpose: string | null
  expiresAt: string | null
  createdAt: string
  skrd: LapakOrderSkrd | null
  applicant: LapakOrderApplicant
}

// ─── Pembayaran, Tiket, SKRD, Laporan ─────────────────────────────────────────

export type LapakPaymentStatus =
  | 'MENUNGGU_BUKTI'
  | 'MENUNGGU_KONFIRMASI'
  | 'LUNAS'
  | 'DITOLAK'
  | 'KEDALUWARSA'

export interface LapakPayment {
  id: string
  orderId: string
  orderCode: string
  method: 'MANUAL_TRANSFER'
  status: LapakPaymentStatus
  amount: number
  organization: { code: string; name: string }
  bank: { name: string | null; account: string | null; holder: string | null }
  proofUrl: string | null
  proofFileId: string | null
  senderName: string | null
  senderBank: string | null
  note: string | null
  rejectReason: string | null
  paidAt: string | null
  confirmedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface VerifyPaymentBody {
  /** Opsional. Bila diisi, nilai ini yang dicatat (kelebihan bayar / pembulatan bank). */
  amount?: number
  note?: string
}

export interface RejectPaymentBody {
  /** Wajib, 5–500 karakter. Dibaca warga. */
  reason: string
}

export type LapakTicketStatus = 'AKTIF' | 'DIGUNAKAN' | 'KEDALUWARSA' | 'DIBATALKAN'
export type LapakTicketKind = 'TICKET' | 'BOOKING' | 'CONTRACT' | 'RESULT' | 'SCHEDULE' | 'HANDOVER'

export interface LapakTicket {
  id: string
  orderItemId: string
  orderId: string
  orderCode: string
  kind: LapakTicketKind
  code: string
  status: LapakTicketStatus
  productName: string
  rateName: string
  organization: { code: string; name: string }
  validFrom: string | null
  validUntil: string | null
  usedAt: string | null
  createdAt: string
}

export type SkrdStatus = 'TERBIT' | 'LUNAS' | 'CANCELLED'

export interface LapakSkrd {
  id: string
  number: string
  documentType: 'SKRD' | 'DIPERSAMAKAN'
  issuer: 'BAPENDA' | 'OPD'
  issuerCode: string
  issuerName: string
  amount: number
  issuedAt: string
  dueAt: string
  status: SkrdStatus
  orderCode: string
  applicantName: string
}

export interface LapakSkrdSetting {
  id: string
  organizationCode: string | null
  issuer: 'BAPENDA' | 'OPD'
  numberFormat: string
  signerName: string
  signerNip: string | null
  signerPosition: string | null
  bankName: string | null
  bankAccount: string | null
  bankHolder: string | null
  dueDays: number
  isActive: boolean
}

export interface SkrdSettingBody {
  organizationCode?: string
  issuer: 'BAPENDA' | 'OPD'
  numberFormat: string
  signerName: string
  signerNip?: string
  signerPosition?: string
  bankName?: string
  bankAccount?: string
  bankHolder?: string
  dueDays: number
}

export interface LapakTransactionRow {
  orderId: string
  code: string
  createdAt: string
  organizationCode: string
  organizationName: string
  status: OrderStatus
  amount: number
  skrdNumber: string | null
  skrdStatus: string | null
  paymentStatus: string | null
  paidAt: string | null
  applicantName: string
  purpose: string | null
  itemCount: number
  tickets: { total: number; used: number }
}

export interface LapakTransactionSummary {
  totalAmount: number
  totalOrders: number
  byStatus: { status: OrderStatus; count: number; amount: number }[]
}
