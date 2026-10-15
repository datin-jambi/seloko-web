// Path modul aplikasi (dipisah dari file komponen agar fast-refresh tidak terganggu).
export const APPLICATIONS_LIST = '/seloko/sistem/aplikasi'
export const APPLICATION_DETAIL = (id: string) => `/seloko/sistem/aplikasi/${id}`

// Detail pengguna. Penugasan role dikelola di sana (kartu Akses aplikasi),
// jadi "Atur role" mengarah ke detail pengguna, bukan halaman terpisah.
export const ROLE_ASSIGN = (userId: string) => `/seloko/pengguna/${userId}`
