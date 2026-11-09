import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ticket } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { FilterSelect } from '@/components/shared/SearchBar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RowActions } from '@/components/shared/RowActions'
import { Badge } from '@/components/ui/badge'
import { lapakTicketService } from '@/services/lapak/ticket.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, formatDateTime } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import type { LapakTicket, LapakTicketKind, LapakTicketStatus } from '@/types/lapak'

const STATUS_LABEL: Record<LapakTicketStatus, string> = {
  AKTIF: 'Aktif',
  DIGUNAKAN: 'Digunakan',
  KEDALUWARSA: 'Kedaluwarsa',
  DIBATALKAN: 'Dibatalkan',
}

const STATUS_TONE: Record<LapakTicketStatus, string> = {
  AKTIF: 'border-transparent bg-success/10 text-success',
  DIGUNAKAN: 'border-transparent bg-muted text-muted-foreground',
  KEDALUWARSA: 'border-transparent bg-muted text-muted-foreground',
  DIBATALKAN: 'border-transparent bg-destructive/10 text-destructive',
}

const KIND_LABEL: Record<LapakTicketKind, string> = {
  TICKET: 'Tiket',
  BOOKING: 'Booking',
  CONTRACT: 'Kontrak',
  RESULT: 'Hasil',
  SCHEDULE: 'Jadwal',
  HANDOVER: 'Serah terima',
}

const STATUS_OPTIONS = Object.entries(STATUS_LABEL) as [string, string][]

/**
 * Tiket QR & check-in — `/lapak-jambi/tiket`. Tiket terbit saat pesanan LUNAS.
 * Tandai terpakai itu sekali pakai; server menolak 409 bila sudah dipakai.
 */
export function LapakTicketsPage() {
  const access = useLapakAccess()
  const list = useLapakList<LapakTicket>('/lapak/tickets')
  const qc = useQueryClient()
  const [using, setUsing] = useState<LapakTicket | null>(null)

  const use = useMutation({
    mutationFn: (t: LapakTicket) => lapakTicketService.use(t.id),
    onSuccess: (t) => {
      toast.success(`Tiket ${t.code} ditandai terpakai`)
      void qc.invalidateQueries({ queryKey: lapakKeys.tickets })
      setUsing(null)
    },
    onError: (e) => toast.error('Gagal menandai tiket', { description: apiErrorMessage(e) }),
  })

  return (
    <>
      <PageHeader
        title="Tiket & Check-in"
        description="Tiket terbit setelah pesanan lunas. Sekali pakai, tandai saat petugas melakukan scan."
      />

      <DataTable
        list={list}
        columns={[
          {
            header: 'Kode tiket',
            cell: (t) => (
              <div className="min-w-0">
                <span className="font-mono text-sm font-medium">{t.code}</span>
                <div className="text-xs text-muted-foreground">
                  {t.orderCode} · {KIND_LABEL[t.kind]}
                </div>
              </div>
            ),
          },
          {
            header: 'Produk',
            cell: (t) => (
              <div className="text-sm">
                {t.productName}
                <div className="text-xs text-muted-foreground">{t.rateName}</div>
              </div>
            ),
          },
          {
            header: 'Berlaku',
            cell: (t) => (
              <span className="text-xs text-muted-foreground">
                {t.validFrom ? formatDateTime(t.validFrom) : '—'}
                {t.validUntil ? ` s/d ${formatDateTime(t.validUntil)}` : ''}
              </span>
            ),
          },
          {
            header: 'Status',
            cell: (t) => (
              <Badge variant="outline" className={STATUS_TONE[t.status]}>
                {STATUS_LABEL[t.status]}
              </Badge>
            ),
          },
        ]}
        rowKey={(t) => t.id}
        emptyTitle="Belum ada tiket"
        toolbar={
          <FilterSelect
            label="Status"
            value={list.params.status}
            options={STATUS_OPTIONS}
            onChange={(v) => list.setFilter('status', v)}
          />
        }
        actions={(t) => (
          <RowActions
            label={`Aksi tiket ${t.code}`}
            actions={[
              {
                label: 'Tandai terpakai',
                icon: Ticket,
                show: access.canUseTicket && t.status === 'AKTIF',
                onSelect: () => setUsing(t),
              },
            ]}
          />
        )}
      />

      <ConfirmDialog
        open={!!using}
        onOpenChange={(o) => !o && setUsing(null)}
        pending={use.isPending}
        title={`Tandai ${using?.code ?? ''} terpakai?`}
        description="Tiket tidak bisa dipakai lagi setelah ditandai. Pastikan pengunjung sudah diperiksa."
        confirmLabel="Tandai terpakai"
        onConfirm={() => using && use.mutate(using)}
      />
    </>
  )
}
