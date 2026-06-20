import Link from 'next/link'
import { ArrowRight, GitBranch, Shield, Zap, Globe, RefreshCcw } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground select-none">&gt;_</span>
            <span className="font-semibold tracking-tight text-sm">git<span className="text-primary">span</span></span>
          </div>
          <nav className="flex items-center gap-6 text-[12px]">
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/login" className="bg-primary text-primary-foreground px-4 py-1.5 rounded hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 flex flex-col items-center text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
          
          <div className="inline-flex items-center border border-primary/30 bg-primary/5 text-primary text-[10px] px-3 py-1 rounded-full mb-8 uppercase tracking-widest">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Self-Hosted Sync Engine Active
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 max-w-3xl">
            Bridge your code across <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">every Git ecosystem.</span>
          </h1>
          
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mb-10 leading-relaxed">
            GitSpan is a lightweight, self-hosted orchestration engine that automatically mirrors repositories across GitHub, GitLab, Bitbucket, and self-hosted instances using Webhooks and OAuth.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/login" className="flex items-center gap-2 bg-primary text-primary-foreground h-10 px-6 rounded text-sm hover:opacity-90 transition-opacity">
              Launch Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/docs" className="flex items-center gap-2 border border-border bg-card h-10 px-6 rounded text-sm hover:bg-muted transition-colors">
              Read the Docs
            </Link>
          </div>
        </section>

        {/* Features Matrix */}
        <section className="w-full max-w-6xl px-4 py-20 border-t border-border/40 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<RefreshCcw className="w-5 h-5 text-primary" />}
            title="Real-time Synchronization"
            description="Automatic mirroring via HTTP Webhooks triggering immediately on every push."
          />
          <FeatureCard 
            icon={<Shield className="w-5 h-5 text-primary" />}
            title="Secure OAuth Integrity"
            description="Native OAuth exchanges ensure your credentials never leave your infrastructure."
          />
          <FeatureCard 
            icon={<Globe className="w-5 h-5 text-primary" />}
            title="Universal Compatibility"
            description="Sync seamlessly between GitHub, GitLab, Gitea or any platform accepting standard PATs."
          />
          <FeatureCard 
            icon={<GitBranch className="w-5 h-5 text-primary" />}
            title="Automated Provisioning"
            description="Select targets and Gitspan will autonomously configure empty repository containers on target architectures via API."
          />
          <FeatureCard 
            icon={<Zap className="w-5 h-5 text-primary" />}
            title="Zero-Downtime Polling"
            description="Background Cron-based daemons continuously secure your code integrity natively if Webhooks fail to reach localhost."
          />
        </section>
      </main>

      <footer className="border-t border-border/40 bg-muted/20 py-8 text-center text-xs text-muted-foreground">
        <p>Built with Next.js, FastAPI, and SQLite. Open Source under MIT.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col gap-3 p-6 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
      <div className="w-10 h-10 rounded border border-primary/20 bg-primary/5 flex items-center justify-center mb-2">
        {icon}
      </div>
      <h3 className="font-semibold text-[13px]">{title}</h3>
      <p className="text-muted-foreground text-[12px] leading-relaxed">
        {description}
      </p>
    </div>
  )
}
