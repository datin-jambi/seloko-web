import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate } from '@/components/shared/DataTable'
import { FilterSelect } from '@/components/shared/SearchBar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RowActions } from '@/components/shared/RowActions'
import { Badge } from '@/components/ui/badge'
import { lapakPaymentService } from '@/services/lapak/payment.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, formatDateTime } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import { formatRupiah } from '../products/format-rupiah'
import type { LapakPayment, LapakPaymentStatus } from '@/types/lapak'

const STATUS_LABEL: Record<LapakPaymentStatus, string> = {
  MENUNGGU_BUKTI: 'Menunggu bukti',
  MENUNGGU_KONFIRMASI: 'Menunggu konfirmasi',
  LUNAS: 'Lunas',
  DITOLAK: 'Ditolak',
  KEDALUWARSA: 'Kedaluwarsa',
}

const STATUS_TONE: Record<LapakPaymentStatus, string> = {
  MENUNGGU_BUKTI: 'border-transparent bg-muted text-muted-foreground',
  MENUNGGU_KONFIRMASI: 'border-transparent bg-warning/15 text-warning-foreground',
  LUNAS: 'border-transparent bg-success/10 text-success',
  DITOLAK: 'border-transparent bg-destructive/10 text-destructive',
  KEDALUWARSA: 'border-transparent bg-muted text-muted-foreground',
}

const STATUS_OPTIONS = Object.entries(STATUS_LABEL) as [string, string][]

/**
 * Pembayaran transfer manual — `/lapak-jambi/pembayaran`.
 * Konfirmasi mencatat nominal tagihan. Bila uang kurang, server menolak (400) —
 * admin tidak bisa menandai lunas dengan nominal kurang.
 * Tolak wajib alasan 5–500 karakter; dibaca warga.
 */
export function LapakPaymentsPage() {
  const access = useLapakAccess()
  const list = useLapakList<LapakPayment>('/lapak/payments')
  const qc = useQueryClient()
  const [verifying, setVerifying] = useState<LapakPayment | null>(null)
  const [rejecting, setRejecting] = useState<LapakPayment | null>(null)
  const [reason, setReason] = useState('')
  const [reasonErr, setReasonErr] = useState<string>()

  const closeReject = () => {
    setRejecting(null)
    setReason('')
    setReasonErr(undefined)
  }

  const verify = useMutation({
    mutationFn: (p: LapakPayment) => lapakPaymentService.verify(p.id, {}),
    onSuccess: (p) => {
      toast.success(`Pembayaran ${p.orderCode} dikonfirmasi lunas`)
      void qc.invalidateQueries({ queryKey: lapakKeys.all })
      setVerifying(null)
    },
    onError: (e) => toast.error('Gagal mengonfirmasi', { description: apiErrorMessage(e) }),
  })

  const reject = useMutation({
    mutationFn: (p: LapakPayment) => lapakPaymentService.reject(p.id, { reason: reason.trim() }),
    onSuccess: (p) => {
      toast.success(`Bukti ${p.orderCode} ditolak`)
      void qc.invalidateQueries({ queryKey: lapakKeys.all })
      closeReject()
    },
    onError: (e) => toast.error('Gagal menolak', { description: apiErrorMessage(e) }),
  })

  const submitReject = () => {
    if (!rejecting) return
    if (reason.trim().length < 5) return setReasonErr('Alasan minimal 5 karakter, akan dibaca warga.')
    setReasonErr(undefined)
    reject.mutate(rejecting)
  }

  return (
    <>
      <PageHeader
        title="Pembayaran"
        description="Konfirmasi transfer manual. Bukti yang menunggu konfirmasi ditampilkan lebih dulu."
      />

      <DataTable
        list={list}
        columns={[
          {
            header: 'Pesanan',
            cell: (p) => (
              <div className="min-w-0">
                <span className="font-mono text-sm font-medium">{p.orderCode}</span>
                <div className="text-xs text-muted-foreground">{p.organization.name}</div>
              </div>
            ),
          },
          {
            header: 'Pengirim',
            cell: (p) => (
              <div className="text-sm">
                <Truncate text={p.senderName} />
                <span className="text-xs text-muted-foreground">{p.senderBank ?? ''}</span>
              </div>
            ),
          },
          { header: 'Nominal', cell: (p) => <span className="tabular-nums">{formatRupiah(p.amount)}</span> },
          {
            header: 'Dibayar',
            cell: (p) => <span className="text-sm">{p.paidAt ? formatDateTime(p.paidAt) : '—'}</span>,
          },
          {
            header: 'Status',
            cell: (p) => (
              <Badge variant="outline" className={STATUS_TONE[p.status]}>
                {STATUS_LABEL[p.status]}
              </Badge>
            ),
          },
        ]}
        rowKey={(p) => p.id}
        emptyTitle="Belum ada pembayaran"
        toolbar={
          <FilterSelect
            label="Status"
            value={list.params.status}
            options={STATUS_OPTIONS}
            onChange={(v) => list.setFilter('status', v)}
          />
        }
        actions={(p) => (
          <RowActions
            label={`Aksi pembayaran ${p.orderCode}`}
            actions={[
              {
                label: 'Konfirmasi lunas',
                icon: Check,
                show: access.canVerifyPayment && p.status === 'MENUNGGU_KONFIRMASI',
                onSelect: () => setVerifying(p),
              },
              {
                label: 'Tolak bukti',
                icon: X,
                destructive: true,
                show: access.canVerifyPayment && p.status === 'MENUNGGU_KONFIRMASI',
                onSelect: () => setRejecting(p),
              },
            ]}
          />
        )}
      />

      <ConfirmDialog
        open={!!verifying}
        onOpenChange={(o) => !o && setVerifying(null)}
        pending={verify.isPending}
        title={`Konfirmasi lunas ${verifying?.orderCode ?? ''}?`}
        description={
          verifying
            ? `Nominal ${formatRupiah(verifying.amount)} dicatat lunas. Pesanan dan SKRD ikut lunas dalam satu langkah.`
            : ''
        }
        confirmLabel="Konfirmasi"
        onConfirm={() => verifying && verify.mutate(verifying)}
      />

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && closeReject()}
        pending={reject.isPending}
        title={`Tolak bukti ${rejecting?.orderCode ?? ''}?`}
        description={
          <div className="space-y-2">
            <p>Warga diminta mengunggah ulang bukti. Alasan ini akan dibaca warga.</p>
            <input
              aria-label="Alasan penolakan"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: nominal tidak sesuai tagihan"
            />
            {reasonErr && <p className="text-xs text-destructive">{reasonErr}</p>}
          </div>
        }
        confirmLabel="Tolak"
        destructive
        onConfirm={submitReject}
      />
    </>
  )
}
