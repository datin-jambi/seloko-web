import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { lapakRateService } from '@/services/lapak/rate.service'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import { PRICING_UNIT_OPTIONS } from '../categories/category-labels'
import type { LapakRateDetail, PricingUnit } from '@/types/lapak'

interface Values {
  name: string
  unit: PricingUnit
  price: string
  minQty: string
  maxQty: string
  startTime: string
  endTime: string
  isActive: boolean
}

const EMPTY: Values = {
  name: '',
  unit: 'DAY',
  price: '0',
  minQty: '1',
  maxQty: '',
  startTime: '',
  endTime: '',
  isActive: true,
}

const fromRate = (r: LapakRateDetail): Values => ({
  name: r.name,
  unit: r.unit,
  price: String(r.price),
  minQty: String(r.minQty),
  maxQty: r.maxQty?.toString() ?? '',
  startTime: r.startTime ?? '',
  endTime: r.endTime ?? '',
  isActive: r.isActive,
})

/**
 * Dialog tambah/ubah tarif satu produk.
 *
 * `mode` menentukan endpoint, karena aturannya berbeda:
 * - `create` → `POST /rates/product/:productId`
 * - `edit`   → `PUT /rates/:id` (hanya tarif BELUM disetujui)
 * - `revise` → `POST /rates/:id/revise` (tarif APPROVED/PUBLISHED; membuat baris
 *   baru `PENDING_REVIEW`, baris lama tetap aktif sampai disetujui)
 */
export function RateFormDialog({
  open,
  onOpenChange,
  productId,
  rate,
  mode,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  rate?: LapakRateDetail | null
  mode: 'create' | 'edit' | 'revise'
  onSaved: () => void
}) {
  const [v, setV] = useState<Values>(() => (rate ? fromRate(rate) : EMPTY))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }))

  const body = () => ({
    name: v.name.trim(),
    unit: v.unit,
    price: Number(v.price) || 0,
    minQty: Number(v.minQty) || 1,
    maxQty: v.maxQty.trim() ? Number(v.maxQty) : null,
    startTime: v.startTime.trim() || null,
    endTime: v.endTime.trim() || null,
    isActive: v.isActive,
  })

  const save = useMutation({
    mutationFn: () => {
      if (mode === 'create') return lapakRateService.create(productId, body())
      if (mode === 'revise') return lapakRateService.revise(rate!.id, body())
      return lapakRateService.update(rate!.id, body())
    },
    onSuccess: (r) => {
      const verb = mode === 'create' ? 'ditambahkan' : mode === 'revise' ? 'direvisi' : 'diperbarui'
      toast.success(`Tarif ${r.name} ${verb}`, {
        description: mode === 'revise' ? 'Baris revisi menunggu persetujuan; harga lama masih berlaku.' : undefined,
      })
      onSaved()
      onOpenChange(false)
    },
    onError: (e) => {
      setErrors(apiFieldErrors(e))
      toast.error('Gagal menyimpan tarif', { description: apiErrorMessage(e) })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!v.name.trim()) {
      setErrors({ name: 'Nama tarif wajib diisi.' })
      return
    }
    setErrors({})
    save.mutate()
  }

  const isSession = v.unit === 'SESSION' || v.unit === 'HOUR'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Tambah tarif' : mode === 'revise' ? 'Revisi tarif' : 'Ubah tarif'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'revise'
                ? 'Revisi membuat baris baru berstatus menunggu review. Harga lama tetap dipakai publik sampai revisi disetujui.'
                : 'Tarif punya alur persetujuan sendiri — tidak ikut status produk.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <FormField id="r-name" label="Nama tarif" required error={errors.name}>
              <Input
                id="r-name"
                value={v.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Sewa Aula Harian"
                autoFocus
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="r-unit" label="Satuan" required>
                <Select value={v.unit} onValueChange={(x) => set('unit', x as PricingUnit)}>
                  <SelectTrigger id="r-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_UNIT_OPTIONS.map(([val, text]) => (
                      <SelectItem key={val} value={val}>
                        {text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField id="r-price" label="Harga" required error={errors.price}>
                <Input
                  id="r-price"
                  type="number"
                  min={0}
                  value={v.price}
                  onChange={(e) => set('price', e.target.value)}
                  className="tabular-nums"
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="r-min" label="Kuantitas min" hint="Default 1.">
                <Input
                  id="r-min"
                  type="number"
                  min={1}
                  value={v.minQty}
                  onChange={(e) => set('minQty', e.target.value)}
                  className="tabular-nums"
                />
              </FormField>
              <FormField id="r-max" label="Kuantitas maks" hint="Kosong = tanpa batas.">
                <Input
                  id="r-max"
                  type="number"
                  min={1}
                  value={v.maxQty}
                  onChange={(e) => set('maxQty', e.target.value)}
                  className="tabular-nums"
                />
              </FormField>
            </div>

            {/* Jam hanya bermakna untuk tarif sesi/jam — server tetap menerima
                null, jadi tidak perlu dipaksa untuk tipe lain. */}
            {isSession && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="r-start" label="Jam mulai" hint="Format HH:MM.">
                  <Input
                    id="r-start"
                    type="time"
                    value={v.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                    className="tabular-nums"
                  />
                </FormField>
                <FormField id="r-end" label="Jam selesai" hint="Format HH:MM.">
                  <Input
                    id="r-end"
                    type="time"
                    value={v.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                    className="tabular-nums"
                  />
                </FormField>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              Aktif — tampil di portal publik setelah disetujui
            </label>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {mode === 'create' ? 'Tambah' : mode === 'revise' ? 'Kirim revisi' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
