import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Pencil, Plus, PowerOff, RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { IconAction } from '@/components/shared/IconAction'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/shared/LoadingSkeleton'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { lapakRateService } from '@/services/lapak/rate.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage } from '@/lib/utils'
import { PRICING_UNIT_LABEL } from '../categories/category-labels'
import { StatusBadge } from './ProductBadges'
import { formatRupiah } from './format-rupiah'
import { RateFormDialog } from './RateFormDialog'
import { useLapakAccess } from '../lapak-access'
import type { LapakRateDetail, RateAction } from '@/types/lapak'

/**
 * Tarif milik satu produk.
 *
 * Dipisah dari form produk karena tarif punya **alur persetujuan sendiri**:
 * `PUT` hanya untuk yang belum disetujui, sedangkan yang sudah `APPROVED`
 * harus lewat `revise` (baris baru) — harga lama tetap berlaku sampai revisi
 * disetujui. Tombol di sini mengikuti aturan itu, bukan sekadar CRUD.
 */
export function ProductRatesCard({ productId }: { productId: string }) {
  const access = useLapakAccess()
  const [form, setForm] = useState<
    { mode: 'create' | 'edit' | 'revise'; rate: LapakRateDetail | null } | null
  >(null)
  const [pending, setPending] = useState<
    | { kind: 'delete'; rate: LapakRateDetail }
    | { kind: 'deactivate'; rate: LapakRateDetail }
    | { kind: 'status'; rate: LapakRateDetail; action: RateAction }
    | null
  >(null)
  const [rejectFor, setRejectFor] = useState<LapakRateDetail | null>(null)

  const q = useQuery({
    queryKey: [...lapakKeys.rates, productId],
    queryFn: () => lapakRateService.list({ productId, limit: '100' }),
  })

  const refresh = () => {
    void q.refetch()
    setPending(null)
  }

  const change = useMutation({
    mutationFn: async () => {
      if (!pending) return
      if (pending.kind === 'delete') return lapakRateService.remove(pending.rate.id)
      if (pending.kind === 'deactivate') return lapakRateService.deactivate(pending.rate.id)
      return lapakRateService.setStatus(pending.rate.id, pending.action)
    },
    onSuccess: () => {
      toast.success('Tarif diperbarui')
      refresh()
    },
    onError: (e) => {
      // 409 = satu-satunya tarif aktif / masih disetujui. Pesan server spesifik.
      toast.error('Gagal memperbarui tarif', { description: apiErrorMessage(e) })
      setPending(null)
    },
  })

  const rows = q.data?.rows ?? []

  if (q.error) return <ErrorState message={apiErrorMessage(q.error)} onRetry={() => void q.refetch()} />
  if (q.isPending)
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    )

  const editable = (r: LapakRateDetail) => r.status === 'DRAFT' || r.status === 'PENDING_REVIEW' || r.status === 'REJECTED'
  const approved = (r: LapakRateDetail) => r.status === 'APPROVED' || r.status === 'PUBLISHED'

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">Tarif ({rows.length})</h2>
        {access.canUpdateProduct && (
          <Button variant="outline" size="sm" onClick={() => setForm({ mode: 'create', rate: null })}>
            <Plus />
            Tambah tarif
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">Belum ada tarif. Produk tanpa tarif tampil sebagai Rp0.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{r.name}</span>
                  <StatusBadge status={r.status} />
                  {!r.isActive && <span className="text-xs text-muted-foreground">nonaktif</span>}
                </div>
                <div className="text-xs tabular-nums text-muted-foreground">
                  {formatRupiah(r.price)}
                  <span> /{PRICING_UNIT_LABEL[r.unit].toLowerCase()}</span>
                  {r.startTime && r.endTime && <span className="ml-1">· {r.startTime}–{r.endTime}</span>}
                  {r.maxQty != null && <span className="ml-1">· maks {r.maxQty}</span>}
                </div>
              </div>

              {access.canUpdateProduct && (
                <div className="flex shrink-0 items-center gap-1">
                  {/* Belum disetujui → ubah langsung. Sudah disetujui → revisi. */}
                  {editable(r) && (
                    <IconAction
                      icon={Pencil}
                      tone="warning"
                      label={`Ubah tarif ${r.name}`}
                      onClick={() => setForm({ mode: 'edit', rate: r })}
                    />
                  )}
                  {approved(r) && (
                    <IconAction
                      icon={RotateCcw}
                      tone="warning"
                      label={`Revisi tarif ${r.name}`}
                      onClick={() => setForm({ mode: 'revise', rate: r })}
                    />
                  )}
                  {(r.status === 'DRAFT' || r.status === 'REJECTED') && (
                    <IconAction
                      icon={Check}
                      tone="success"
                      label={`Ajukan tarif ${r.name} untuk review`}
                      onClick={() => setPending({ kind: 'status', rate: r, action: 'submit' })}
                    />
                  )}
                  {r.status === 'PENDING_REVIEW' && access.canApproveProduct && (
                    <>
                      <IconAction
                        icon={Check}
                        tone="success"
                        label={`Setujui tarif ${r.name}`}
                        onClick={() => setPending({ kind: 'status', rate: r, action: 'approve' })}
                      />
                      <IconAction
                        icon={X}
                        tone="destructive"
                        label={`Tolak tarif ${r.name}`}
                        onClick={() => setRejectFor(r)}
                      />
                    </>
                  )}
                  {r.isActive && approved(r) && (
                    <IconAction
                      icon={PowerOff}
                      tone="neutral"
                      label={`Nonaktifkan tarif ${r.name}`}
                      onClick={() => setPending({ kind: 'deactivate', rate: r })}
                    />
                  )}
                  {access.canDeleteProduct && (
                    <IconAction
                      icon={Trash2}
                      tone="destructive"
                      label={`Hapus tarif ${r.name}`}
                      onClick={() => setPending({ kind: 'delete', rate: r })}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {form && (
        <RateFormDialog
          key={`${form.mode}-${form.rate?.id ?? 'baru'}`}
          open
          onOpenChange={(o) => !o && setForm(null)}
          productId={productId}
          rate={form.rate}
          mode={form.mode}
          onSaved={refresh}
        />
      )}

      {rejectFor && (
        <RejectRateDialog
          rate={rejectFor}
          onClose={() => setRejectFor(null)}
          onDone={refresh}
        />
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        pending={change.isPending}
        {...(pending?.kind === 'delete'
          ? {
              title: `Hapus tarif ${pending.rate.name}?`,
              description:
                'Tarif dihapus (soft-delete). Tarif aktif yang sudah disetujui ditolak server — nonaktifkan dulu.',
              confirmLabel: 'Hapus',
              destructive: true,
              onConfirm: () => change.mutate(),
            }
          : pending?.kind === 'deactivate'
            ? {
                title: `Nonaktifkan tarif ${pending.rate.name}?`,
                description:
                  'Tarif disembunyikan dari portal publik tanpa menghapus riwayat. Server menolak bila ini satu-satunya tarif aktif.',
                confirmLabel: 'Nonaktifkan',
                destructive: true,
                onConfirm: () => change.mutate(),
              }
            : pending?.kind === 'status'
              ? {
                  title:
                    pending.action === 'submit'
                      ? `Ajukan tarif ${pending.rate.name} untuk review?`
                      : `Setujui tarif ${pending.rate.name}?`,
                  description:
                    pending.action === 'submit'
                      ? 'Tarif masuk antrean review. Selama menunggu, tarif tidak bisa diubah.'
                      : 'Tarif disetujui dan menjadi harga yang berlaku di portal publik.',
                  confirmLabel: pending.action === 'submit' ? 'Ajukan' : 'Setujui',
                  destructive: false,
                  onConfirm: () => change.mutate(),
                }
              : { title: '', description: '', confirmLabel: '', onConfirm: () => {} })}
      />
    </section>
  )
}

/** `reject` mewajibkan `note` — validasi ada di server, jadi form ini wajib. */
function RejectRateDialog({
  rate,
  onClose,
  onDone,
}: {
  rate: LapakRateDetail
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()

  const reject = useMutation({
    mutationFn: () => lapakRateService.setStatus(rate.id, 'reject', { note: note.trim() }),
    onSuccess: () => {
      toast.success(`Tarif ${rate.name} ditolak`)
      onDone()
      onClose()
    },
    onError: (e) => toast.error('Gagal menolak tarif', { description: apiErrorMessage(e) }),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!note.trim()) {
              setError('Alasan penolakan wajib diisi.')
              return
            }
            reject.mutate()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader>
            <DialogTitle>Tolak tarif {rate.name}</DialogTitle>
            <DialogDescription>Alasan wajib diisi agar penulis tahu apa yang harus diperbaiki.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FormField id="reject-note" label="Alasan penolakan" required error={error}>
              <Input
                id="reject-note"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value)
                  setError(undefined)
                }}
                maxLength={500}
                placeholder="Harga belum sesuai Perda…"
                autoFocus
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={reject.isPending}>
              Tolak
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
