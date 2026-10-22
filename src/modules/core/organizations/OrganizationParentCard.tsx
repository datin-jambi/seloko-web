import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowUpRight, Loader2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { organizationService } from '@/services/organization.service'
import { apiErrorMessage } from '@/lib/utils'
import type { OrganizationDetail } from '@/types/core'
import { parentChoices } from './organization-form'

const NONE = '__none'

/**
 * Manajemen induk di halaman detail.
 *
 * - Pilihan induk TIDAK memuat diri sendiri maupun turunannya (server menolak
 *   siklus dengan 400, jadi opsi yang pasti gagal tidak ditampilkan).
 * - Melepas induk mengirim `parentId: null` lewat PUT.
 * - Pindah induk memakai PUT yang sama; `code` tidak pernah ikut karena terkunci.
 */
export function OrganizationParentCard({ org }: { org: OrganizationDetail }) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(org.parentId ?? NONE)
  const [confirmMove, setConfirmMove] = useState(false)

  // Seluruh organisasi untuk pilihan induk (maks 100; cukup untuk master OPD).
  const all = useQuery({
    queryKey: ['organizations', 'all-for-parent'],
    queryFn: () => organizationService.list({ limit: '100', sortBy: 'code', sortOrder: 'asc' }),
    staleTime: 60_000,
  })

  const choices = parentChoices(all.data?.data ?? [], org.id)
  const target = selected === NONE ? null : (choices.find(([id]) => id === selected)?.[1] ?? null)

  const save = useMutation({
    mutationFn: (parentId: string | null) => organizationService.update(org.id, { parentId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['organizations'] })
      void qc.invalidateQueries({ queryKey: ['/organizations'] })
      toast.success(selected === NONE ? 'Induk dilepas' : 'Induk diperbarui')
      setConfirmMove(false)
    },
    onError: (e) => {
      toast.error('Gagal mengubah induk', { description: apiErrorMessage(e) })
      setConfirmMove(false)
    },
  })

  const dirty = (org.parentId ?? NONE) !== selected

  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-1 text-sm font-semibold">Induk organisasi</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Menentukan posisi organisasi ini dalam hierarki. Melepas induk menjadikannya unit tingkat atas.
      </p>

      <div className="space-y-2">
        <Select value={selected} onValueChange={setSelected} disabled={all.isPending}>
          <SelectTrigger aria-label="Induk organisasi" className="w-full">
            <SelectValue placeholder="Tanpa induk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Tanpa induk (tingkat atas)</SelectItem>
            {choices.map(([id, label]) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="edit"
            disabled={!dirty || save.isPending}
            onClick={() => setConfirmMove(true)}
          >
            {save.isPending ? <Loader2 className="animate-spin" /> : <ArrowUpRight />}
            {selected === NONE ? 'Lepas induk' : 'Pindahkan'}
          </Button>
          {dirty && (
            <Button variant="outline" onClick={() => setSelected(org.parentId ?? NONE)} disabled={save.isPending}>
              <Unlink />
              Batal
            </Button>
          )}
        </div>
        {dirty && (
          <p className="text-xs text-muted-foreground">
            Perubahan belum disimpan — induk saat ini:{' '}
            <strong>{org.parent?.code ?? 'tanpa induk'}</strong>
            {target && (
              <>
                {' '}
                → menjadi <strong>{target}</strong>
              </>
            )}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmMove}
        onOpenChange={setConfirmMove}
        title={selected === NONE ? 'Lepas induk organisasi?' : 'Pindahkan organisasi?'}
        description={
          selected === NONE ? (
            <>
              <strong>{org.name}</strong> akan menjadi unit <strong>tingkat atas</strong> dan tidak lagi berada di bawah{' '}
              <strong>{org.parent?.code ?? '—'}</strong>. Sub-unit miliknya tetap utuh.
            </>
          ) : (
            <>
              <strong>{org.name}</strong> akan dipindahkan ke bawah <strong>{target}</strong>. Sub-unit yang sudah ada
              ikut berpindah bersama induknya.
            </>
          )
        }
        confirmLabel={selected === NONE ? 'Lepas induk' : 'Pindahkan'}
        pending={save.isPending}
        onConfirm={() => save.mutate(selected === NONE ? null : selected)}
      />
    </section>
  )
}
