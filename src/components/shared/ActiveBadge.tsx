import { Badge } from '@/components/ui/badge'

export function ActiveBadge({ active, on = 'Aktif', off = 'Nonaktif' }: { active: boolean; on?: string; off?: string }) {
  return <Badge variant={active ? 'success' : 'outline'}>{active ? on : off}</Badge>
}
