import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ban, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { FilterSelect } from '@/components/shared/SearchBar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RowActions } from '@/components/shared/RowActions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { lapakSkrdService } from '@/services/lapak/skrd.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, formatDateTime } from '@/lib/utils'
import { useLapakList } from '../use-lapak-list'
import { useLapakAccess } from '../lapak-access'
import { formatRupiah } from '../products/format-rupiah'
import { SkrdSettingDialog } from './SkrdSettingDialog'
import type { LapakSkrd, LapakSkrdSetting, SkrdStatus } from '@/types/lapak'

const STATUS_LABEL: Record<SkrdStatus, string> = {
  TERBIT: 'Terbit',
  LUNAS: 'Lunas',
  CANCELLED: 'Dibatalkan',
}

const STATUS_TONE: Record<SkrdStatus, string> = {
  TERBIT: 'border-transparent bg-warning/15 text-warning-foreground',
  LUNAS: 'border-transparent bg-success/10 text-success',
  CANCELLED: 'border-transparent bg-destructive/10 text-destructive',
}

/**
 * SKRD & pengaturan penomoran — `/lapak-jambi/pengaturan-skrd`.
 * Nomor SKRD gapless: terbit otomatis saat checkout, tidak bisa diedit.
 * Pengaturan disimpan sebagai snapshot saat terbit; mengubahnya hanya berlaku ke SKRD baru.
 */
export function LapakSkrdPage() {
  const access = useLapakAccess()
  const qc = useQueryClient()
  const list = useLapakList<LapakSkrd>('/lapak/skrd')
  const [cancelling, setCancelling] = useState<LapakSkrd | null>(null)
  const [editing, setEditing] = useState<LapakSkrdSetting | 'new' | null>(null)
  const [deleting, setDeleting] = useState<LapakSkrdSetting | null>(null)

  const settings = useQuery({
    queryKey: lapakKeys.skrdSettings,
    queryFn: () => lapakSkrdService.settings(),
    enabled: access.canManageSkrd,
  })

  const cancel = useMutation({
    mutationFn: (s: LapakSkrd) => lapakSkrdService.cancel(s.id),
    onSuccess: (s) => {
      toast.success(`SKRD ${s.number} dibatalkan`)
      void qc.invalidateQueries({ queryKey: lapakKeys.skrd })
      setCancelling(null)
    },
    onError: (e) => toast.error('Gagal membatalkan SKRD', { description: apiErrorMessage(e) }),
  })

  const remove = useMutation({
    mutationFn: (s: LapakSkrdSetting) => lapakSkrdService.deleteSetting(s.id),
    onSuccess: () => {
      toast.success('Pengaturan dihapus')
      void qc.invalidateQueries({ queryKey: lapakKeys.skrdSettings })
      setDeleting(null)
    },
    onError: (e) => toast.error('Gagal menghapus pengaturan', { description: apiErrorMessage(e) }),
  })

  return (
    <>
      <PageHeader
        title="Pengaturan SKRD"
        description="Penomoran, penandatangan, dan rekening untuk dokumen SKRD yang diterbitkan."
      />

      <Tabs defaultValue="daftar">
        <TabsList>
          <TabsTrigger value="daftar">Daftar SKRD</TabsTrigger>
          {access.canManageSkrd && <TabsTrigger value="pengaturan">Pengaturan</TabsTrigger>}
        </TabsList>

        <TabsContent value="daftar">
          <DataTable
            list={list}
            columns={[
              {
                header: 'Nomor SKRD',
                cell: (s) => (
                  <div className="min-w-0">
                    <span className="font-mono text-sm font-medium">{s.number}</span>
                    <div className="text-xs text-muted-foreground">
                      {s.documentType === 'DIPERSAMAKAN' ? 'Dipersamakan' : 'SKRD'} · {s.issuerName}
                    </div>
                  </div>
                ),
              },
              {
                header: 'Pesanan',
                cell: (s) => (
                  <div className="text-sm">
                    <span className="font-mono text-xs">{s.orderCode}</span>
                    <div className="text-xs text-muted-foreground">{s.applicantName}</div>
                  </div>
                ),
              },
              { header: 'Nominal', cell: (s) => <span className="tabular-nums">{formatRupiah(s.amount)}</span> },
              { header: 'Jatuh tempo', cell: (s) => <span className="text-sm">{formatDateTime(s.dueAt)}</span> },
              {
                header: 'Status',
                cell: (s) => (
                  <Badge variant="outline" className={STATUS_TONE[s.status]}>
                    {STATUS_LABEL[s.status]}
                  </Badge>
                ),
              },
            ]}
            rowKey={(s) => s.id}
            emptyTitle="Belum ada SKRD"
            toolbar={
              <FilterSelect
                label="Status"
                value={list.params.status}
                options={Object.entries(STATUS_LABEL) as [string, string][]}
                onChange={(v) => list.setFilter('status', v)}
              />
            }
            actions={(s) => (
              <RowActions
                label={`Aksi SKRD ${s.number}`}
                actions={[
                  {
                    label: 'Batalkan SKRD',
                    icon: Ban,
                    destructive: true,
                    show: access.canManageSkrd && s.status !== 'CANCELLED',
                    onSelect: () => setCancelling(s),
                  },
                ]}
              />
            )}
          />
        </TabsContent>

        {access.canManageSkrd && (
          <TabsContent value="pengaturan">
            <div className="mb-3 flex justify-end">
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus />
                Tambah pengaturan
              </Button>
            </div>
            <div className="divide-y divide-border rounded-lg border border-border">
              {settings.data?.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">Belum ada pengaturan SKRD.</p>
              )}
              {settings.data?.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {s.organizationCode ? `OPD ${s.organizationCode}` : 'Default (Bapenda)'}
                      {!s.isActive && <span className="ml-2 text-xs text-muted-foreground">nonaktif</span>}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{s.numberFormat}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.signerName} · jatuh tempo {s.dueDays} hari
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
                      Ubah
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Hapus pengaturan" onClick={() => setDeleting(s)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {editing && (
        <SkrdSettingDialog
          open
          initial={editing === 'new' ? null : editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        pending={cancel.isPending}
        title={`Batalkan SKRD ${cancelling?.number ?? ''}?`}
        description="Nomor tidak dipakai ulang. Pesanan terkait perlu ditangani sesuai alur pembatalan."
        confirmLabel="Batalkan SKRD"
        destructive
        onConfirm={() => cancelling && cancel.mutate(cancelling)}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        pending={remove.isPending}
        title="Hapus pengaturan ini?"
        description="SKRD yang sudah terbit tetap memakai snapshot pengaturannya. Hanya pengaturan berikutnya yang berubah."
        confirmLabel="Hapus"
        destructive
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}
