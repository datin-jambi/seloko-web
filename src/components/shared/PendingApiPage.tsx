import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'

// Menu sudah terdaftar di DB tetapi halaman/endpoint-nya belum ada.
export function PendingApiPage({ title, note }: { title: string; note: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={Construction}
        title="Belum tersedia"
        description={`Fitur ini belum tersedia — ${note}.`}
      />
    </>
  )
}
