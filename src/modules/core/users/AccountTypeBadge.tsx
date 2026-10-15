import { Building2, Globe, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Audience } from '@/types/core'

// Dua jenis akun: pegawai (INTERNAL) dan warga (PUBLIC → "Eksternal"). Ikon membedakan tanpa bergantung warna.
// Eksternal sengaja tidak abu-abu agar tidak terbaca sebagai "nonaktif".
const TYPES: Record<Audience, { label: string; title: string; variant: 'info' | 'warning'; Icon: typeof Globe }> = {
  INTERNAL: { label: 'Internal', title: 'Akun pegawai', variant: 'info', Icon: Building2 },
  PUBLIC: { label: 'Eksternal', title: 'Akun warga / publik', variant: 'warning', Icon: Globe },
}

export function AccountTypeBadge({ type }: { type: Audience }) {
  const t = TYPES[type]
  return (
    <Badge variant={t.variant} title={t.title}>
      <t.Icon aria-hidden />
      {t.label}
    </Badge>
  )
}

export function SuperAdminBadge() {
  return (
    <Badge variant="default" title="Akses penuh ke semua aplikasi">
      <ShieldCheck aria-hidden />
      Superadmin
    </Badge>
  )
}
