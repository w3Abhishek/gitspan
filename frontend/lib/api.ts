const API = process.env.NEXT_PUBLIC_API_URL || ""

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("gitspan_token") : null
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  access_token: string
  user_id: string
  name: string
  email: string
  role: string
  plan: string
}

export const auth = {
  register: (name: string, email: string, password: string) =>
    request<AuthUser>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  login: (email: string, password: string) =>
    request<AuthUser>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: () => request<AuthUser>("/api/auth/me"),
}

// ── Repos ─────────────────────────────────────────────────────────────────────

export interface Repo {
  id: string
  name: string
  full_name: string
  source_forge: string
  target_forges: string[]
  last_synced_at: string | null
  status: "synced" | "pending" | "error"
  error_message?: string | null
  total_syncs: number
}

export const repos = {
  list: () => request<Repo[]>("/api/repos"),
  get: (id: string) => request<Repo>(`/api/repos/${id}`),
  create: (body: { name: string; full_name: string; source_forge_id: string; target_forge_ids: string[] }) =>
    request<Repo>("/api/repos", { method: "POST", body: JSON.stringify(body) }),
  updateMappings: (id: string, target_forge_ids: string[]) =>
    request<Repo>(`/api/repos/${id}/mappings`, { method: "PUT", body: JSON.stringify({ target_forge_ids }) }),
  delete: (id: string) => request<void>(`/api/repos/${id}`, { method: "DELETE" }),
}

// ── Forges ────────────────────────────────────────────────────────────────────

export interface ForgeAccount {
  id: string
  type: string
  display_name: string
  username: string
  base_url?: string | null
  auth_method: string
  repo_count: number
  connected_at: string
}

export const forges = {
  list: () => request<ForgeAccount[]>("/api/forges"),
  add: (body: { type: string; display_name: string; username: string; access_token: string; base_url?: string; auth_method: string }) =>
    request<ForgeAccount>("/api/forges", { method: "POST", body: JSON.stringify(body) }),
  addOauth: (provider: string, code: string) => 
    request<ForgeAccount>(`/api/forges/oauth/${provider}`, { method: "POST", body: JSON.stringify({ code }) }),
  delete: (id: string) => request<void>(`/api/forges/${id}`, { method: "DELETE" }),
  syncRepos: (id: string) => request<{ status: string; added: number }>(`/api/forges/${id}/sync-repos`, { method: "POST" }),
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export interface SyncLog {
  id: string
  repo_id: string
  repo_name: string
  source_forge: string
  target_forge: string
  status: string
  error_message?: string | null
  started_at: string
  finished_at?: string | null
}

export interface SyncResult {
  repo_id: string
  status: string
  message: string
}

export const sync = {
  trigger: (repoId: string) => request<SyncResult>(`/api/sync/${repoId}`, { method: "POST" }),
  logs: () => request<SyncLog[]>("/api/sync-logs"),
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface Stats {
  total_repos: number
  connected_forges: number
  sync_errors: number
  synced: number
  pending: number
  total_syncs_today: number
}

export const statsApi = {
  get: () => request<Stats>("/api/stats"),
}
