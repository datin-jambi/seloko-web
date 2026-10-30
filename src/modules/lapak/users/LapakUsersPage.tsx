import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { ForbiddenPage } from '@/components/shared/ForbiddenPage'
import { IconAction } from '@/components/shared/IconAction'
import { RowActions } from '@/components/shared/RowActions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/modules/core/users/UserAvatar'
import { lapakUserService } from '@/services/lapak/user.service'
import { lapakProductService } from '@/services/lapak/product.service'
import { lapakKeys } from '@/lib/query-keys'
import { formatDateTime } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import { LapakUserFormDialog } from './LapakUserFormDialog'
import type { LapakUser, LapakUserRole } from '@/types/lapak'

const mono = 'font-mono text-xs tabular-nums'

/**
 * Lingkup OPD satu pengguna, digabung dari seluruh role Lapak-nya.
 * `organizations` kosong pada salah satu role = berlaku untuk SEMUA OPD
 * (level Bapenda), jadi hasilnya "Semua OPD" — bukan "—".
 */
function orgScope(roles: LapakUserRole[]): { label: string; title: string } {
  if (roles.length === 0) return { label: '—', title: '' }
  if (roles.some((r) => r.organizations.length === 0)) return { label: 'Semua OPD', title: 'Berlaku untuk seluruh OPD' }
  const names = [...new Set(roles.flatMap((r) => r.organizations.map((o) => o.name)))]
  return {
    label: names.length === 1 ? names[0] : `${names.length} OPD`,
    title: names.join(', '),
  }
}

const columns: Column<LapakUser>[] = [
  {
    header: 'Pengguna',
    cell: (u) => (
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={u.fullName} src={u.avatarUrl} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{u.fullName}</span>
            {u.isSuperAdmin && (
              <Badge variant="default" title="Akses penuh ke semua aplikasi">
                Superadmin
              </Badge>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
        </div>
      </div>
    ),
  },
  { header: 'NIP / Username', cell: (u) => <span className={mono}>{u.nip ?? u.username ?? '—'}</span> },
  {
    header: 'Role Lapak',
    cell: (u) => {
      const names = u.roles.map((r) => r.roleName)
      if (names.length === 0) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap items-center gap-1" title={names.join(', ')}>
          {names.slice(0, 2).map((n) => (
            <Badge key={n} variant="outline">
              {n}
            </Badge>
          ))}
          {names.length > 2 && <span className="text-xs text-muted-foreground tabular-nums">+{names.length - 2}</span>}
        </div>
      )
    },
  },
  {
    header: 'Lingkup OPD',
    cell: (u) => {
      const scope = orgScope(u.roles)
      return (
        <span className="block max-w-48 truncate" title={scope.title}>
          {scope.label}
        </span>
      )
    },
  },
  { header: 'Status', cell: (u) => <ActiveBadge active={u.isActive} /> },
  { header: 'Login terakhir', cell: (u) => formatDateTime(u.lastLoginAt) },
]

/**
 * Pengguna Lapak Jambi — `/lapak-jambi/users`.
 *
 * Hanya berisi orang yang punya penugasan role AKTIF di aplikasi Lapak
 * (`GET /lapak/users`), bukan seluruh pengguna platform. Halaman ini hanya
 * untuk superadmin dan admin Lapak — server menegakkan hal yang sama, jadi
 * membuka URL langsung tanpa role tetap ditolak.
 */
export function LapakUsersPage() {
  const access = useLapakAccess()
  const list = useLapakList<LapakUser>('/lapak/users')
  const { params, setSearch, setFilter } = list
  const [form, setForm] = useState<{ open: boolean; user: LapakUser | null }>({ open: false, user: null })

  // Pilihan role & OPD hanya diambil untuk pengelola (endpoint menolak selain itu).
  const roles = useQuery({
    queryKey: ['lapak', 'users', 'roles'],
    queryFn: lapakUserService.roles,
    staleTime: 5 * 60_000,
    enabled: access.canManage,
  })
  const opds = useQuery({
    queryKey: [...lapakKeys.opd, 'pilihan'],
    queryFn: () => lapakProductService.organizationChoices(),
    staleTime: 5 * 60_000,
    enabled: access.canManage,
  })

  if (!access.isLoading && !access.canManage) return <ForbiddenPage />

  const total = list.meta?.total

  return (
    <>
      <PageHeader
        title="Pengguna Lapak"
        description={
          total != null
            ? `${total} akun terdaftar di aplikasi Lapak Jambi.`
            : 'Akun yang punya role aktif di aplikasi Lapak Jambi.'
        }
        actions={
          access.canManage && (
            <Button variant="create" onClick={() => setForm({ open: true, user: null })}>
              <Plus />
              Tambah pengguna
            </Button>
          )
        }
      />

      <DataTable
        list={list}
        columns={columns}
        rowKey={(u) => u.id}
        emptyTitle="Belum ada pengguna Lapak"
        emptyDescription="Pengguna muncul di sini setelah diberi role pada aplikasi Lapak Jambi."
        actions={(u) => (
          <>
            <div className="hidden sm:block">
              <IconAction
                icon={Pencil}
                tone="warning"
                label={`Ubah ${u.fullName}`}
                onClick={() => setForm({ open: true, user: u })}
              />
            </div>
            <div className="sm:hidden">
              <RowActions
                label={`Pengguna ${u.fullName}`}
                actions={[{ label: 'Ubah', icon: Pencil, onSelect: () => setForm({ open: true, user: u }) }]}
              />
            </div>
          </>
        )}
        toolbar={
          <>
            <SearchBar
              value={params.search}
              onSearch={setSearch}
              placeholder="Cari nama, email, NIP, atau username"
            />
            <FilterSelect
              label="Status"
              value={params.isActive}
              options={[
                ['true', 'Aktif'],
                ['false', 'Nonaktif'],
              ]}
              onChange={(v) => setFilter('isActive', v)}
            />
          </>
        }
      />

      {form.open && (
        <LapakUserFormDialog
          key={form.user?.id ?? 'baru'}
          open={form.open}
          onOpenChange={(o) => setForm({ open: o, user: null })}
          user={form.user}
          roles={roles.data ?? []}
          opds={(opds.data ?? []).map((o) => ({ id: o.id, name: o.name }))}
        />
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Akun di sini adalah pegawai yang diberi role pada aplikasi Lapak Jambi. Yang bisa diubah dari halaman ini
        hanya profil (nama, NIP, telepon) dan role Lapak — role aplikasi lain, username, dan email tetap diatur dari
        Seloko.
      </p>
    </>
  )
}
