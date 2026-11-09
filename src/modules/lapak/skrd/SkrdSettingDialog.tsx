import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { lapakSkrdService } from '@/services/lapak/skrd.service'
import { lapakKeys } from '@/lib/query-keys'
import { apiErrorMessage, apiFieldErrors } from '@/lib/utils'
import type { LapakSkrdSetting, SkrdSettingBody } from '@/types/lapak'

interface Values {
  organizationCode: string
  issuer: 'BAPENDA' | 'OPD'
  numberFormat: string
  signerName: string
  signerNip: string
  signerPosition: string
  bankName: string
  bankAccount: string
  bankHolder: string
  dueDays: string
  isActive: boolean
}

const DEFAULT_FORMAT = '{seq6}/SKRD/{issuer}/{romanMonth}/{year}'

const EMPTY: Values = {
  organizationCode: '',
  issuer: 'BAPENDA',
  numberFormat: DEFAULT_FORMAT,
  signerName: '',
  signerNip: '',
  signerPosition: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  dueDays: '7',
  isActive: true,
}

const fromSetting = (s: LapakSkrdSetting): Values => ({
  organizationCode: s.organizationCode ?? '',
  issuer: s.issuer,
  numberFormat: s.numberFormat,
  signerName: s.signerName,
  signerNip: s.signerNip ?? '',
  signerPosition: s.signerPosition ?? '',
  bankName: s.bankName ?? '',
  bankAccount: s.bankAccount ?? '',
  bankHolder: s.bankHolder ?? '',
  dueDays: String(s.dueDays),
  isActive: s.isActive,
})

/**
 * Dialog pengaturan SKRD. Pengaturan OPD kosong = default (Bapenda).
 * Nomor disimpan gapless: token `{seq}`/`{seq6}` wajib ada, token asing ditolak server (400).
 * Pratinjau nomor berikutnya diambil dari server, bukan dihitung di sini.
 */
export function SkrdSettingDialog({
  open,
  initial,
  onOpenChange,
}: {
  open: boolean
  initial: LapakSkrdSetting | null
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const [v, setV] = useState<Values>(initial ? fromSetting(initial) : EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((p) => ({ ...p, [k]: val }))

  const save = useMutation({
    mutationFn: (body: SkrdSettingBody) => lapakSkrdService.saveSetting(body),
    onSuccess: () => {
      toast.success('Pengaturan SKRD disimpan')
      void qc.invalidateQueries({ queryKey: lapakKeys.skrdSettings })
      onOpenChange(false)
    },
    onError: (e) => {
      const fe = apiFieldErrors(e)
      if (fe) setErrors(fe)
      else toast.error('Gagal menyimpan', { description: apiErrorMessage(e) })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (v.signerName.trim().length < 3) next.signerName = 'Nama penandatangan minimal 3 karakter'
    if (!/\{seq6?\}/.test(v.numberFormat)) next.numberFormat = 'Format wajib memuat {seq} atau {seq6}'
    const days = Number(v.dueDays)
    if (!Number.isInteger(days) || days < 1 || days > 365) next.dueDays = 'Jatuh tempo 1–365 hari'
    setErrors(next)
    if (Object.keys(next).length) return

    const opt = (s: string) => (s.trim() ? s.trim() : undefined)
    save.mutate({
      organizationCode: v.issuer === 'OPD' ? opt(v.organizationCode) : undefined,
      issuer: v.issuer,
      numberFormat: v.numberFormat.trim(),
      signerName: v.signerName.trim(),
      signerNip: opt(v.signerNip),
      signerPosition: opt(v.signerPosition),
      bankName: opt(v.bankName),
      bankAccount: opt(v.bankAccount),
      bankHolder: opt(v.bankHolder),
      dueDays: days,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{initial ? 'Ubah pengaturan SKRD' : 'Tambah pengaturan SKRD'}</DialogTitle>
            <DialogDescription>
              Berlaku untuk SKRD yang terbit setelah disimpan. SKRD lama tidak berubah.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <FormField id="skrd-issuer" label="Penerbit" error={errors.issuer}>
              <Select value={v.issuer} onValueChange={(x) => set('issuer', x as Values['issuer'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAPENDA">Bapenda</SelectItem>
                  <SelectItem value="OPD">OPD</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {v.issuer === 'OPD' && (
              <FormField id="skrd-org-code" label="Kode OPD" error={errors.organizationCode} hint="Kosong = pengaturan default">
                <Input value={v.organizationCode} onChange={(e) => set('organizationCode', e.target.value)} />
              </FormField>
            )}

            <FormField
              id="skrd-format"
              label="Format nomor"
              error={errors.numberFormat}
              hint="Token: {seq6} {seq} {issuer} {orgCode} {romanMonth} {month} {year}"
            >
              <Input
                className="font-mono"
                value={v.numberFormat}
                onChange={(e) => set('numberFormat', e.target.value)}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="skrd-signer-name" label="Nama penandatangan" error={errors.signerName}>
                <Input value={v.signerName} onChange={(e) => set('signerName', e.target.value)} />
              </FormField>
              <FormField id="skrd-nip" label="NIP">
                <Input value={v.signerNip} onChange={(e) => set('signerNip', e.target.value)} />
              </FormField>
              <FormField id="skrd-position" label="Jabatan">
                <Input value={v.signerPosition} onChange={(e) => set('signerPosition', e.target.value)} />
              </FormField>
              <FormField id="skrd-due-days" label="Jatuh tempo (hari)" error={errors.dueDays}>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={v.dueDays}
                  onChange={(e) => set('dueDays', e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id="skrd-bank" label="Bank">
                <Input value={v.bankName} onChange={(e) => set('bankName', e.target.value)} />
              </FormField>
              <FormField id="skrd-account" label="No. rekening">
                <Input value={v.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} />
              </FormField>
              <FormField id="skrd-holder" label="Atas nama">
                <Input value={v.bankHolder} onChange={(e) => set('bankHolder', e.target.value)} />
              </FormField>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
