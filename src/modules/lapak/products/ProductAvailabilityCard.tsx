import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { IconAction } from '@/components/shared/IconAction'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/shared/LoadingSkeleton'
import { lapakAvailabilityService } from '@/services/lapak/availability.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, apiFieldErrors, cn } from '@/lib/utils'
import { useLapakAccess } from '../lapak-access'
import type { LapakBlackout, LapakOperatingHour } from '@/types/lapak'

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

type DayRow = { open: boolean; openTime: string; closeTime: string }

/**
 * Jadwal satu produk: jam operasional mingguan + tanggal tutup.
 *
 * Jam disimpan sebagai replace-set (satu `PUT` untuk seluruh minggu), sesuai
 * backend. Hari yang tidak dicentang = tutup. Jam tutup < jam buka dianggap
 * lintas tengah malam oleh server, jadi tidak diblokir di sini.
 */
export function ProductAvailabilityCard({ productId }: { productId: string }) {
  const access = useLapakAccess()
  const q = useQuery({
    queryKey: lapakKeys.availability(productId),
    queryFn: async () => ({
      hours: await lapakAvailabilityService.hours(productId),
      blackouts: await lapakAvailabilityService.blackouts(productId),
    }),
  })

  if (q.error) return <ErrorState message={apiErrorMessage(q.error)} onRetry={() => void q.refetch()} />
  if (q.isPending)
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    )

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Jadwal</h2>
      <HoursForm
        key={JSON.stringify(q.data.hours)}
        productId={productId}
        hours={q.data.hours}
        canEdit={access.canUpdateProduct}
        onSaved={() => void q.refetch()}
      />
      <BlackoutList
        productId={productId}
        blackouts={q.data.blackouts}
        canEdit={access.canUpdateProduct}
        onChanged={() => void q.refetch()}
      />
    </section>
  )
}

function HoursForm({
  productId,
  hours,
  canEdit,
  onSaved,
}: {
  productId: string
  hours: LapakOperatingHour[]
  canEdit: boolean
  onSaved: () => void
}) {
  const [rows, setRows] = useState<DayRow[]>(() =>
    Array.from({ length: 7 }, (_, d) => {
      const h = hours.find((x) => x.weekday === d)
      return { open: !!h, openTime: h?.openTime ?? '08:00', closeTime: h?.closeTime ?? '16:00' }
    }),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: () =>
      lapakAvailabilityService.replaceHours(productId, {
        hours: rows.flatMap((r, weekday) =>
          r.open ? [{ weekday, openTime: r.openTime, closeTime: r.closeTime }] : [],
        ),
      }),
    onSuccess: () => {
      toast.success('Jam operasional disimpan')
      setErrors({})
      onSaved()
    },
    onError: (e) => {
      setErrors(apiFieldErrors(e))
      toast.error('Gagal menyimpan jam operasional', { description: apiErrorMessage(e) })
    },
  })

  const setRow = (i: number, patch: Partial<DayRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const submit = () => {
    const bad: Record<string, string> = {}
    rows.forEach((r, i) => {
      if (!r.open) return
      if (!TIME.test(r.openTime) || !TIME.test(r.closeTime)) bad[`hours.${i}`] = 'Format jam HH:MM'
    })
    if (Object.keys(bad).length) return setErrors(bad)
    save.mutate()
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground">Jam operasional mingguan</h3>
      <ul className="divide-y divide-border rounded-md border border-border">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
            <label className="flex w-28 items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={r.open}
                disabled={!canEdit}
                onChange={(e) => setRow(i, { open: e.target.checked })}
              />
              <span className={cn(!r.open && 'text-muted-foreground')}>{DAYS[i]}</span>
            </label>
            {r.open ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  aria-label={`Jam buka ${DAYS[i]}`}
                  className="h-8 w-28"
                  value={r.openTime}
                  disabled={!canEdit}
                  onChange={(e) => setRow(i, { openTime: e.target.value })}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  aria-label={`Jam tutup ${DAYS[i]}`}
                  className="h-8 w-28"
                  value={r.closeTime}
                  disabled={!canEdit}
                  onChange={(e) => setRow(i, { closeTime: e.target.value })}
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Tutup</span>
            )}
            {errors[`hours.${i}`] && <span className="text-xs text-destructive">{errors[`hours.${i}`]}</span>}
          </li>
        ))}
      </ul>
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} disabled={save.isPending}>
            <Save />
            Simpan jadwal
          </Button>
        </div>
      )}
    </div>
  )
}

function BlackoutList({
  productId,
  blackouts,
  canEdit,
  onChanged,
}: {
  productId: string
  blackouts: LapakBlackout[]
  canEdit: boolean
  onChanged: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [err, setErr] = useState<string>()
  const [removing, setRemoving] = useState<LapakBlackout | null>(null)

  const add = useMutation({
    mutationFn: () =>
      lapakAvailabilityService.addBlackout(productId, {
        startDate: start,
        endDate: end,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Tanggal tutup ditambahkan')
      setAdding(false)
      setStart('')
      setEnd('')
      setReason('')
      onChanged()
    },
    onError: (e) => toast.error('Gagal menambah tanggal tutup', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => lapakAvailabilityService.removeBlackout(productId, id),
    onSuccess: () => {
      toast.success('Tanggal tutup dihapus')
      setRemoving(null)
      onChanged()
    },
    onError: (e) => toast.error('Gagal menghapus', { description: apiErrorMessage(e) }),
  })

  const submit = () => {
    if (!DATE.test(start) || !DATE.test(end)) return setErr('Isi tanggal mulai dan selesai.')
    if (end < start) return setErr('Tanggal selesai tidak boleh sebelum tanggal mulai.')
    setErr(undefined)
    add.mutate()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">Tanggal tutup ({blackouts.length})</h3>
        {canEdit && !adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus />
            Tambah
          </Button>
        )}
      </div>

      {blackouts.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">Tidak ada tanggal tutup.</p>
      )}

      {blackouts.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border text-sm">
          {blackouts.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <span className="tabular-nums">
                  {b.startDate}
                  {b.endDate !== b.startDate && ` s/d ${b.endDate}`}
                </span>
                {b.reason && <span className="ml-2 text-muted-foreground">{b.reason}</span>}
              </div>
              {canEdit && (
                <IconAction
                  icon={Trash2}
                  tone="destructive"
                  label={`Hapus tanggal tutup ${b.startDate}`}
                  onClick={() => setRemoving(b)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form
          className="space-y-3 rounded-md border border-border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="bo-start" label="Mulai" required>
              <Input id="bo-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </FormField>
            <FormField id="bo-end" label="Selesai" required>
              <Input id="bo-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </FormField>
          </div>
          <FormField id="bo-reason" label="Alasan">
            <Input
              id="bo-reason"
              value={reason}
              maxLength={255}
              placeholder="Renovasi atap"
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={add.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        pending={remove.isPending}
        title="Hapus tanggal tutup?"
        description="Jadwal tutup ini dihapus permanen dan produk kembali mengikuti jam operasional."
        confirmLabel="Hapus"
        destructive
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  )
}
