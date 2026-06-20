// ─── Forge Registry ──────────────────────────────────────────────────────────
// To add a new forge, add an entry here. Everything in the UI derives from this.

export type ForgeType = string // open string, not a closed union

export interface ForgeDefinition {
  id: ForgeType
  label: string
  color: string       // tailwind-compatible hex for accents
  supportsOAuth: boolean
  supportsPAT: boolean
  oauthLabel?: string // e.g. "Sign in with GitHub"
  patHelpUrl?: string
  baseUrlRequired?: boolean // e.g. self-hosted Forgejo/Gitea needs a URL
}

export const FORGE_REGISTRY: Record<string, ForgeDefinition> = {
  github: {
    id: 'github',
    label: 'GitHub',
    color: '#e6edf3',
    supportsOAuth: true,
    supportsPAT: true,
    oauthLabel: 'Sign in with GitHub',
    patHelpUrl: 'https://github.com/settings/tokens',
  },
  gitlab: {
    id: 'gitlab',
    label: 'GitLab',
    color: '#fc6d26',
    supportsOAuth: true,
    supportsPAT: true,
    oauthLabel: 'Sign in with GitLab',
    patHelpUrl: 'https://gitlab.com/-/profile/personal_access_tokens',
  },
  codeberg: {
    id: 'codeberg',
    label: 'Codeberg',
    color: '#2185d0',
    supportsOAuth: false,
    supportsPAT: true,
    patHelpUrl: 'https://codeberg.org/user/settings/applications',
  },
  forgejo: {
    id: 'forgejo',
    label: 'Forgejo',
    color: '#fb923c',
    supportsOAuth: false,
    supportsPAT: true,
    baseUrlRequired: true,
    patHelpUrl: 'https://forgejo.org/docs/latest/user/token/',
  },
  gitgay: {
    id: 'gitgay',
    label: 'Git.Gay',
    color: '#e879f9',
    supportsOAuth: false,
    supportsPAT: true,
    patHelpUrl: 'https://git.gay/user/settings/applications',
  },
  sourcehut: {
    id: 'sourcehut',
    label: 'SourceHut',
    color: '#3b82f6',
    supportsOAuth: false,
    supportsPAT: true,
    patHelpUrl: 'https://meta.sr.ht/oauth2',
  },
}

export const FORGE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(FORGE_REGISTRY).map(([k, v]) => [k, v.label])
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = 'synced' | 'pending' | 'error'
export type UserRole = 'admin' | 'user'
export type Plan = 'free' | 'pro' | 'self-hosted'

export interface Repo {
  id: string
  name: string
  fullName: string
  sourceForge: ForgeType
  targetForges: ForgeType[]
  lastSyncedAt: string | null
  status: SyncStatus
  errorMessage?: string
  totalSyncs: number
}

export interface ForgeAccount {
  id: string
  type: ForgeType
  displayName: string
  username: string
  authMethod: 'oauth' | 'pat'
  repoCount: number
  connectedAt: string
}

export interface SyncEvent {
  date: string   // YYYY-MM-DD
  synced: number
  errors: number
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  plan: Plan
  avatarUrl: string | null
  createdAt: string
  repoCount: number
  forgeCount: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_CURRENT_USER: User = {
  id: 'u1',
  name: 'Groot',
  email: 'groot@example.com',
  role: 'admin',
  plan: 'self-hosted',
  avatarUrl: null,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  repoCount: 8,
  forgeCount: 3,
}

export const MOCK_FORGE_ACCOUNTS: ForgeAccount[] = [
  {
    id: '1', type: 'github', displayName: 'GitHub', username: 'groot',
    authMethod: 'oauth', repoCount: 42, connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: '2', type: 'gitlab', displayName: 'GitLab', username: 'groot',
    authMethod: 'pat', repoCount: 17, connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: '3', type: 'codeberg', displayName: 'Codeberg', username: 'groot',
    authMethod: 'pat', repoCount: 8, connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
]

export const MOCK_REPOS: Repo[] = [
  {
    id: '1', name: 'gitspan', fullName: 'groot/gitspan',
    sourceForge: 'github', targetForges: ['gitlab', 'codeberg'],
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    status: 'synced', totalSyncs: 148,
  },
  {
    id: '2', name: 'dotfiles', fullName: 'groot/dotfiles',
    sourceForge: 'github', targetForges: ['codeberg'],
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'synced', totalSyncs: 83,
  },
  {
    id: '3', name: 'personal-site', fullName: 'groot/personal-site',
    sourceForge: 'gitlab', targetForges: ['github', 'codeberg'],
    lastSyncedAt: null,
    status: 'pending', totalSyncs: 0,
  },
  {
    id: '4', name: 'nvim-config', fullName: 'groot/nvim-config',
    sourceForge: 'codeberg', targetForges: ['github'],
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: 'error', totalSyncs: 29,
    errorMessage: 'SSH key rejected by remote: permission denied (publickey)',
  },
  {
    id: '5', name: 'scripts', fullName: 'groot/scripts',
    sourceForge: 'github', targetForges: ['gitlab'],
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'synced', totalSyncs: 204,
  },
  {
    id: '6', name: 'homelab', fullName: 'groot/homelab',
    sourceForge: 'forgejo', targetForges: ['github', 'gitlab'],
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'pending', totalSyncs: 12,
  },
  {
    id: '7', name: 'notes', fullName: 'groot/notes',
    sourceForge: 'gitgay', targetForges: ['codeberg'],
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'synced', totalSyncs: 67,
  },
  {
    id: '8', name: 'advent-of-code', fullName: 'groot/advent-of-code',
    sourceForge: 'github', targetForges: ['gitlab', 'codeberg', 'gitgay'],
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'error', totalSyncs: 55,
    errorMessage: 'Remote repository not found: codeberg/groot/advent-of-code',
  },
]

// Fake 14-day sync activity — deterministic so SSR and client match
const ACTIVITY_SEED = [
  [18, 1], [24, 0], [11, 2], [29, 0], [7, 3], [22, 1], [15, 0],
  [31, 2], [9, 0], [26, 1], [14, 2], [20, 0], [17, 1], [23, 0],
]
export const MOCK_SYNC_ACTIVITY: SyncEvent[] = ACTIVITY_SEED.map(([synced, errors], i) => {
  const d = new Date('2026-06-20')
  d.setDate(d.getDate() - (13 - i))
  return { date: d.toISOString().slice(0, 10), synced, errors }
})

// Admin: mock all users
export const MOCK_ADMIN_USERS: User[] = [
  MOCK_CURRENT_USER,
  {
    id: 'u2', name: 'Alice Dev', email: 'alice@example.com', role: 'user',
    plan: 'pro', avatarUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    repoCount: 34, forgeCount: 4,
  },
  {
    id: 'u3', name: 'Bob Hacker', email: 'bob@example.com', role: 'user',
    plan: 'free', avatarUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    repoCount: 5, forgeCount: 2,
  },
  {
    id: 'u4', name: 'Carol Ops', email: 'carol@example.com', role: 'user',
    plan: 'pro', avatarUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    repoCount: 21, forgeCount: 3,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getStats() {
  const synced = MOCK_REPOS.filter((r) => r.status === 'synced').length
  const errors = MOCK_REPOS.filter((r) => r.status === 'error').length
  const pending = MOCK_REPOS.filter((r) => r.status === 'pending').length
  const totalSyncsToday = MOCK_SYNC_ACTIVITY[MOCK_SYNC_ACTIVITY.length - 1]?.synced ?? 0
  return {
    totalRepos: MOCK_REPOS.length,
    connectedForges: MOCK_FORGE_ACCOUNTS.length,
    syncErrors: errors,
    synced,
    pending,
    totalSyncsToday,
  }
}

export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'never'
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
