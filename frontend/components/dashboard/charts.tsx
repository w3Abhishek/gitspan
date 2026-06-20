'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { MOCK_SYNC_ACTIVITY } from '@/lib/mock-data'
import type { Stats, Repo } from '@/lib/api'

const STATUS_COLORS = {
  synced: '#22c55e',
  pending: '#818cf8',
  error: '#f87171',
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-mono font-bold ${accent ?? 'text-card-foreground'}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground font-mono">{sub}</p>}
    </div>
  )
}

function SyncActivityChart({ logs = [] }: { logs: any[] }) {
  // Aggregate real logs by day
  const dailyStats = new Map()
  
  // Initialize last 14 days with 0s
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    dailyStats.set(dateStr, { date: dateStr, synced: 0, errors: 0 })
  }

  // Count actual logs matching the dates
  logs.forEach(log => {
    if (!log.started_at) return
    const dateStr = log.started_at.split('T')[0]
    if (dailyStats.has(dateStr)) {
      const current = dailyStats.get(dateStr)
      if (log.status === 'error') current.errors++
      else current.synced++
    }
  })

  // We are removing MOCK_SYNC_ACTIVITY fully and relying on calculated real aggregates here
  const data = Array.from(dailyStats.values())

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
        sync activity - last 14 days
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="syncGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: 11, fontFamily: 'var(--font-mono)' }} labelStyle={{ color: 'var(--color-muted-foreground)' }} />
          <Area type="monotone" dataKey="synced" stroke="#818cf8" fill="url(#syncGrad)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="errors" stroke="#f87171" fill="url(#errGrad)" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2">
        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5"><span className="inline-block w-2 h-0.5 bg-[#818cf8]" /> synced</span>
        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5"><span className="inline-block w-2 h-0.5 bg-[#f87171]" /> errors</span>
      </div>
    </div>
  )
}

function StatusDonut({ stats, repos }: { stats: Stats | null; repos: Repo[] }) {
  const synced  = stats?.synced  ?? repos.filter(r => r.status === 'synced').length
  const pending = stats?.pending ?? repos.filter(r => r.status === 'pending').length
  const errors  = stats?.sync_errors ?? repos.filter(r => r.status === 'error').length
  const data = [
    { name: 'synced',  value: synced,  color: STATUS_COLORS.synced  },
    { name: 'pending', value: pending, color: STATUS_COLORS.pending },
    { name: 'error',   value: errors,  color: STATUS_COLORS.error   },
  ]
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-4">status breakdown</p>
      <div className="flex items-center gap-6 flex-1">
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="font-mono text-[12px] text-muted-foreground w-16">{d.name}</span>
              <span className="font-mono text-[12px] font-bold text-card-foreground">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardCharts({ stats, repos, logs = [], loading }: { stats: Stats | null; repos: Repo[]; logs?: any[]; loading: boolean }) {
  const totalRepos      = stats?.total_repos      ?? repos.length
  const connectedForges = stats?.connected_forges ?? 0
  const syncErrors      = stats?.sync_errors      ?? repos.filter(r => r.status === 'error').length
  const synced          = stats?.synced           ?? repos.filter(r => r.status === 'synced').length
  const todaySyncs      = stats?.total_syncs_today ?? 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Repos"  value={loading ? '-' : totalRepos}      sub={`${todaySyncs} syncs today`} />
        <StatCard label="Forges"       value={loading ? '-' : connectedForges} sub="accounts connected" />
        <StatCard label="Synced"       value={loading ? '-' : synced}          sub="of your repos" accent="text-green-400" />
        <StatCard label="Errors"       value={loading ? '-' : syncErrors}      sub={syncErrors > 0 ? 'need attention' : 'all clear'} accent={syncErrors > 0 ? 'text-destructive' : 'text-card-foreground'} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2"><SyncActivityChart logs={logs} /></div>
        <StatusDonut stats={stats} repos={repos} />
      </div>
    </div>
  )
}
