import { Badge } from '@/components/ui/badge'

export function ActiveBadge({ active, on = 'Aktif', off = 'Nonaktif' }: { active: boolean; on?: string; off?: string }) {
  return (
    <Badge dot variant={active ? 'success' : 'neutral'}>
      {active ? on : off}
    </Badge>
  )
}
