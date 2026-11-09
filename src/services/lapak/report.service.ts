import { apiClient } from '@/lib/api-client'
import { lapakGetPage } from './lapak-client'
import type { LapakTransactionRow, LapakTransactionSummary } from '@/types/lapak'

/** Laporan transaksi — `/api/lapak/reports`. Ekspor CSV butuh `report:export`. */
export const lapakReportService = {
  transactions: (params: Record<string, string>) =>
    lapakGetPage<LapakTransactionRow, LapakTransactionSummary>('/lapak/reports/transactions', params),
  /** Unduh CSV. Respons bukan envelope JSON, jadi tidak lewat lapakGetPage. */
  exportCsv: async (params: Record<string, string>) => {
    const res = await apiClient.get<Blob>('/lapak/reports/transactions/export', {
      params,
      responseType: 'blob',
    })
    return res.data
  },
}
