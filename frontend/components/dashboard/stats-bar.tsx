import { cn } from '@/lib/utils'

interface StatLineProps {
  totalRepos: number
  connectedForges: number
  syncErrors: number
}

export function StatsBar({ totalRepos, connectedForges, syncErrors }: StatLineProps) {
  return (
    <div className="flex items-center gap-0 font-mono text-[12px] border border-border rounded-md overflow-hidden divide-x divide-border bg-card">
      <Segment label="repos" value={totalRepos} />
      <Segment label="forges" value={connectedForges} />
      <Segment
        label="errors"
        value={syncErrors}
        valueClass={syncErrors > 0 ? 'text-destructive' : 'text-muted-foreground'}
      />
      <div className="flex-1 px-4 py-2.5 text-muted-foreground text-[11px] hidden sm:flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        sync engine running
      </div>
    </div>
  )
}

function Segment({
  label,
  value,
  valueClass,
}: {
  label: string
  value: number
  valueClass?: string
}) {
  return (
    <div className="flex items-baseline gap-2 px-4 py-2.5 shrink-0">
      <span className={cn('text-base font-bold tabular-nums', valueClass ?? 'text-card-foreground')}>
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
