import { Shell } from '@/components/layout/shell'
import { StatusBadge } from '@/components/repos/status-badge'
import { MOCK_REPOS, FORGE_LABELS, formatRelativeTime } from '@/lib/mock-data'
import { notFound } from 'next/navigation'

export default async function RepoDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const repo = MOCK_REPOS.find((r) => r.id === id)
  if (!repo) notFound()

  return (
    <Shell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-mono text-lg font-semibold text-foreground">
            {repo.fullName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Source: {FORGE_LABELS[repo.sourceForge]}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusBadge status={repo.status} />
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last synced</span>
            <span className="text-sm font-mono text-card-foreground">
              {formatRelativeTime(repo.lastSyncedAt)}
            </span>
          </div>
          <div className="px-4 py-3 flex items-start justify-between gap-4">
            <span className="text-sm text-muted-foreground shrink-0">
              Target forges
            </span>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {repo.targetForges.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-mono"
                >
                  {FORGE_LABELS[f]}
                </span>
              ))}
            </div>
          </div>
          {repo.errorMessage && (
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Error</p>
              <p className="text-sm font-mono text-destructive">
                {repo.errorMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
