'use client'

import { useState, useEffect } from 'react'
import { Shell } from '@/components/layout/shell'
import { FORGE_REGISTRY, FORGE_LABELS } from '@/lib/mock-data'
import { forges as forgesApi, type ForgeAccount } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const METHOD_BADGE: Record<string, string> = {
  oauth: 'bg-primary/20 text-primary',
  pat: 'bg-secondary text-secondary-foreground',
}

function ForgeRow({ account, onDelete, onSync }: { account: ForgeAccount; onDelete: (id: string) => void; onSync: (id: string) => void }) {
  const [syncing, setSyncing] = useState(false)
  const def = FORGE_REGISTRY[account.type]

  async function handleSync() {
    setSyncing(true)
    await onSync(account.id)
    setSyncing(false)
  }

  return (
    <div className="flex items-center gap-4 bg-card px-4 py-3">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: def?.color ?? '#666' }} />
      <span className="font-mono text-[13px] font-medium text-card-foreground w-28 shrink-0">
        {FORGE_LABELS[account.type] ?? account.type}
      </span>
      <span className="font-mono text-[12px] text-muted-foreground w-32 shrink-0">@{account.username}</span>
      <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0', METHOD_BADGE[account.auth_method])}>
        {account.auth_method}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground hidden md:block">{account.repo_count} repos</span>
      
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="font-mono text-[11px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {syncing ? 'syncing...' : 'sync repos'}
        </button>
        <span className="font-mono text-[11px] text-green-400">connected</span>
        <button
          onClick={() => onDelete(account.id)}
          className="font-mono text-[11px] text-muted-foreground hover:text-destructive transition-colors"
        >
          remove
        </button>
      </div>
    </div>
  )
}

function AddForgeModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (a: ForgeAccount) => void }) {
  const [selectedForge, setSelectedForge] = useState<string | null>(null)
  const [authTab, setAuthTab] = useState<'oauth' | 'pat'>('oauth')
  const [baseUrl, setBaseUrl] = useState('')
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const def = selectedForge ? FORGE_REGISTRY[selectedForge] : null
  const allForges = Object.values(FORGE_REGISTRY)

  function reset() {
    setSelectedForge(null)
    setBaseUrl('')
    setToken('')
    setUsername('')
    setError('')
  }

  async function connectPAT() {
    if (!def || !token || !username) return
    setLoading(true)
    setError('')
    try {
      const account = await forgesApi.add({
        type: def.id,
        display_name: def.label,
        username,
        access_token: token,
        base_url: def.baseUrlRequired ? baseUrl : undefined,
        auth_method: 'pat',
      })
      onAdded(account)
      reset()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">Add forge account</DialogTitle>
          <DialogDescription className="text-muted-foreground text-[12px]">
            Connect a git forge to start mirroring repos from or to it.
          </DialogDescription>
        </DialogHeader>

        {!selectedForge ? (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {allForges.map((forge) => (
              <button
                key={forge.id}
                onClick={() => { setSelectedForge(forge.id); setAuthTab(forge.supportsOAuth ? 'oauth' : 'pat') }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-background hover:border-primary/60 hover:bg-muted/30 transition-colors text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: forge.color }} />
                <span className="font-mono text-[13px] text-card-foreground">{forge.label}</span>
                {forge.baseUrlRequired && <span className="ml-auto text-[10px] text-muted-foreground font-mono">self-hosted</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <button onClick={reset} className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">← back</button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: def?.color }} />
              <span className="font-mono text-sm font-medium text-card-foreground">{def?.label}</span>
            </div>
            <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'oauth' | 'pat')}>
              <TabsList className="bg-muted h-8 p-0.5">
                {def?.supportsOAuth && <TabsTrigger value="oauth" className="text-[12px] font-mono h-7 px-3">OAuth</TabsTrigger>}
                {def?.supportsPAT && <TabsTrigger value="pat" className="text-[12px] font-mono h-7 px-3">PAT</TabsTrigger>}
              </TabsList>
              {def?.supportsOAuth && (
                <TabsContent value="oauth" className="mt-4 space-y-3">
                  <p className="text-[12px] text-muted-foreground font-mono">
                    You'll be redirected to {def.label} to authorize GitSpan.
                  </p>
                  <Button 
                    onClick={() => {
                      if (def.id === 'github') {
                        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
                        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`
                      } else if (def.id === 'gitlab') {
                        const clientId = process.env.NEXT_PUBLIC_GITLAB_CLIENT_ID
                        const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/gitlab`)
                        window.location.href = `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=read_api+read_user+write_repository`
                      }
                    }}
                    className="w-full font-mono text-[13px]"
                  >
                    Connect with {def.label}
                  </Button>
                </TabsContent>
              )}
              {def?.supportsPAT && (
                <TabsContent value="pat" className="mt-4 space-y-4">
                  {def.baseUrlRequired && (
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[12px] text-muted-foreground">Instance URL</Label>
                      <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://git.example.com" className="font-mono text-[13px] h-9 bg-background" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[12px] text-muted-foreground">Personal Access Token</Label>
                    <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="paste your token" className="font-mono text-[13px] h-9 bg-background" />
                    {def.patHelpUrl && (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Generate at{' '}
                        <a href={def.patHelpUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                          {def.label} settings
                        </a>
                        . Needs <code className="bg-muted px-1 rounded">repo</code> scope.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[12px] text-muted-foreground">Username</Label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your username" className="font-mono text-[13px] h-9 bg-background" />
                  </div>
                  {error && <p className="font-mono text-[12px] text-destructive">{error}</p>}
                  <Button onClick={connectPAT} disabled={loading || !token || !username} className="w-full font-mono text-[13px]">
                    {loading ? 'connecting...' : 'Connect'}
                  </Button>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function ForgesPage() {
  const [accounts, setAccounts] = useState<ForgeAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  function fetchAccounts() {
    forgesApi.list().then(setAccounts).catch(console.error).finally(() => setLoading(false))
  }

  async function handleDelete(id: string) {
    await forgesApi.delete(id).catch(console.error)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleSyncRepos(id: string) {
    try {
      await forgesApi.syncRepos(id)
      fetchAccounts() // Refresh list to get updated repo count
    } catch (e) {
      console.error("Manual repo sync failed:", e)
    }
  }

  return (
    <Shell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">connected forges</p>
          <Button size="sm" className="font-mono text-[12px] h-8 px-3" onClick={() => setModalOpen(true)}>+ add forge</Button>
        </div>

        {loading ? (
          <p className="font-mono text-[12px] text-muted-foreground py-8 text-center">loading...</p>
        ) : accounts.length === 0 ? (
          <p className="font-mono text-[12px] text-muted-foreground py-8 text-center">no forges connected - add one to start syncing</p>
        ) : (
          <div className="flex flex-col rounded-md overflow-hidden border border-border divide-y divide-border">
            {accounts.map((account) => <ForgeRow key={account.id} account={account} onDelete={handleDelete} onSync={handleSyncRepos} />)}
          </div>
        )}

        <div className="border border-border rounded-lg p-4 space-y-3">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">available forges</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.values(FORGE_REGISTRY).map((forge) => {
              const connected = accounts.some((a) => a.type === forge.id)
              return (
                <div key={forge.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: forge.color }} />
                  <span className="font-mono text-[12px] text-card-foreground flex-1">{forge.label}</span>
                  <span className={cn('text-[10px] font-mono', connected ? 'text-green-400' : 'text-muted-foreground')}>
                    {connected ? 'connected' : forge.supportsOAuth ? 'oauth / pat' : 'pat'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <AddForgeModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={(a) => { setAccounts((prev) => [...prev, a]); fetchAccounts() }} />
    </Shell>
  )
}
