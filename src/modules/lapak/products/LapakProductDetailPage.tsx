import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorState } from '@/components/shared/ErrorState'
import { lapakProductService } from '@/services/lapak/product.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, cn } from '@/lib/utils'
import { PRICING_UNIT_LABEL, AVAILABILITY_LABEL, FULFILLMENT_LABEL } from '../categories/category-labels'
import { StatusBadge, LAPAK_PRODUCTS } from './ProductBadges'
import { formatRupiah } from './format-rupiah'
import { ProductFormDialog } from './ProductFormDialog'
import { useLapakAccess } from '../lapak-access'
import { ProductRatesCard } from './ProductRatesCard'

/**
 * Detail produk. Menampilkan tarif/addon/persyaratan/fasilitas sebagai bacaan;
 * penyuntingan lewat dialog yang sama dengan halaman daftar (hanya untuk
 * DRAFT/REJECTED — aturan backend).
 */
export function LapakProductDetailPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const access = useLapakAccess()
  const [editOpen, setEditOpen] = useState(false)

  const q = useQuery({
    queryKey: lapakKeys.product(id),
    queryFn: () => lapakProductService.get(id),
    enabled: !!id,
  })

  // Menyegarkan detail sekaligus daftar setelah simpan.
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: lapakKeys.products })
    void qc.invalidateQueries({ queryKey: lapakKeys.product(id) })
  }

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
      <Link to={LAPAK_PRODUCTS}>
        <ArrowLeft className="h-4 w-4" />
        Daftar produk
      </Link>
    </Button>
  )

  if (q.error) {
    return (
      <>
        {back}
        <ErrorState message={apiErrorMessage(q.error)} onRetry={() => void q.refetch()} />
      </>
    )
  }

  if (q.isPending) {
    return (
      <>
        {back}
        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
        </div>
      </>
    )
  }

  const p = q.data
  const editable = p.status === 'DRAFT' || p.status === 'REJECTED'
  const activeRates = p.rates.filter((r) => r.isActive)
  const starting = activeRates.length ? Math.min(...activeRates.map((r) => r.price)) : null

  return (
    <>
      {back}
      <PageHeader
        title={p.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">[{p.slug}]</span>
            <span>· {p.category.name}</span>
            {p.organization?.name && <span>· {p.organization.name}</span>}
          </span>
        }
        actions={
          access.canUpdateProduct &&
          editable && (
            <Button variant="edit" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Ubah
            </Button>
          )
        }
      />

      {p.images.length > 0 && (
        <section aria-label="Galeri gambar produk" className="mb-6 rounded-lg border border-border bg-card p-3">
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {p.images.map((img) => (
              <li key={img.id} className="shrink-0">
                <a
                  href={img.url}
                  target="_blank"
                  rel="noreferrer"
                  title={img.altText ?? 'Buka gambar di tab baru'}
                  className="relative block"
                >
                  <img
                    src={img.url}
                    alt={img.altText ?? p.name}
                    loading="lazy"
                    className={cn(
                      'h-28 w-40 rounded-md border object-cover',
                      img.isPrimary ? 'border-primary ring-2 ring-primary/40' : 'border-border',
                    )}
                  />
                  {img.isPrimary && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                      Utama
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={p.status} />
            {p.publishedAt && (
              <span className="text-xs text-muted-foreground">Terbit {new Date(p.publishedAt).toLocaleDateString('id-ID')}</span>
            )}
          </div>

          <dl className="grid gap-2 text-sm">
            <Row label="Harga mulai">{formatRupiah(starting)}</Row>
            <Row label="Satuan tarif">{PRICING_UNIT_LABEL[p.pricingUnit]}</Row>
            <Row label="Ketersediaan">{AVAILABILITY_LABEL[p.availabilityType]}</Row>
            <Row label="Pemenuhan">{FULFILLMENT_LABEL[p.fulfillmentType]}</Row>
            <Row label="Alamat">{p.address ?? '—'}</Row>
            <Row label="Kapasitas">{p.capacity ? `${p.capacity} orang` : '—'}</Row>
            <Row label="Luas">{p.areaM2 ? `${p.areaM2} m²` : '—'}</Row>
          </dl>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground">Deskripsi</h3>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{p.description}</p>
          </div>
        </section>

        <div className="space-y-4">
          {/* Tarif punya alur persetujuan sendiri — kartu ini yang menanganinya. */}
          <ProductRatesCard productId={p.id} />

          <Panel title={`Addon (${p.addons.length})`}
            count={p.addons.length} empty="Belum ada addon.">
            {p.addons.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="min-w-0 truncate">{a.name}</span>
                <span className="shrink-0 tabular-nums">{formatRupiah(a.price)}</span>
              </li>
            ))}
          </Panel>

          <Panel title={`Persyaratan (${p.requirements.length})`}
            count={p.requirements.length} empty="Tidak ada persyaratan khusus.">
            {p.requirements.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="min-w-0 truncate">{r.label}</span>
                <Badge variant="outline">{r.fieldType}</Badge>
              </li>
            ))}
          </Panel>

          <Panel title={`Fasilitas (${p.facilities.length})`}
            count={p.facilities.length} empty="Belum ada fasilitas.">
            {p.facilities.map((f) => (
              <li key={f.id} className="py-1">
                {f.name}
              </li>
            ))}
          </Panel>
        </div>
      </div>

      {editOpen && (
        <ProductFormDialog
          key={p.id}
          open={editOpen}
          onOpenChange={setEditOpen}
          product={p}
          onSaved={invalidate}
        />
      )}
    </>
  )
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right">{children}</dd>
  </div>
)

function Panel({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">{title}</h2>
      <ul className="divide-y divide-border px-4 text-sm">
        {count === 0 ? <li className="py-3 text-muted-foreground">{empty}</li> : children}
      </ul>
    </section>
  )
}
