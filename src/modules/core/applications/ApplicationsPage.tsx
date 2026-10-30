import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Edit2, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { RowActions } from '@/components/shared/RowActions'
import { AppLogo } from '@/components/shared/AppLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useList } from '@/hooks/use-list'
import { useAuthStore } from '@/stores/auth-store'
import type { ApplicationListItem } from '@/types/core'
import { useApplicationActions } from './use-application-actions'
import { ApplicationFormDialog } from './ApplicationFormDialog'

const mono = 'font-mono text-xs tabular-nums'
const ACTIVE: [string, string][] = [
  ['true', 'Aktif'],
  ['false', 'Nonaktif'],
]
const AUDIENCE: [string, string][] = [
  ['INTERNAL', 'Internal'],
  ['PUBLIC', 'Publik'],
]

export const APPLICATION_DETAIL = (id: string) => `/seloko/sistem/aplikasi/${id}`

const columns: Column<ApplicationListItem>[] = [
  {
    header: 'Aplikasi',
    cell: (a) => {
      return (
        <div className="flex items-center gap-3">
          {/* Logo WAJIB lewat AppLogo, bukan <img> mentah: AppLogo yang menangani
              rantai fallback (logo gelap → logo → ikon DB → netral) sekaligus
              mendeteksi URL mati. `text-primary dark:text-white` dibutuhkan
              karena pada tema gelap logo dirender sebagai mask ber-`currentColor`. */}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 p-1.5 text-primary dark:text-white">
            <AppLogo app={a} size="md" className="size-full" />
          </span>
          <div className="min-w-0">
            <Link
              to={APPLICATION_DETAIL(a.id)}
              className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none group-hover/row:font-bold group-hover/row:underline"
            >
              {a.name}
            </Link>
            {a.tagline && <Truncate text={a.tagline} className="text-xs text-muted-foreground" />}
          </div>
        </div>
      )
    },
  },
  { header: 'Kode', cell: (a) => <span className={mono}>{a.code}</span> },
  {
    header: 'Audiens',
    cell: (a) => (
      <Badge variant={a.audience === 'INTERNAL' ? 'neutral' : 'outline'}>
        {a.audience === 'INTERNAL' ? 'Internal' : 'Publik'}
      </Badge>
    ),
  },
  {
    header: 'Role',
    cell: (a) => a.counts.roles,
    className: 'text-right tabular-nums',
  },
  {
    header: 'Menu',
    cell: (a) => a.counts.menuItems,
    className: 'text-right tabular-nums',
  },
  {
    header: 'Pengguna',
    cell: (a) => a.counts.userAppRoles,
    className: 'text-right tabular-nums',
  },
  { header: 'Status', cell: (a) => <ActiveBadge active={a.isActive} /> },
]

export function ApplicationsPage() {
  const navigate = useNavigate()
  const list = useList<ApplicationListItem>('/applications')
  const { params, setSearch, setFilter } = list
  const act = useApplicationActions()

  const can = useAuthStore((s) => s.hasPermission)
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const canCreate = isSuperAdmin || can('application:create')
  const canUpdate = isSuperAdmin || can('application:update')

  const [formOpen, setFormOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<ApplicationListItem | null>(null)

  const handleCreate = () => {
    setSelectedApp(null)
    setFormOpen(true)
  }

  const handleEdit = (app: ApplicationListItem) => {
    setSelectedApp(app)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Aplikasi"
        description="Aplikasi ekosistem yang terhubung ke gateway terpusat Seloko BPKPD."
        actions={
          canCreate && (
            <Button variant="create" onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Aplikasi
            </Button>
          )
        }
      />

      <DataTable
        list={list}
        columns={columns}
        rowKey={(a) => a.id}
        emptyTitle="Belum ada aplikasi"
        onRowClick={(a) => navigate(APPLICATION_DETAIL(a.id))}
        actions={(a) => (
          <RowActions
            label={a.name}
            actions={[
              {
                label: 'Lihat detail',
                icon: Eye,
                onSelect: () => navigate(APPLICATION_DETAIL(a.id)),
              },
              {
                label: 'Edit aplikasi',
                icon: Edit2,
                onSelect: () => handleEdit(a),
                show: canUpdate,
              },
              {
                label: a.isActive ? 'Nonaktifkan' : 'Aktifkan',
                icon: a.isActive ? PowerOff : Power,
                onSelect: () => act.askToggle(a),
                show: act.canToggle(a),
              },
              {
                label: 'Hapus',
                icon: Trash2,
                destructive: true,
                onSelect: () => act.askDelete(a),
                show: act.canDelete(a),
              },
            ]}
          />
        )}
        toolbar={
          <>
            <SearchBar
              value={params.search}
              onSearch={setSearch}
              placeholder="Cari kode atau nama"
            />
            <FilterSelect
              label="Audiens"
              value={params.audience}
              options={AUDIENCE}
              onChange={(v) => setFilter('audience', v)}
            />
            <FilterSelect
              label="Status"
              value={params.isActive}
              options={ACTIVE}
              onChange={(v) => setFilter('isActive', v)}
            />
          </>
        }
      />

      {act.dialog}

      <ApplicationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={selectedApp}
      />
    </>
  )
}
