import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, Truncate, type Column } from '@/components/shared/DataTable'
import { FilterSelect, SearchBar } from '@/components/shared/SearchBar'
import { ActiveBadge } from '@/components/shared/ActiveBadge'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { useList } from '@/hooks/use-list'
import { apiClient } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import type { ArticleCategory, ArticleListItem, ArticleStatus, BannerListItem, PageListItem } from '@/types/bapenda'

// Query tiap endpoint: ../seloko-api/src/modules/{shared/article,bapenda/*}/*.schema.ts.
// Modul bapenda mendukung sortBy/sortOrder — kolom yang bisa diurutkan diberi sortKey.

const ACTIVE: [string, string][] = [
  ['true', 'Aktif'],
  ['false', 'Nonaktif'],
]

const STATUS: Record<ArticleStatus, [string, BadgeProps['variant']]> = {
  DRAFT: ['Draf', 'outline'],
  PENDING_REVIEW: ['Menunggu review', 'warning'],
  APPROVED: ['Disetujui', 'info'],
  REJECTED: ['Ditolak', 'destructive'],
  PUBLISHED: ['Terbit', 'success'],
}
const STATUS_OPTIONS = Object.entries(STATUS).map(([v, [l]]) => [v, l] as [string, string])

const articleColumns: Column<ArticleListItem>[] = [
  { header: 'Judul', sortKey: 'title', cell: (a) => <Truncate text={a.title} className="max-w-sm font-medium" /> },
  { header: 'Kategori', cell: (a) => a.category?.name ?? '—' },
  { header: 'Penulis', cell: (a) => a.author?.fullName ?? '—' },
  {
    header: 'Status',
    cell: (a) => {
      const [label, variant] = STATUS[a.status] ?? [a.status, 'outline']
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  { header: 'Dibuat', sortKey: 'createdAt', cell: (a) => formatDate(a.createdAt) },
  { header: 'Dilihat', sortKey: 'viewCount', cell: (a) => a.viewCount, className: 'text-right tabular-nums' },
]

// Kategori untuk filter berita — daftar pendek tanpa pagination.
function useCategoryOptions() {
  const { data } = useQuery({
    queryKey: ['/bapenda/news/categories', 'options'],
    queryFn: async () =>
      (await apiClient.get<{ data: ArticleCategory[] }>('/bapenda/news/categories')).data.data.map(
        (c) => [c.id, c.name] as [string, string],
      ),
    staleTime: 5 * 60_000,
  })
  return data ?? []
}

const REVIEW = { status: 'PENDING_REVIEW' }

function ArticleList({ title, description, review }: { title: string; description: string; review?: boolean }) {
  const list = useList<ArticleListItem>('/bapenda/news', review ? REVIEW : undefined)
  const categories = useCategoryOptions()
  const { params, setSearch, setFilter } = list
  return (
    <>
      <PageHeader title={title} description={description} />
      <DataTable
        list={list}
        columns={articleColumns}
        rowKey={(a) => a.id}
        emptyTitle={review ? 'Tidak ada berita menunggu review' : 'Belum ada berita'}
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari judul" />
            {!review && (
              <FilterSelect label="Status" value={params.status} options={STATUS_OPTIONS} onChange={(v) => setFilter('status', v)} />
            )}
            <FilterSelect label="Kategori" value={params.categoryId} options={categories} onChange={(v) => setFilter('categoryId', v)} />
          </>
        }
      />
    </>
  )
}

export const NewsPage = () => <ArticleList title="Berita" description="Seluruh berita portal Bapenda." />
export const NewsReviewPage = () => (
  <ArticleList title="Antrian Review" description="Berita yang diajukan dan menunggu persetujuan." review />
)

const categoryColumns: Column<ArticleCategory>[] = [
  { header: 'Nama', cell: (c) => <span className="font-medium">{c.name}</span> },
  { header: 'Slug', cell: (c) => <span className="font-mono text-xs">{c.slug}</span> },
  { header: 'Keterangan', cell: (c) => <Truncate text={c.description} /> },
  { header: 'Urutan', cell: (c) => c.sortOrder, className: 'text-right tabular-nums' },
  { header: 'Status', cell: (c) => <ActiveBadge active={c.isActive} /> },
]

export function NewsCategoriesPage() {
  // Endpoint tanpa pagination (mengembalikan seluruh daftar).
  const list = useList<ArticleCategory>('/bapenda/news/categories')
  const { params, setSearch, setFilter } = list
  return (
    <>
      <PageHeader title="Kategori Berita" />
      <DataTable
        list={list}
        columns={categoryColumns}
        rowKey={(c) => c.id}
        emptyTitle="Belum ada kategori"
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari kategori" />
            <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
          </>
        }
      />
    </>
  )
}

const pageColumns: Column<PageListItem>[] = [
  { header: 'Judul', sortKey: 'title', cell: (p) => <Truncate text={p.title} className="font-medium" /> },
  { header: 'Slug', cell: (p) => <span className="font-mono text-xs">/{p.slug}</span> },
  { header: 'Diperbarui', sortKey: 'updatedAt', cell: (p) => formatDate(p.updatedAt) },
  { header: 'Status', cell: (p) => <ActiveBadge active={p.isPublished} on="Terbit" off="Draf" /> },
]

export function PagesPage() {
  const list = useList<PageListItem>('/bapenda/pages')
  const { params, setSearch, setFilter } = list
  return (
    <>
      <PageHeader title="Halaman Profil" description="Halaman statis portal: profil, visi misi, struktur organisasi." />
      <DataTable
        list={list}
        columns={pageColumns}
        rowKey={(p) => p.id}
        emptyTitle="Belum ada halaman"
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari judul" />
            <FilterSelect
              label="Status"
              value={params.isPublished}
              options={[
                ['true', 'Terbit'],
                ['false', 'Draf'],
              ]}
              onChange={(v) => setFilter('isPublished', v)}
            />
          </>
        }
      />
    </>
  )
}

const bannerColumns: Column<BannerListItem>[] = [
  {
    header: 'Banner',
    sortKey: 'title',
    cell: (b) => (
      <div className="flex items-center gap-3">
        <img
          src={b.imageUrl}
          alt=""
          loading="lazy"
          className="h-10 w-16 shrink-0 rounded border border-border bg-muted object-cover"
        />
        <Truncate text={b.title} className="font-medium" />
      </div>
    ),
  },
  { header: 'Tautan', cell: (b) => <Truncate text={b.buttonUrl} className="font-mono text-xs" /> },
  { header: 'Urutan', sortKey: 'sortOrder', cell: (b) => b.sortOrder, className: 'text-right tabular-nums' },
  { header: 'Status', cell: (b) => <ActiveBadge active={b.isActive} /> },
]

export function BannersPage() {
  const list = useList<BannerListItem>('/bapenda/banners')
  const { params, setSearch, setFilter } = list
  return (
    <>
      <PageHeader title="Banner" description="Carousel di beranda portal, tampil sesuai urutan." />
      <DataTable
        list={list}
        columns={bannerColumns}
        rowKey={(b) => b.id}
        emptyTitle="Belum ada banner"
        toolbar={
          <>
            <SearchBar key={params.search} value={params.search} onSearch={setSearch} placeholder="Cari judul" />
            <FilterSelect label="Status" value={params.isActive} options={ACTIVE} onChange={(v) => setFilter('isActive', v)} />
          </>
        }
      />
    </>
  )
}
