import { lapakGet, lapakGetPage, lapakWrite } from './lapak-client'
import type { LapakSkrd, LapakSkrdSetting, SkrdSettingBody } from '@/types/lapak'

/** SKRD & pengaturan — `/api/lapak/skrd`. Pengaturan disimpan sebagai snapshot saat terbit. */
export const lapakSkrdService = {
  list: (params: Record<string, string>) => lapakGetPage<LapakSkrd>('/lapak/skrd', params),
  settings: () => lapakGet<LapakSkrdSetting[]>('/lapak/skrd/settings'),
  saveSetting: (body: SkrdSettingBody) => lapakWrite<LapakSkrdSetting>('post', '/lapak/skrd/settings', body),
  deleteSetting: (id: string) => lapakWrite<{ id: string; deleted: true }>('delete', `/lapak/skrd/settings/${id}`),
  preview: (organizationCode: string) =>
    lapakGet<{ issuer: string; year: number; nextSeq: number; preview: string }>(
      `/lapak/skrd/settings/preview/${organizationCode}`,
    ),
  cancel: (id: string) => lapakWrite<LapakSkrd>('post', `/lapak/skrd/${id}/cancel`),
}
