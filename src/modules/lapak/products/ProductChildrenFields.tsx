import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconPicker } from '@/components/shared/IconPicker'
import { Plus, Trash2 } from 'lucide-react'
import { PRICING_UNIT_OPTIONS } from '../categories/category-labels'
import type {
  ProductAddonInput,
  ProductFacilityInput,
  ProductRateInput,
  ProductRequirementInput,
  RequirementFieldType,
} from '@/types/lapak'

/**
 * Editor daftar anak produk (tarif, addon, persyaratan, fasilitas).
 *
 * Semua daftar memakai semantik **replace-set**: yang tampil di sini dikirim apa
 * adanya, yang tidak ada di UI akan di-soft-delete server. Karena itu tombol
 * hapus cukup membuang baris dari state, bukan memanggil endpoint terpisah.
 *
 * Baris yang sudah tersimpan membawa `id`; baris baru tidak. Jangan mengarang
 * `id` — server memakai keberadaan `id` untuk membedakan update vs insert.
 */

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="grid gap-1 text-xs">
    <span className="font-medium text-muted-foreground">{label}</span>
    {children}
  </label>
)

/** Tombol tambah baris + tombol hapus per baris; ringkas dan seragam. */
const RowShell = ({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) => (
  <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2">
    <div className="grid min-w-0 flex-1 gap-2">{children}</div>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onRemove}
      aria-label="Hapus baris"
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 />
    </Button>
  </div>
)

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="w-full">
      <Plus />
      {label}
    </Button>
  )
}

// ─── Tarif ────────────────────────────────────────────────────────────────────

export function RateRows({
  rows,
  onChange,
}: {
  rows: ProductRateInput[]
  onChange: (rows: ProductRateInput[]) => void
}) {
  const patch = (i: number, next: Partial<ProductRateInput>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...next } : r)))

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <RowShell key={r.id ?? `baru-${i}`} onRemove={() => onChange(rows.filter((_, idx) => idx !== i))}>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_9rem]">
            <Field label="Nama tarif">
              <Input
                value={r.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                placeholder="Sewa per hari"
              />
            </Field>
            <Field label="Satuan">
              <Select value={r.unit} onValueChange={(v) => patch(i, { unit: v as ProductRateInput['unit'] })}>
                <SelectTrigger>
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
            </Field>
            <Field label="Harga">
              <Input
                type="number"
                min={0}
                value={r.price}
                onChange={(e) => patch(i, { price: Number(e.target.value) || 0 })}
                className="tabular-nums"
              />
            </Field>
          </div>
        </RowShell>
      ))}
      <AddRowButton
        label="Tambah tarif"
        onClick={() =>
          onChange([...rows, { name: '', unit: 'DAY', price: 0, minQty: 1, isActive: true }])
        }
      />
    </div>
  )
}

// ─── Addon ────────────────────────────────────────────────────────────────────

export function AddonRows({
  rows,
  onChange,
}: {
  rows: ProductAddonInput[]
  onChange: (rows: ProductAddonInput[]) => void
}) {
  const patch = (i: number, next: Partial<ProductAddonInput>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...next } : r)))

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <RowShell key={r.id ?? `baru-${i}`} onRemove={() => onChange(rows.filter((_, idx) => idx !== i))}>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_9rem]">
            <Field label="Nama addon">
              <Input
                value={r.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                placeholder="Sound system"
              />
            </Field>
            <Field label="Satuan">
              <Select value={r.unit} onValueChange={(v) => patch(i, { unit: v as ProductAddonInput['unit'] })}>
                <SelectTrigger>
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
            </Field>
            <Field label="Harga">
              <Input
                type="number"
                min={0}
                value={r.price}
                onChange={(e) => patch(i, { price: Number(e.target.value) || 0 })}
                className="tabular-nums"
              />
            </Field>
          </div>
        </RowShell>
      ))}
      <AddRowButton
        label="Tambah addon"
        onClick={() => onChange([...rows, { name: '', unit: 'UNIT', price: 0, isActive: true }])}
      />
    </div>
  )
}

// ─── Persyaratan ──────────────────────────────────────────────────────────────

const FIELD_TYPES: [RequirementFieldType, string][] = [
  ['FILE', 'Unggah berkas'],
  ['TEXT', 'Teks'],
  ['NUMBER', 'Angka'],
  ['DATE', 'Tanggal'],
  ['SELECT', 'Pilihan'],
]

export function RequirementRows({
  rows,
  onChange,
}: {
  rows: ProductRequirementInput[]
  onChange: (rows: ProductRequirementInput[]) => void
}) {
  const patch = (i: number, next: Partial<ProductRequirementInput>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...next } : r)))

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <RowShell key={r.id ?? `baru-${i}`} onRemove={() => onChange(rows.filter((_, idx) => idx !== i))}>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <Field label="Label">
              <Input
                value={r.label}
                onChange={(e) => patch(i, { label: e.target.value })}
                placeholder="KTP pemohon"
              />
            </Field>
            <Field label="Tipe">
              <Select
                value={r.fieldType}
                onValueChange={(v) =>
                  // `options` hanya sah untuk SELECT — dibersihkan saat tipe lain.
                  patch(i, { fieldType: v as RequirementFieldType, options: v === 'SELECT' ? r.options : null })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(([val, text]) => (
                    <SelectItem key={val} value={val}>
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {r.fieldType === 'SELECT' && (
            <Field label="Pilihan (pisahkan dengan koma)">
              <Input
                value={(r.options ?? []).join(', ')}
                onChange={(e) =>
                  patch(i, {
                    options: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Pagi, Siang, Sore"
              />
            </Field>
          )}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={r.isRequired ?? true}
              onChange={(e) => patch(i, { isRequired: e.target.checked })}
              className="size-3.5 rounded border-input accent-primary"
            />
            Wajib diisi pemohon
          </label>
        </RowShell>
      ))}
      <AddRowButton
        label="Tambah persyaratan"
        onClick={() =>
          onChange([...rows, { label: '', fieldType: 'FILE', isRequired: true, sortOrder: rows.length }])
        }
      />
    </div>
  )
}

// ─── Fasilitas ────────────────────────────────────────────────────────────────

export function FacilityRows({
  rows,
  onChange,
}: {
  rows: ProductFacilityInput[]
  onChange: (rows: ProductFacilityInput[]) => void
}) {
  const patch = (i: number, next: Partial<ProductFacilityInput>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...next } : r)))

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <RowShell key={r.id ?? `baru-${i}`} onRemove={() => onChange(rows.filter((_, idx) => idx !== i))}>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <Field label="Nama fasilitas">
              <Input
                value={r.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                placeholder="AC"
              />
            </Field>
            <Field label="Ikon">
              <IconPicker value={r.icon ?? ''} onChange={(name) => patch(i, { icon: name || null })} />
            </Field>
          </div>
        </RowShell>
      ))}
      <AddRowButton label="Tambah fasilitas" onClick={() => onChange([...rows, { name: '', icon: null }])} />
    </div>
  )
}
