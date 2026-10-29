import { useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/shared/FormField'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { lapakProductService } from '@/services/lapak/product.service'
import { lapakCategoryService } from '@/services/lapak/category.service'
import { storageService } from '@/services/storage.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type {
  CreateLapakProductBody,
  LapakProduct,
  ProductAddonInput,
  ProductFacilityInput,
  ProductImageInput,
  ProductRateInput,
  ProductRequirementInput,
} from '@/types/lapak'
import { AVAILABILITY_OPTIONS, FULFILLMENT_OPTIONS, PRICING_UNIT_OPTIONS } from '../categories/category-labels'
import { AddonRows, FacilityRows, RateRows, RequirementRows } from './ProductChildrenFields'
import { ProductImagesField } from './ProductImagesField'

/** Sentinel Select — nilai kosong tidak boleh string kosong. */
const INHERIT = '__inherit__'

interface Values {
  organizationId: string
  categoryId: string
  name: string
  slug: string
  excerpt: string
  description: string
  address: string
  capacity: string
  areaM2: string
  /** `INHERIT` = kirim `null` supaya server memakai bawaan kategori. */
  pricingUnit: string
  availabilityType: string
  fulfillmentType: string
}

const EMPTY: Values = {
  organizationId: '',
  categoryId: '',
  name: '',
  slug: '',
  excerpt: '',
  description: '',
  address: '',
  capacity: '',
  areaM2: '',
  pricingUnit: INHERIT,
  availabilityType: INHERIT,
  fulfillmentType: INHERIT,
}

const fromProduct = (p: LapakProduct): Values => ({
  organizationId: p.organizationId,
  categoryId: p.categoryId,
  name: p.name,
  slug: p.slug,
  excerpt: p.excerpt ?? '',
  description: p.description,
  address: p.address ?? '',
  capacity: p.capacity?.toString() ?? '',
  areaM2: p.areaM2?.toString() ?? '',
  pricingUnit: p.pricingUnit ?? INHERIT,
  availabilityType: p.availabilityType ?? INHERIT,
  fulfillmentType: p.fulfillmentType ?? INHERIT,
})

/** Angka opsional: string kosong → null (bukan 0). */
const num = (v: string) => (v.trim() === '' ? null : Number(v))

/**
 * Dialog tambah/ubah Produk.
 *
 * Form dibagi per tab supaya tidak jadi satu kolom raksasa: **Info** (identitas
 * & lokasi), **Tarif & Addon**, **Persyaratan**, **Fasilitas**.
 *
 * Aturan backend yang dicerminkan di sini:
 * - `pricingUnit`/`availabilityType`/`fulfillmentType` bernilai `null` berarti
 *   **warisi bawaan kategori**; itu sebabnya pilihannya punya opsi "Ikuti kategori".
 * - Anak-anak bersifat **replace-set** — yang tampil di UI itulah yang dikirim.
 * - Hanya `DRAFT`/`REJECTED` yang boleh diedit; tombol simpan disembunyikan
 *   untuk status lain oleh pemanggil (halaman detail).
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  organizationId,
  readOnly,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: LapakProduct | null
  /** Untuk admin OPD: OPD-nya sudah tetap, pilihan dikunci. */
  organizationId?: string
  /** Status non-draft: tampilkan tanpa tombol simpan. */
  readOnly?: boolean
  /** Dipanggil setelah simpan sukses — untuk menyegarkan detail di halaman induk. */
  onSaved?: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!product
  const [v, setV] = useState<Values>(() =>
    product ? fromProduct(product) : { ...EMPTY, organizationId: organizationId ?? '' },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rates, setRates] = useState<ProductRateInput[]>(() => product?.rates ?? [])
  const [addons, setAddons] = useState<ProductAddonInput[]>(() => product?.addons ?? [])
  const [requirements, setRequirements] = useState<ProductRequirementInput[]>(
    () => product?.requirements ?? [],
  )
  const [facilities, setFacilities] = useState<ProductFacilityInput[]>(() => product?.facilities ?? [])
  // Galeri: satu produk boleh punya banyak gambar (maks 20 di backend).
  const [images, setImages] = useState<ProductImageInput[]>(
    () =>
      product?.images?.map((img) => ({
        id: img.id,
        url: img.url,
        fileId: img.fileId,
        altText: img.altText,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })) ?? [],
  )
  // Berkas yang dibuang dari galeri — dihapus di ImageKit hanya SETELAH simpan
  // berhasil; menghapus lebih awal mematahkan gambar bila form dibatalkan.
  const removedFiles = useRef<string[]>([])
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }))

  // OPD & kategori aktif — keduanya wajib valid di server.
  const opds = useQuery({
    queryKey: [...lapakKeys.opd, 'pilihan'],
    queryFn: () => lapakProductService.organizationChoices(),
    staleTime: 5 * 60_000,
  })
  const categories = useQuery({
    queryKey: [...lapakKeys.categories, 'pilihan'],
    queryFn: () => lapakCategoryService.publicList(),
    staleTime: 5 * 60_000,
  })

  const save = useMutation({
    mutationFn: async () => {
      // Urutan gambar = indeks array dan selalu ada tepat satu utama. Server
      // menormalkan ulang, tetapi UI harus mengirim bentuk akhir yang benar.
      const normalizedImages = images.map((img, i) => ({ ...img, sortOrder: i }))
      if (normalizedImages.length > 0 && !normalizedImages.some((img) => img.isPrimary)) {
        normalizedImages[0].isPrimary = true
      }
      const body: CreateLapakProductBody = {
        organizationId: v.organizationId,
        categoryId: v.categoryId,
        name: v.name.trim(),
        ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
        excerpt: v.excerpt.trim() || null,
        description: v.description.trim(),
        address: v.address.trim() || null,
        capacity: num(v.capacity),
        areaM2: num(v.areaM2),
        pricingUnit: v.pricingUnit === INHERIT ? null : (v.pricingUnit as NonNullable<CreateLapakProductBody['pricingUnit']>),
        availabilityType:
          v.availabilityType === INHERIT
            ? null
            : (v.availabilityType as NonNullable<CreateLapakProductBody['availabilityType']>),
        fulfillmentType:
          v.fulfillmentType === INHERIT
            ? null
            : (v.fulfillmentType as NonNullable<CreateLapakProductBody['fulfillmentType']>),
        rates: rates.filter((r) => r.name.trim()),
        addons: addons.filter((a) => a.name.trim()),
        requirements: requirements.filter((r) => r.label.trim()),
        facilities: facilities.filter((f) => f.name.trim()),
        images: normalizedImages,
      }
      return isEdit ? lapakProductService.update(product!.id, body) : lapakProductService.create(body)
    },
    onSuccess: (p) => {
      // Baru sekarang berkas yang dibuang aman dihapus dari ImageKit.
      for (const fileId of removedFiles.current) void storageService.remove(fileId).catch(() => undefined)
      removedFiles.current = []
      toast.success(isEdit ? `${p.name} diperbarui` : `${p.name} dibuat sebagai draf`)
      void qc.invalidateQueries({ queryKey: lapakKeys.products })
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e) => {
      setErrors(apiFieldErrors(e))
      toast.error(isEdit ? 'Gagal memperbarui produk' : 'Gagal membuat produk', {
        description: apiErrorMessage(e),
      })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!v.organizationId) next.organizationId = 'Pilih OPD.'
    if (!v.categoryId) next.categoryId = 'Pilih kategori.'
    if (v.name.trim().length < 3) next.name = 'Nama minimal 3 karakter.'
    if (v.description.trim().length < 10) next.description = 'Deskripsi minimal 10 karakter.'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    setErrors({})
    save.mutate()
  }

  const lockOrg = !!organizationId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Ubah produk' : 'Tambah produk'}</DialogTitle>
            <DialogDescription>
              Produk dibuat sebagai <strong>draf</strong>. Ajukan review, lalu terbitkan setelah disetujui.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="images">Gambar</TabsTrigger>
                <TabsTrigger value="rates">Tarif & addon</TabsTrigger>
                <TabsTrigger value="req">Persyaratan</TabsTrigger>
                <TabsTrigger value="fac">Fasilitas</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="p-org" label="OPD" required error={errors.organizationId}>
                    <Select
                      value={v.organizationId}
                      onValueChange={(x) => set('organizationId', x)}
                      disabled={lockOrg}
                    >
                      <SelectTrigger id="p-org">
                        <SelectValue placeholder="Pilih OPD" />
                      </SelectTrigger>
                      <SelectContent>
                        {(opds.data ?? []).map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField id="p-cat" label="Kategori" required error={errors.categoryId}>
                    <Select value={v.categoryId} onValueChange={(x) => set('categoryId', x)}>
                      <SelectTrigger id="p-cat">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <FormField id="p-name" label="Nama produk" required error={errors.name}>
                  <Input
                    id="p-name"
                    value={v.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Aula Gedung Bapenda"
                  />
                </FormField>

                <FormField id="p-slug" label="Slug" hint="Kosongkan untuk dibuat otomatis dari nama.">
                  <Input
                    id="p-slug"
                    value={v.slug}
                    onChange={(e) => set('slug', e.target.value)}
                    className="font-mono text-xs"
                    placeholder="aula-gedung-bapenda"
                  />
                </FormField>

                <FormField id="p-excerpt" label="Ringkasan" hint="Tampil di kartu katalog. Maksimal 1000 karakter.">
                  <Textarea
                    id="p-excerpt"
                    value={v.excerpt}
                    onChange={(e) => set('excerpt', e.target.value)}
                    rows={2}
                    maxLength={1000}
                  />
                </FormField>

                <FormField id="p-desc" label="Deskripsi" required error={errors.description} hint="Minimal 10 karakter.">
                  <Textarea
                    id="p-desc"
                    value={v.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={4}
                  />
                </FormField>

                <FormField id="p-addr" label="Alamat">
                  <Input
                    id="p-addr"
                    value={v.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Jl. …"
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="p-cap" label="Kapasitas" hint="Orang.">
                    <Input
                      id="p-cap"
                      type="number"
                      min={1}
                      value={v.capacity}
                      onChange={(e) => set('capacity', e.target.value)}
                      className="tabular-nums"
                    />
                  </FormField>
                  <FormField id="p-area" label="Luas" hint="m².">
                    <Input
                      id="p-area"
                      type="number"
                      min={1}
                      value={v.areaM2}
                      onChange={(e) => set('areaM2', e.target.value)}
                      className="tabular-nums"
                    />
                  </FormField>
                </div>

                <InheritField
                  id="p-unit"
                  label="Satuan tarif"
                  value={v.pricingUnit}
                  options={PRICING_UNIT_OPTIONS}
                  onChange={(x) => set('pricingUnit', x)}
                />
                <InheritField
                  id="p-avail"
                  label="Tipe ketersediaan"
                  value={v.availabilityType}
                  options={AVAILABILITY_OPTIONS}
                  onChange={(x) => set('availabilityType', x)}
                />
                <InheritField
                  id="p-ful"
                  label="Tipe pemenuhan"
                  value={v.fulfillmentType}
                  options={FULFILLMENT_OPTIONS}
                  onChange={(x) => set('fulfillmentType', x)}
                />
              </TabsContent>

              <TabsContent value="images" className="mt-4 space-y-3">
                <h3 className="text-sm font-medium">Gambar produk</h3>
                <p className="text-xs text-muted-foreground">
                  Satu produk boleh punya beberapa foto. Gambar bertanda <strong>Utama</strong> dipakai sebagai
                  thumbnail katalog dan menjadi cover produk.
                </p>
                <ProductImagesField
                  images={images}
                  onChange={setImages}
                  readOnly={readOnly}
                  onRemoveFile={(fileId) => removedFiles.current.push(fileId)}
                />
              </TabsContent>

              <TabsContent value="rates" className="mt-4 space-y-6">
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Tarif</h3>
                  <p className="text-xs text-muted-foreground">
                    Tarif aktif termurah menjadi harga awal di katalog publik.
                  </p>
                  <RateRows rows={rates} onChange={setRates} />
                </section>
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Addon</h3>
                  <AddonRows rows={addons} onChange={setAddons} />
                </section>
              </TabsContent>

              <TabsContent value="req" className="mt-4 space-y-2">
                <h3 className="text-sm font-medium">Persyaratan pemohon</h3>
                <p className="text-xs text-muted-foreground">
                  Dokumen/data yang harus dilengkapi warga sebelum memesan.
                </p>
                <RequirementRows rows={requirements} onChange={setRequirements} />
              </TabsContent>

              <TabsContent value="fac" className="mt-4 space-y-2">
                <h3 className="text-sm font-medium">Fasilitas</h3>
                <p className="text-xs text-muted-foreground">Bersifat dekoratif — tidak memengaruhi harga.</p>
                <FacilityRows rows={facilities} onChange={setFacilities} />
              </TabsContent>
            </Tabs>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Tutup' : 'Batal'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                {isEdit ? 'Simpan' : 'Buat draf'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Select atribut dengan opsi "Ikuti kategori" (`null` → warisi bawaan). */
function InheritField({
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
    <FormField id={id} label={label} hint="Ikuti kategori = memakai nilai bawaan kategori ini.">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={INHERIT}>Ikuti kategori</SelectItem>
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
