'use client'

import { Shell } from '@/components/layout/shell'
import { useAuth } from '@/lib/auth-context'
import { FORGE_LABELS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { forges as forgesApi, type ForgeAccount } from '@/lib/api'

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/20 text-primary',
  'self-hosted': 'bg-secondary text-secondary-foreground',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">{title}</p>
      <div className="flex flex-col rounded-md overflow-hidden border border-border divide-y divide-border">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between bg-card px-4 py-2.5 gap-4">
      <span className="font-mono text-[12px] text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-[12px] text-card-foreground text-right">{children}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [accounts, setAccounts] = useState<ForgeAccount[]>([])

  useEffect(() => {
    forgesApi.list().then(setAccounts).catch(console.error)
  }, [])

  if (!user) return null

  return (
    <Shell>
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-mono font-bold text-secondary-foreground shrink-0">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-mono text-sm font-semibold text-foreground">{user.name}</p>
            <p className="font-mono text-[12px] text-muted-foreground">{user.email}</p>
          </div>
          <span className={cn('ml-auto text-[11px] font-mono px-2 py-0.5 rounded uppercase tracking-wide', PLAN_BADGE[user.plan])}>
            {user.plan}
          </span>
        </div>

        <Section title="account">
          <Row label="name">{user.name}</Row>
          <Row label="email">{user.email}</Row>
          <Row label="role">{user.role}</Row>
          <Row label="plan">
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide', PLAN_BADGE[user.plan])}>
              {user.plan}
            </span>
          </Row>
        </Section>

        <Section title="usage">
          <Row label="forges connected">{accounts.length}</Row>
          <Row label="connected forges">
            <span className="flex gap-1.5 flex-wrap justify-end">
              {accounts.map((a) => (
                <span key={a.id} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-mono">
                  {FORGE_LABELS[a.type] ?? a.type}
                </span>
              ))}
            </span>
          </Row>
        </Section>

        <Section title="danger zone">
          <div className="bg-card px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-mono text-[12px] text-card-foreground">Sign out</p>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">End your current session.</p>
            </div>
            <button onClick={logout} className="font-mono text-[12px] text-destructive border border-destructive/40 hover:bg-destructive/10 px-3 py-1.5 rounded transition-colors shrink-0 ml-4">
              sign out
            </button>
          </div>
        </Section>
      </div>
    </Shell>
  )
}
