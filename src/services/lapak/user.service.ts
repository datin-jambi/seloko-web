import { lapakGet, lapakWrite } from './lapak-client'
import type {
  CreateLapakUserBody,
  LapakRoleOption,
  LapakUser,
  UpdateLapakUserBody,
} from '@/types/lapak'

/**
 * Pengguna aplikasi Lapak — `GET/POST/PUT /lapak/users`.
 *
 * Semua endpoint di sini ber-scope Lapak: server menolak bila pemanggil bukan
 * superadmin/admin Lapak, dan hanya menyentuh pengguna yang punya penugasan
 * role aktif di aplikasi ini. Role yang bisa diberikan juga dibatasi role
 * milik aplikasi Lapak.
 */
export const lapakUserService = {
  /** Role Lapak yang boleh diberikan, opsional disaring per jenis akun. */
  roles: (accountType?: 'INTERNAL' | 'PUBLIC') =>
    lapakGet<LapakRoleOption[]>('/lapak/users/roles', accountType ? { accountType } : undefined),

  /** Detail satu pengguna Lapak. */
  get: (id: string) => lapakGet<LapakUser>(`/lapak/users/${id}`),

  create: (body: CreateLapakUserBody) => lapakWrite<LapakUser>('post', '/lapak/users', body),

  update: (id: string, body: UpdateLapakUserBody) =>
    lapakWrite<LapakUser>('put', `/lapak/users/${id}`, body),
}
