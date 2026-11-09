import { lapakGetPage, lapakWrite } from './lapak-client'
import type { LapakTicket } from '@/types/lapak'

/** Tiket QR & check-in — `/api/lapak/tickets`. Scan petugas butuh `ticket:approve`. */
export const lapakTicketService = {
  list: (params: Record<string, string>) => lapakGetPage<LapakTicket>('/lapak/tickets', params),
  use: (id: string, note?: string) =>
    lapakWrite<LapakTicket>('post', `/lapak/tickets/${id}/use`, note ? { note } : {}),
}
