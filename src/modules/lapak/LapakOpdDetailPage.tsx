import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, Globe, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { organizationService } from '@/services/organization.service'
import { organizationKeys } from '@/lib/query-keys'
import { apiErrorMessage } from '@/lib/utils'
import { ORGANIZATION_TYPE_LABEL } from '@/modules/core/organizations/organization-form'
import { useMyPermissions } from './lapak-access'
import { LAPAK_OPD } from './lapak-paths'

/**
 * Detail satu OPD di workspace Lapak.
 *
 * Memakai `GET /organizations/public/:code` — tanpa permission, jadi pengguna
 * Lapak mana pun bisa membukanya. Endpoint CMS (`GET /organizations/:id`)
 * TIDAK dipakai karena menuntut `organization:read` milik aplikasi Seloko.
 */
export function LapakOpdDetailPage() {
  const { code = '' } = useParams()
  const { canManage } = useMyPermissions()

  const org = useQuery({
    queryKey: [...organizationKeys.public, code] as const,
    queryFn: () => organizationService.publicByCode(code),
    enabled: !!code,
    staleTime: 5 * 60_000,
  })

  const back = (
    <Button variant="outline" size="sm" asChild>
      <Link to={LAPAK_OPD}>
        <ArrowLeft />
        Daftar OPD
      </Link>
    </Button>
  )

  if (org.error) {
    return (
      <>
        <PageHeader title="Detail OPD" actions={back} />
        <ErrorState
          title="OPD tidak ditemukan"
          message={apiErrorMessage(org.error)}
          onRetry={() => void org.refetch()}
        />
      </>
    )
  }

  if (org.isPending) {
    return (
      <>
        <PageHeader title="Detail OPD" actions={back} />
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      </>
    )
  }

  const o = org.data

  const contact = [
    { icon: MapPin, label: 'Alamat', value: o.address },
    { icon: Phone, label: 'Telepon', value: o.phone },
    { icon: Mail, label: 'Email', value: o.email },
    { icon: Globe, label: 'Situs', value: o.website },
  ].filter((c) => c.value)

  return (
    <>
      <PageHeader
        title={o.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{o.code}</span>
            <Badge variant="neutral">{ORGANIZATION_TYPE_LABEL[o.type]}</Badge>
            <ActiveBadge active={o.isActive} />
            {canManage && (
              <Badge variant="neutral">
                <ShieldCheck aria-hidden />
                Mode kelola
              </Badge>
            )}
          </span>
        }
        actions={back}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Identitas</h2>
          </div>
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
            {o.logoUrl ? (
              <img
                src={o.logoUrl}
                alt={`Logo ${o.name}`}
                className="size-20 rounded-lg border border-border bg-muted object-contain p-2"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-20 items-center justify-center rounded-lg border border-dashed border-input bg-muted/50 text-muted-foreground"
              >
                <Building2 className="size-8" />
              </span>
            )}
            <div>
              <p className="text-sm font-semibold">{o.name}</p>
              {o.shortName && <p className="text-xs text-muted-foreground">{o.shortName}</p>}
            </div>
          </div>
          <dl className="divide-y divide-border border-t border-border text-sm">
            <div className="flex items-start justify-between gap-3 px-4 py-2.5">
              <dt className="text-muted-foreground">Kode</dt>
              <dd className="text-right font-mono">{o.code}</dd>
            </div>
            <div className="flex items-start justify-between gap-3 px-4 py-2.5">
              <dt className="text-muted-foreground">Jenis</dt>
              <dd className="text-right">{ORGANIZATION_TYPE_LABEL[o.type]}</dd>
            </div>
            <div className="flex items-start justify-between gap-3 px-4 py-2.5">
              <dt className="text-muted-foreground">Tingkat</dt>
              <dd className="text-right">{o.parentId ? 'Sub-unit' : 'Tingkat atas'}</dd>
            </div>
          </dl>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Deskripsi</h2>
            </div>
            <p className="px-4 py-3 text-sm">
              {o.description ? (
                o.description
              ) : (
                <span className="text-muted-foreground">Belum ada deskripsi untuk OPD ini.</span>
              )}
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Kontak</h2>
            </div>
            {contact.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Belum ada kontak yang dicatat.</p>
            ) : (
              <dl className="divide-y divide-border text-sm">
                {contact.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 px-4 py-2.5">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
