'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { forges as forgesApi } from '@/lib/api'

function CallbackHandler({ provider }: { provider: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError(`No authorization code provided by ${provider}.`)
      return
    }

    forgesApi.addOauth(provider, code)
      .then(() => {
        router.push('/forges')
      })
      .catch((err) => {
        setError(err.message || 'Failed to complete OAuth exchange')
      })
  }, [searchParams, router, provider])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
      {error ? (
        <>
          <p className="font-mono text-destructive text-sm bg-destructive/10 px-4 py-2 rounded border border-destructive/20">
            {error}
          </p>
          <button 
            onClick={() => router.push('/forges')}
            className="text-[12px] font-mono text-muted-foreground hover:text-foreground underline transition-colors"
          >
            return to forges
          </button>
        </>
      ) : (
        <p className="font-mono text-sm text-muted-foreground animate-pulse">
          completing {provider} authorization...
        </p>
      )}
    </div>
  )
}

export function CallbackClient({ provider }: { provider: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex text-sm items-center justify-center font-mono">loading...</div>}>
      <CallbackHandler provider={provider} />
    </Suspense>
  )
}