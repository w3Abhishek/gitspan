'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/layout/shell'
import { sync as syncApi, type SyncLog } from '@/lib/api'
import { FORGE_LABELS } from '@/lib/mock-data'

const STATUS_COLOR: Record<string, string> = {
  synced: 'text-green-400',
  running: 'text-primary',
  error: 'text-destructive',
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SyncLogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    syncApi.logs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">sync log</p>
          <span className="font-mono text-[11px] text-muted-foreground">{logs.length} entries</span>
        </div>
        {loading ? (
          <p className="font-mono text-[12px] text-muted-foreground py-8 text-center">loading...</p>
        ) : logs.length === 0 ? (
          <p className="font-mono text-[12px] text-muted-foreground py-8 text-center">no sync logs yet — trigger a sync to see activity here</p>
        ) : (
          <div className="flex flex-col rounded-md overflow-hidden border border-border divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 bg-card px-4 py-2.5">
                <span className="font-mono text-[13px] text-card-foreground w-48 shrink-0 truncate">{log.repo_name}</span>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  {FORGE_LABELS[log.source_forge] ?? log.source_forge} → {FORGE_LABELS[log.target_forge] ?? log.target_forge}
                </span>
                {log.error_message && (
                  <span className="font-mono text-[11px] text-destructive/80 truncate hidden lg:block flex-1">{log.error_message}</span>
                )}
                <div className="ml-auto flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{formatRelative(log.started_at)}</span>
                  <span className={`font-mono text-[11px] font-medium ${STATUS_COLOR[log.status] ?? 'text-muted-foreground'}`}>{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}
