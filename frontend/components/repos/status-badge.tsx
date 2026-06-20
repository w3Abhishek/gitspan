import type { SyncStatus } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<SyncStatus, { label: string; className: string }> = {
  synced: {
    label: 'synced',
    className: 'text-green-400',
  },
  pending: {
    label: 'pending',
    className: 'text-primary',
  },
  error: {
    label: 'error',
    className: 'text-destructive',
  },
}

export function StatusBadge({ status }: { status: SyncStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={cn('text-[11px] font-mono font-medium tabular-nums', className)}>
      {label}
    </span>
  )
}
