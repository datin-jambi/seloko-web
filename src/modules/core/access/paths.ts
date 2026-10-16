// Path halaman hak akses (dipisah dari komponen & form agar fast-refresh tidak terganggu).
export const ROLES_LIST = '/seloko/akses/role'
export const PERMISSIONS_LIST = '/seloko/akses/permission'
export const ROLE_DETAIL = (id: string) => `/seloko/akses/role/${id}`
export const PERMISSION_DETAIL = (id: string) => `/seloko/akses/permission/${id}`
