import { apiClient } from '@/lib/api-client'

/**
 * Storage (ImageKit) — ../seloko-api/src/modules/core/storage/storage.schema.ts
 *
 * Bentuk respons BEDA dari modul Core lain: `{ statusCode, code, message, data }`,
 * bukan `{ success, message, data }`. Jangan disamakan.
 */
export interface StorageFile {
  fileId: string
  url: string
  name: string
  /** Byte. */
  size: number
  filePath: string
  thumbnailUrl?: string | null
}

/** Metadata lengkap dari GET /storage/:fileId (ada width/height untuk gambar). */
export interface StorageFileDetails extends StorageFile {
  fileType: string
  width?: number
  height?: number
  createdAt?: string
  updatedAt?: string
}

interface StorageEnvelope<T> {
  statusCode: number
  code: string
  message: string
  data: T
}

export interface UploadOptions {
  /** Folder tujuan, mis. `organizations`. Hanya huruf/angka/strip/underscore. */
  module: string
  subFolder?: string
  /** Laporan progres unggah 0–100. */
  onProgress?: (percent: number) => void
}

export const storageService = {
  /**
   * POST /storage/upload (multipart/form-data, field `file`).
   *
   * `Content-Type` dihapus (undefined) supaya browser menuliskan sendiri
   * `multipart/form-data; boundary=…` — instance apiClient memasang
   * `application/json` global yang membuat server menolak dengan 400.
   * `timeout` dilonggarkan: unggah gambar jauh lebih lama dari request JSON.
   */
  upload: async (file: File, opts: UploadOptions): Promise<StorageFile> => {
    const form = new FormData()
    form.append('file', file)

    const res = await apiClient.post<StorageEnvelope<StorageFile | StorageFile[]>>('/storage/upload', form, {
      headers: { 'Content-Type': undefined },
      params: { module: opts.module, ...(opts.subFolder ? { subFolder: opts.subFolder } : {}) },
      timeout: 60_000,
      onUploadProgress: (e) => {
        const total = e.total ?? 0
        if (opts.onProgress && total > 0) opts.onProgress(Math.round((e.loaded / total) * 100))
      },
    })

    // Satu berkas → objek; beberapa berkas → array. Kita hanya mengunggah satu.
    const data = res.data.data
    return Array.isArray(data) ? data[0]! : data
  },

  /** GET /storage/:fileId — metadata (size, width, height, fileType). */
  details: async (fileId: string): Promise<StorageFileDetails> =>
    (await apiClient.get<StorageEnvelope<StorageFileDetails>>(`/storage/${fileId}`)).data.data,

  /** DELETE /storage/:fileId — dipakai saat logo diganti atau form dibatalkan. */
  remove: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/storage/${fileId}`)
  },
}

/** 245123 → "239,4 KB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1).replace('.', ',')} KB`
  return `${(kb / 1024).toFixed(2).replace('.', ',')} MB`
}
