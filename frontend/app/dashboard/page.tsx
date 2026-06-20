'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/layout/shell'
import { RepoList } from '@/components/repos/repo-list'
import { DashboardCharts } from '@/components/dashboard/charts'
import { repos as reposApi, statsApi, sync, type Repo, type Stats, type SyncLog } from '@/lib/api'

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([reposApi.list(), statsApi.get(), sync.logs()])
      .then(([r, s, l]) => { setRepos(r); setStats(s); setLogs(l) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="space-y-6">
        <DashboardCharts stats={stats} repos={repos} logs={logs} loading={loading} />
        <div>
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-2 px-0.5">
            repositories
          </p>
          {loading ? (
            <p className="font-mono text-[12px] text-muted-foreground py-8 text-center">loading...</p>
          ) : (
            <RepoList repos={repos} />
          )}
        </div>
      </div>
    </Shell>
  )
}
