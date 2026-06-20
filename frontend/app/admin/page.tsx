import { Shell } from '@/components/layout/shell'
import { MOCK_ADMIN_USERS, MOCK_SYNC_ACTIVITY, MOCK_REPOS, formatDate } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const PLAN_BADGE: Record<string, string> = {
  free: 'text-muted-foreground bg-muted',
  pro: 'text-primary bg-primary/20',
  'self-hosted': 'text-secondary-foreground bg-secondary',
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'text-amber-400 bg-amber-400/10',
  user: 'text-muted-foreground bg-transparent',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-mono font-bold text-card-foreground mt-1">{value}</p>
      {sub && <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">{title}</p>
      {children}
    </div>
  )
}

export default function AdminPage() {
  const totalSyncs = MOCK_SYNC_ACTIVITY.reduce((a, b) => a + b.synced, 0)
  const totalErrors = MOCK_SYNC_ACTIVITY.reduce((a, b) => a + b.errors, 0)

  return (
    <Shell>
      <div className="space-y-6">
        {/* Instance stats */}
        <Section title="instance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Users" value={MOCK_ADMIN_USERS.length} />
            <StatCard label="Repos" value={MOCK_REPOS.length} sub="across all users" />
            <StatCard label="Syncs (14d)" value={totalSyncs} sub={`${totalErrors} errors`} />
            <StatCard label="Instance" value="v0.1.0" sub="self-hosted" />
          </div>
        </Section>

        {/* Users table */}
        <Section title="users">
          <div className="flex flex-col rounded-md overflow-hidden border border-border divide-y divide-border">
            {/* Header */}
            <div className="flex items-center gap-4 bg-muted/50 px-4 py-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider w-40 shrink-0">name</span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider w-48 shrink-0 hidden md:block">email</span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">role</span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider w-20 shrink-0">plan</span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider w-12 shrink-0 hidden lg:block">repos</span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider hidden xl:block">joined</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground uppercase tracking-wider">actions</span>
            </div>
            {MOCK_ADMIN_USERS.map((user) => (
              <div key={user.id} className="flex items-center gap-4 bg-card px-4 py-2.5">
                <div className="w-40 shrink-0 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-secondary-foreground shrink-0">
                    {user.name[0]}
                  </div>
                  <span className="font-mono text-[12px] text-card-foreground truncate">{user.name}</span>
                </div>
                <span className="font-mono text-[12px] text-muted-foreground w-48 shrink-0 truncate hidden md:block">
                  {user.email}
                </span>
                <span className={cn(
                  'font-mono text-[10px] px-1.5 py-0.5 rounded w-16 shrink-0 text-center',
                  ROLE_BADGE[user.role]
                )}>
                  {user.role}
                </span>
                <span className={cn(
                  'font-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide w-20 shrink-0 text-center',
                  PLAN_BADGE[user.plan]
                )}>
                  {user.plan}
                </span>
                <span className="font-mono text-[12px] text-muted-foreground w-12 shrink-0 hidden lg:block">
                  {user.repoCount}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground hidden xl:block">
                  {formatDate(user.createdAt)}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    manage
                  </button>
                  {user.role !== 'admin' && (
                    <button className="font-mono text-[11px] text-destructive hover:text-destructive/80 transition-colors">
                      suspend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* System config */}
        <Section title="system config">
          <div className="flex flex-col rounded-md overflow-hidden border border-border divide-y divide-border">
            {[
              { k: 'DATABASE_URL', v: 'sqlite:///./gitspan.db' },
              { k: 'SYNC_INTERVAL', v: '5m' },
              { k: 'MAX_RETRIES', v: '3' },
              { k: 'DEPLOYMENT', v: 'self-hosted · docker compose' },
            ].map(({ k, v }) => (
              <div key={k} className="flex items-center gap-4 bg-card px-4 py-2.5">
                <span className="font-mono text-[12px] text-muted-foreground w-48 shrink-0">{k}</span>
                <span className="font-mono text-[12px] text-card-foreground">{v}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </Shell>
  )
}
