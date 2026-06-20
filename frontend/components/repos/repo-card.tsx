import Link from 'next/link'
import { StatusBadge } from './status-badge'
import { formatRelativeTime, FORGE_LABELS } from '@/lib/mock-data'
import type { Repo, ForgeAccount } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const STATUS_BORDER: Record<string, string> = {
  synced: 'border-l-green-500',
  pending: 'border-l-primary',
  error: 'border-l-destructive',
}

function ForgePill({ forge, dim }: { forge: string; dim?: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-px rounded-sm text-[11px] font-mono border',
      dim ? 'bg-transparent text-muted-foreground border-border' : 'bg-secondary text-secondary-foreground border-transparent'
    )}>
      {FORGE_LABELS[forge] ?? forge}
    </span>
  )
}

interface RepoCardProps {
  repo: Repo
  forges?: ForgeAccount[]
  onSync?: (id: string) => void
  onUpdateMappings?: (repoId: string, mappings: string[]) => void
  syncing?: string | null
}

export function RepoCard({ repo, forges = [], onSync, onUpdateMappings, syncing }: RepoCardProps) {
  const [showMap, setShowMap] = useState(false)
  const availableForges = forges.filter(f => f.type !== repo.source_forge)

  return (
    <div className={cn(
      'group flex flex-col bg-card border border-border border-l-2',
      'first:rounded-t-md last:rounded-b-md',
      STATUS_BORDER[repo.status] ?? 'border-l-border'
    )}>
      <div className="flex items-center gap-4 px-4 py-2.5">
        <Link
          href={`/repos/${repo.id}`}
          className="font-mono text-[13px] font-medium text-card-foreground w-52 shrink-0 truncate hover:text-primary transition-colors"
        >
          {repo.full_name}
        </Link>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          <ForgePill forge={repo.source_forge} />
          <span className="text-muted-foreground text-[11px] font-mono shrink-0"> → </span>
          <div className="flex items-center gap-1 flex-wrap">
            {repo.target_forges.length > 0 
              ? repo.target_forges.map((f, i) => <ForgePill key={i} forge={f} dim />)
              : <span className="text-[10px] font-mono text-muted-foreground italic">unmapped</span>
            }
          </div>
        </div>
        {repo.error_message ? (
          <span className="text-[11px] font-mono text-destructive/80 truncate max-w-xs hidden lg:block">{repo.error_message}</span>
        ) : (
          <span className="flex-1 hidden lg:block" />
        )}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{formatRelativeTime(repo.last_synced_at)}</span>
          <StatusBadge status={repo.status as 'synced' | 'pending' | 'error'} />
          
          {repo.target_forges.length === 0 && onUpdateMappings && (
            <button
              onClick={() => setShowMap(!showMap)}
              className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors"
            >
              setup
            </button>
          )}

          {repo.target_forges.length > 0 && onSync && (
            <button
              onClick={() => onSync(repo.id)}
              disabled={syncing === repo.id}
              className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
            >
              {syncing === repo.id ? '.' : 'sync'}
            </button>
          )}
        </div>
      </div>
      
      {showMap && availableForges.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted-foreground">Select destination:</span>
          <div className="flex gap-2 w-full max-w-xs">
            <select 
              id={`select-${repo.id}`}
              className="flex-1 bg-background border border-border rounded text-[11px] font-mono px-2 py-1 focus:outline-none"
            >
              <option value="">Choose forge...</option>
              {availableForges.map(f => (
                <option key={f.id} value={f.id}>{FORGE_LABELS[f.type] || f.type} (@{f.username})</option>
              ))}
            </select>
            <button 
                onClick={() => {
                  const el = document.getElementById(`select-${repo.id}`) as HTMLSelectElement;
                  if (el.value && onUpdateMappings) {
                    onUpdateMappings(repo.id, [el.value]);
                    setShowMap(false);
                  }
                }}
                className="bg-primary text-primary-foreground font-mono text-[10px] px-3 rounded hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}