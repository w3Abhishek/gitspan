'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

const NAV = [
  { href: '/dashboard', label: 'dashboard' },
  { href: '/repos', label: 'repos' },
  { href: '/forges', label: 'forges' },
  { href: '/sync-logs', label: 'sync logs' },
  { href: '/settings', label: 'settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 rounded text-sm font-mono transition-colors',
          active ? 'text-sidebar-foreground' : 'text-muted-foreground hover:text-sidebar-foreground'
        )}
      >
        <span className={cn('w-3 shrink-0 text-[10px] select-none', active ? 'text-sidebar-primary' : 'text-transparent')}>
          ▸
        </span>
        {label}
      </Link>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-52 flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border">
        <span className="font-mono text-sm font-semibold text-sidebar-foreground tracking-tight">
          <span className="text-muted-foreground mr-1 select-none">&gt;_</span>
          git<span className="text-sidebar-primary">span</span>
        </span>
      </div>
      <nav className="flex-1 py-2 px-2 flex flex-col gap-px overflow-y-auto">
        {NAV.map((item) => <NavLink key={item.href} href={item.href} label={item.label} />)}
        {user?.role === 'admin' && (
          <>
            <div className="mx-3 my-2 border-t border-sidebar-border" />
            <p className="px-3 pb-1 text-[10px] font-mono text-muted-foreground uppercase tracking-widest select-none">admin</p>
            <NavLink href="/admin" label="admin panel" />
          </>
        )}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        {user ? (
          <div className="flex flex-col gap-1">
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded transition-colors',
                pathname === '/profile'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
              )}
            >
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[11px] font-mono font-bold text-secondary-foreground shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[12px] text-sidebar-foreground truncate">{user.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground truncate">{user.plan}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-1 font-mono text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              sign out
            </button>
          </div>
        ) : (
          <Link href="/login" className="block px-3 py-2 font-mono text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            sign in
          </Link>
        )}
      </div>
    </aside>
  )
}
