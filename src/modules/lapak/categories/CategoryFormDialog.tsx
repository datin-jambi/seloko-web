import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/shared/FormField'
import { IconPicker } from '@/components/shared/IconPicker'
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
import { lapakCategoryService } from '@/services/lapak/category.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type {
  AvailabilityType,
  CreateLapakCategoryBody,
  FulfillmentType,
  LapakCategory,
  PricingUnit,
} from '@/types/lapak'
import { AVAILABILITY_OPTIONS, FULFILLMENT_OPTIONS, PRICING_UNIT_OPTIONS } from './category-labels'

/** Sentinel untuk Select Radix — nilai kosong tidak boleh string kosong. */
const NONE = '__none__'

interface Values {
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: string
  isActive: boolean
  defaultPricingUnit: string
  defaultAvailabilityType: string
  defaultFulfillmentType: string
}

const EMPTY: Values = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  sortOrder: '0',
  isActive: true,
  defaultPricingUnit: NONE,
  defaultAvailabilityType: NONE,
  defaultFulfillmentType: NONE,
}

const fromCategory = (c: LapakCategory): Values => ({
  name: c.name,
  slug: c.slug,
  description: c.description ?? '',
  icon: c.icon ?? '',
  sortOrder: String(c.sortOrder),
  isActive: c.isActive,
  defaultPricingUnit: c.defaultPricingUnit ?? NONE,
  defaultAvailabilityType: c.defaultAvailabilityType ?? NONE,
  defaultFulfillmentType: c.defaultFulfillmentType ?? NONE,
})

/**
 * Dialog tambah/ubah Kategori Layanan.
 *
 * Tiga kolom `default*` adalah nilai bawaan yang diwarisi produk baru pada
 * kategori ini (keputusan "satu model Produk"). `null` = OPD wajib memilih
 * sendiri, jadi pilihan kosong harus bisa dikirim sebagai `null` — bukan
 * dihilangkan dari body saat edit, kalau tidak nilai lama tidak bisa direset.
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: LapakCategory | null
}) {
  const qc = useQueryClient()
  const isEdit = !!category
  const [v, setV] = useState<Values>(() => (category ? fromCategory(category) : EMPTY))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }))

  const save = useMutation({
    mutationFn: async () => {
      const body: CreateLapakCategoryBody = {
        name: v.name.trim(),
        ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
        description: v.description.trim() || null,
        icon: v.icon.trim() || null,
        sortOrder: Number(v.sortOrder) || 0,
        isActive: v.isActive,
        defaultPricingUnit: v.defaultPricingUnit === NONE ? null : (v.defaultPricingUnit as PricingUnit),
        defaultAvailabilityType:
          v.defaultAvailabilityType === NONE ? null : (v.defaultAvailabilityType as AvailabilityType),
        defaultFulfillmentType:
          v.defaultFulfillmentType === NONE ? null : (v.defaultFulfillmentType as FulfillmentType),
      }
      return isEdit
        ? lapakCategoryService.update(category!.id, body)
        : lapakCategoryService.create(body)
    },
    onSuccess: (c) => {
      toast.success(isEdit ? `${c.name} diperbarui` : `${c.name} ditambahkan`)
      void qc.invalidateQueries({ queryKey: lapakKeys.categories })
      onOpenChange(false)
    },
    onError: (e) => {
      const fields = apiFieldErrors(e)
      setErrors(fields)
      // 409 = slug sudah dipakai kategori aktif. Pesannya cukup spesifik;
      // tampilkan sebagai error field slug agar pengguna tahu apa yang harus diubah.
      const desc = apiErrorMessage(e)
      toast.error(isEdit ? 'Gagal memperbarui kategori' : 'Gagal menambah kategori', { description: desc })
      if (desc.toLowerCase().includes('slug')) setErrors((s) => ({ ...s, slug: desc }))
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (v.name.trim().length < 2) {
      setErrors({ name: 'Nama minimal 2 karakter.' })
      return
    }
    setErrors({})
    save.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* `form` WAJIB flex-column + min-h-0: DialogContent membatasi tinggi via
            max-h dan mengandalkan DialogBody sebagai satu-satunya area scroll.
            Tanpa ini, form menjadi anak biasa, Footer terdorong keluar layar dan
            tombol Simpan tidak bisa dijangkau di layar pendek. */}
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah kategori' : 'Tambah kategori'}</DialogTitle>
            <DialogDescription>
              Kategori layanan aset daerah. Nilai bawaan dipakai produk baru pada kategori ini.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <FormField id="cat-name" label="Nama" required error={errors.name}>
              <Input
                id="cat-name"
                value={v.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Sewa Tenda & Perlengkapan"
                aria-describedby={errors.name ? 'cat-name-msg' : undefined}
                autoFocus
              />
            </FormField>

            <FormField
              id="cat-slug"
              label="Slug"
              error={errors.slug}
              hint="URL publik. Kosongkan untuk dibuat otomatis dari nama."
            >
              <Input
                id="cat-slug"
                value={v.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="sewa-tenda-perlengkapan"
                className="font-mono text-xs"
                aria-describedby={errors.slug ? 'cat-slug-msg' : undefined}
              />
            </FormField>

            <FormField id="cat-desc" label="Deskripsi" hint="Maksimal 500 karakter.">
              <Textarea
                id="cat-desc"
                value={v.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                maxLength={500}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="cat-icon" label="Ikon">
                <IconPicker value={v.icon} onChange={(name) => set('icon', name)} />
              </FormField>
              <FormField id="cat-sort" label="Urutan" hint="Angka kecil tampil lebih dulu.">
                <Input
                  id="cat-sort"
                  type="number"
                  min={0}
                  max={9999}
                  value={v.sortOrder}
                  onChange={(e) => set('sortOrder', e.target.value)}
                  className="tabular-nums"
                />
              </FormField>
            </div>

            <EnumField
              id="cat-unit"
              label="Satuan tarif bawaan"
              value={v.defaultPricingUnit}
              options={PRICING_UNIT_OPTIONS}
              onChange={(x) => set('defaultPricingUnit', x)}
            />
            <EnumField
              id="cat-availability"
              label="Tipe ketersediaan bawaan"
              value={v.defaultAvailabilityType}
              options={AVAILABILITY_OPTIONS}
              onChange={(x) => set('defaultAvailabilityType', x)}
            />
            <EnumField
              id="cat-fulfillment"
              label="Tipe pemenuhan bawaan"
              value={v.defaultFulfillmentType}
              options={FULFILLMENT_OPTIONS}
              onChange={(x) => set('defaultFulfillmentType', x)}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              Aktif — tampil di portal publik
            </label>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Select enum dengan opsi "Tanpa bawaan" (`null`). */
function EnumField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: [string, string][]
  onChange: (v: string) => void
}) {
  return (
    <FormField id={id} label={label} hint="Tanpa bawaan = OPD wajib memilih sendiri.">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Tanpa bawaan</SelectItem>
          {options.map(([val, text]) => (
            <SelectItem key={val} value={val}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}
