import { lapakGet, lapakGetPage, lapakWrite } from './lapak-client'
import type { LapakPayment, LapakPaymentStatus, VerifyPaymentBody, RejectPaymentBody } from '@/types/lapak'

/**
 * Pembayaran transfer manual — `/api/lapak/payments`.
 * Daftar CMS (`GET /`) butuh `payment:read`, konfirmasi & tolak butuh `payment:approve`.
 */
export const lapakPaymentService = {
  list: (params: Record<string, string>) => lapakGetPage<LapakPayment>('/lapak/payments', params),
  get: (id: string) => lapakGet<LapakPayment>(`/lapak/payments/${id}`),
  verify: (id: string, body: VerifyPaymentBody) =>
    lapakWrite<LapakPayment>('post', `/lapak/payments/${id}/verify`, body),
  reject: (id: string, body: RejectPaymentBody) =>
    lapakWrite<LapakPayment>('post', `/lapak/payments/${id}/reject`, body),
}

export type { LapakPaymentStatus }
