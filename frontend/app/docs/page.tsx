import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <header className="border-b border-border/40 bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center max-w-4xl">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[12px] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="ml-auto font-semibold tracking-tight text-sm">
            <span className="text-muted-foreground mr-1 select-none">&gt;_</span>
            git<span className="text-primary">span</span> docs
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 tracking-tight">Self-Hosting & Deployment Guide</h1>
        
        <div className="space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2">1. Production Docker Execution</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              GitSpan was designed natively to be hosted seamlessly on any Linux VPS (Ubuntu/Debian) or Windows Server instance using a unified Docker-Compose architecture. The Compose structure automatically provisions your SQLite database mapping alongside both internal Docker Networks required to sync the backend API daemon securely.
            </p>
            
            <h3 className="font-semibold text-sm mt-6">Starting on Linux/Ubuntu Server:</h3>
            <div className="bg-black/50 p-4 rounded-md border border-border/50 space-y-2">
              <code className="text-[12px] text-green-400 font-mono block">
                git clone https://github.com/your-username/gitspan.git
              </code>
              <code className="text-[12px] text-green-400 font-mono block">
                cd gitspan
              </code>
              <code className="text-[12px] text-green-400 font-mono block">
                ./start.sh
              </code>
            </div>

            <p className="text-[12px] text-muted-foreground mt-4">
              Alternatively, on Windows Servers or standard shells without bash extensions, just execute:
            </p>
            <div className="bg-black/50 p-3 rounded-md border border-border/50">
              <code className="text-[12px] text-blue-300 font-mono">
                docker-compose up -d --build
              </code>
            </div>
            
            <p className="text-[13px] mt-4 p-4 border-l-2 border-primary bg-primary/5 text-muted-foreground rounded-r">
              The internal frontend service automatically bridges port `3000` to handle internet UI traffic, and the backend bridges internal Python processing via port `8000`. You do not need Node.js or Python installed bare-metal.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2">2. Reverse Proxy & Domain Mapping (NGINX/Caddy)</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              To host Gitspan effectively on a stable domain name (like `https://sync.mycompany.com`) and secure Webhook connections traversing standard SSL ports via standard networking interfaces, you must configure a reverse proxy. 
            </p>
            
            <h3 className="font-semibold text-[13px] mt-6">Example NGINX Site Configuration (Ubuntu):</h3>
            <div className="bg-muted p-4 rounded-md border border-border text-[11px] font-mono overflow-x-auto text-muted-foreground whitespace-pre">
{`server {
    listen 80;
    server_name sync.mycompany.com;

    # Redirect all HTTP requests to internal Docker port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}
            </div>
            <p className="text-[12px] text-muted-foreground mt-3">
              After pointing your DNS A-Record to this IP, execute <code className="bg-muted px-1 py-0.5 rounded">certbot --nginx -d sync.mycompany.com</code> to automatically lock and secure the domain using Let's Encrypt!
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2">3. Config & Webhook Routing</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              When operating securely in a public Internet-hosted production state, your backend Webhook URLs must strictly route back against your active domain name, rather than resolving down arbitrary networks.
            </p>

            <div className="bg-card border border-border p-4 rounded-md">
              <h3 className="font-semibold text-[13px] mb-3">Updating the Environment Settings:</h3>
              <p className="text-[12px] text-muted-foreground break-all mb-3">
                In your primary <code className="text-foreground">.env</code> variables mapping to the backend Docker image, explicitly define your stable proxy address natively so Git APIs can connect dynamically from outside to trace commits.
              </p>
              <code className="text-[11px] text-primary/80 font-mono block">
                BACKEND_URL=https://sync.mycompany.com
              </code>
            </div>
          </section>


          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-border pb-2">4. OAuth Key Configuration</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              In order for GitSpan to connect effectively to cloud providers, you must register the application within your target ecosystem's Developer Settings to obtain Client IDs and Secrets. 
            </p>
            <div className="bg-card border border-border p-4 rounded-md">
              <h3 className="font-semibold text-sm mb-3">GitHub Setup:</h3>
              <ol className="list-decimal pl-5 text-[12px] text-muted-foreground space-y-1">
                <li>Go to GitHub Settings &gt; Developer settings &gt; OAuth Apps.</li>
                <li>Set "Authorization callback URL" to: <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">https://sync.mycompany.com/api/auth/callback/github</code></li>
              </ol>
            </div>
            <div className="bg-card border border-border p-4 rounded-md">
              <h3 className="font-semibold text-sm mb-3">GitLab Setup:</h3>
              <ol className="list-decimal pl-5 text-[12px] text-muted-foreground space-y-1">
                <li>Go to GitLab User Settings &gt; Applications.</li>
                <li>Set "Redirect URI" to: <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">https://sync.mycompany.com/api/auth/callback/gitlab</code></li>
                <li>Checked defined Scopes: <code className="text-foreground">read_user</code>, <code className="text-foreground">read_api</code>, <code className="text-foreground">write_repository</code>.</li>
              </ol>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
