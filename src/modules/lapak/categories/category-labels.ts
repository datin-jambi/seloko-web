import type { AvailabilityType, FulfillmentType, PricingUnit } from '@/types/lapak'

/** Label manusiawi untuk enum backend — satu sumber, dipakai halaman & form. */
export const PRICING_UNIT_LABEL: Record<PricingUnit, string> = {
  SESSION: 'Sesi',
  HOUR: 'Jam',
  DAY: 'Hari',
  NIGHT: 'Malam',
  MONTH: 'Bulan',
  YEAR: 'Tahun',
  PERSON: 'Orang',
  UNIT: 'Unit',
  M2: 'm²',
  TEST: 'Tes',
  TRIP: 'Perjalanan',
}

export const AVAILABILITY_LABEL: Record<AvailabilityType, string> = {
  SLOT: 'Slot waktu',
  DATE_RANGE: 'Rentang tanggal',
  CONTRACT: 'Kontrak',
  STOCK: 'Stok',
  SCHEDULE: 'Jadwal',
}

export const FULFILLMENT_LABEL: Record<FulfillmentType, string> = {
  TICKET_QR: 'Tiket QR',
  BOOKING: 'Booking',
  CONTRACT: 'Kontrak',
  SCHEDULE: 'Jadwal',
  RESULT: 'Hasil',
  DOCUMENT_SKRD: 'Dokumen SKRD',
}

const tuple = <T extends string>(m: Record<T, string>): [T, string][] =>
  (Object.entries(m) as [T, string][]).map(([k, v]) => [k, v])

export const PRICING_UNIT_OPTIONS = tuple(PRICING_UNIT_LABEL)
export const AVAILABILITY_OPTIONS = tuple(AVAILABILITY_LABEL)
export const FULFILLMENT_OPTIONS = tuple(FULFILLMENT_LABEL)
