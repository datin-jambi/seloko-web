import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { RowActions } from '@/components/shared/RowActions'
import { Button } from '@/components/ui/button'
import { useList } from '@/hooks/use-list'
import { useAuthStore } from '@/stores/auth-store'
import { applicationService } from '@/services/application.service'
import type { PermissionListItem } from '@/types/core'
import { PermissionFormDialog } from './PermissionFormDialog'
import { useAccessActions } from './use-access-actions'
import { PERMISSION_DETAIL } from './paths'

const mono = 'font-mono text-xs tabular-nums'

// Filter mengikuti ListPermissionsQuerySchema
// (../seloko-api/src/modules/core/permissions/permissions.schema.ts):
// search, applicationId, module, page, limit. Tidak ada sortBy.
//
// Modul per aplikasi diambil dari GET /permissions/modules?applicationId=… — endpoint itu
// WAJIB applicationId, jadi filter Modul baru aktif setelah aplikasi dipilih.
export function PermissionsPage() {
  const navigate = useNavigate()
  const list = useList<PermissionListItem>('/permissions')
  const { params, setSearch, setFilter, setParams } = list
  const act = useAccessActions()

  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin)
  const can = useAuthStore((s) => s.hasPermission)
  const canCreate = isSuperAdmin || can('permission:create')
  const canUpdate = isSuperAdmin || can('permission:update')
  const canDelete = isSuperAdmin || can('permission:delete')

  const [form, setForm] = useState<{ open: boolean; permission: PermissionListItem | null }>({
    open: false,
    permission: null,
  })

  const applicationId = params.applicationId

  const apps = useQuery({
    queryKey: ['/applications', 'all'],
    queryFn: () => applicationService.listAll(),
    staleTime: 5 * 60_000,
  })

  // Isi dropdown Modul. Hanya saat aplikasi dipilih (endpoint menuntut applicationId).
  const modules = useQuery({
    queryKey: ['/permissions/modules', applicationId],
    queryFn: () => applicationService.listModules(applicationId!),
    enabled: !!applicationId,
    staleTime: 5 * 60_000,
  })

  const columns: Column<PermissionListItem>[] = [
    {
      header: 'Permission',
      cell: (p) => (
        <div>
          <div className="font-medium">{p.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{p.code}</div>
        </div>
      ),
    },
    { header: 'Modul', cell: (p) => p.module },
    // Kolom aplikasi mubazir saat satu aplikasi disaring.
    ...(applicationId ? [] : [{ header: 'Aplikasi', cell: (p: PermissionListItem) => <span className={mono}>{p.applicationCode}</span> }]),
    { header: 'Role', cell: (p) => p.roleCount, className: 'text-right tabular-nums' },
    { header: 'Menu', cell: (p) => p.menuCount, className: 'text-right tabular-nums' },
  ]

  const selectedApp = apps.data?.find((a) => a.id === applicationId)

  return (
    <>
      <PageHeader
        title="Permission"
        description="Hak akses terkecil yang dicek oleh API."
        actions={
          canCreate && (
            <Button variant="create" onClick={() => setForm({ open: true, permission: null })}>
              <Plus />
              Tambah permission
            </Button>
          )
        }
      />
      <DataTable
        list={list}
        columns={columns}
        rowKey={(p) => p.id}
        emptyTitle="Belum ada permission"
        onRowClick={(p) => navigate(PERMISSION_DETAIL(p.id))}
        actions={(p) => (
          <RowActions
            label={`permission ${p.code}`}
            actions={[
              { label: 'Ubah', icon: Pencil, onSelect: () => setForm({ open: true, permission: p }), show: canUpdate },
              { label: 'Hapus', icon: Trash2, destructive: true, onSelect: () => act.askPermissionDelete(p), show: canDelete },
            ]}
          />
        )}
        toolbar={
          <>
            <SearchBar value={params.search} onSearch={setSearch} placeholder="Cari kode atau nama" />
            <FilterSelect
              label="Aplikasi"
              title={selectedApp ? `Kode: ${selectedApp.code}` : undefined}
              value={applicationId}
              options={(apps.data ?? []).map((a) => [a.id, a.name])}
              // Ganti aplikasi = modul aplikasi lama tidak berlaku lagi.
              onChange={(v) => setParams({ applicationId: v, module: undefined })}
            />
            <FilterSelect
              label="Modul"
              disabled={!applicationId}
              title={applicationId ? 'Modul distingtif aplikasi ini' : 'Pilih aplikasi dulu agar daftar modul terisi'}
              value={params.module}
              options={(modules.data ?? []).map((m) => [m.module, `${m.module} (${m.permissionCount})`])}
              onChange={(v) => setFilter('module', v)}
            />
          </>
        }
      />

      {form.open && (
        <PermissionFormDialog
          permission={form.permission}
          onClose={() => setForm({ open: false, permission: null })}
          onSaved={() => void list.refetch()}
        />
      )}
      {act.dialog}
    </>
  )
}
