import { useEffect, useState } from 'react'

/** Jeda bawaan pencarian ke server — sama dengan `SearchBar`. */
export const SEARCH_DEBOUNCE_MS = 350

/**
 * Nilai yang tertinggal `delay` ms dari nilai aslinya.
 *
 * Dipakai untuk pencarian yang punya state lokal sendiri (bukan URL param):
 * input tetap responsif, tetapi yang masuk `queryKey`/request adalah nilai
 * tertunda — jadi tiap ketikan tidak memicu request.
 *
 * Untuk list yang pencariannya lewat URL, cukup pakai `SearchBar` — komponen itu
 * sudah men-debounce sendiri.
 */
export function useDebouncedValue<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])

  return debounced
}
