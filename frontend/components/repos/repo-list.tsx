import { RepoCard } from './repo-card'
import type { Repo, ForgeAccount } from '@/lib/api'

interface RepoListProps {
  repos: Repo[]
  forges?: ForgeAccount[]
  onSync?: (id: string) => void
  onUpdateMappings?: (repoId: string, targets: string[]) => void
  syncing?: string | null
}

export function RepoList({ repos, forges = [], onSync, onUpdateMappings, syncing }: RepoListProps) {
  if (repos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center font-mono">
        no repos configured
      </p>
    )
  }

  return (
    <div className="flex flex-col rounded-md overflow-hidden border border-border divide-y divide-border">
      {repos.map((repo) => (
        <RepoCard 
          key={repo.id} 
          repo={repo} 
          forges={forges}
          onSync={onSync} 
          onUpdateMappings={onUpdateMappings}
          syncing={syncing} 
        />
      ))}
    </div>
  )
}
