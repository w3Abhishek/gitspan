'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/layout/shell'
import { RepoList } from '@/components/repos/repo-list'
import { repos as reposApi, sync, forges as forgesApi, type Repo, type ForgeAccount } from '@/lib/api'

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [forges, setForges] = useState<ForgeAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      reposApi.list(),
      forgesApi.list()
    ])
      .then(([rRows, fRows]) => {
         setRepos(rRows)
         setForges(fRows)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdateMappings(repoId: string, targets: string[]) {
    try {
      await reposApi.updateMappings(repoId, targets)
      const updated = await reposApi.list()
      setRepos(updated) // Repaints the UI with destination targets explicitly mapped, preparing for Sync execution!
    } catch(e) {
      console.error(e)
    }
  }

  async function handleSync(id: string) {
    setSyncing(id)
    try {
      await sync.trigger(id)
      const updated = await reposApi.list()
      setRepos(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">repositories</p>
          <span className="font-mono text-[11px] text-muted-foreground">{repos.length} total</span>
        </div>
        {loading ? (
          <p className="font-mono text-[12px] text-muted-foreground py-8 text-center">loading...</p>
        ) : (
          <RepoList repos={repos} forges={forges} onSync={handleSync} onUpdateMappings={handleUpdateMappings} syncing={syncing} />
        )}
      </div>
    </Shell>
  )
}
