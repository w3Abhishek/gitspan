<div align="center">
  <img src="frontend/app/icon.svg" alt="GitSpan Logo" width="120" />
  <h1>GitSpan</h1>
  <p><b>Bridge your code across every Git ecosystem securely.</b></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Made with FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![Built with Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
</div>

<br>

GitSpan is a lightweight, self-hosted orchestration engine that automatically mirrors and synchronizes repositories across GitHub, GitLab, Bitbucket, and private self-hosted instances using Webhooks and OAuth.

It solves the problem of cross-platform repository fragmentation by allowing you to instantly bridge repos together. When a commit is pushed to your source repository (e.g., GitHub), GitSpan intercepts the webhook and seamlessly executes a background `git mirror` pipeline down to your target destinations (e.g., GitLab or Forgejo) within seconds.

---

## ⚡ Key Features

- **Real-Time Cross-Platform Synchronization**: Instant repository mirroring directly triggered via HTTP Webhooks on every code push.
- **Universal Remote Compatibility**: Natively supports syncing repositories between GitHub, GitLab, and any instance authorizing standard Personal Access Tokens (PATs).
- **Secure OAuth Integrity**: End-to-end OAuth integration maps cloud platforms securely. API keys and PATs never leave your local infrastructure or touch browser extensions.
- **Robust Zero-Downtime Polling**: Built-in background daemon utilizes cron-based thread pooling to continuously guarantee code alignment, even if Webhooks are dropped.
- **Automated Container Provisioning**: Don't have the target repository configured on your destination platform yet? GitSpan dynamically provisions empty repository containers via remote APIs before initiating clones.

---

## 🚀 Quick Setup (Development)

Gitspan utilizes a heavily decoupled microservices logic architecture. We've packaged 1-click boot binaries for rapid local testing!

**Prerequisites:** Requires Python 3.11+ and Node.js v20+.

```bash
# Clone the repository
git clone https://github.com/w3Abhishek/gitspan.git
cd gitspan
```

**Starting the project (Windows):**
Execute the native `.bat` file to automatically provision your Python virtual environment, install databases, hydrate NPM dependencies, and open tandem terminal windows:
```cmd
.\start.bat
```

> The Web UI will be automatically available at `http://localhost:3000`.

---

## 🐳 Production Deployment (Docker Compose)

Gitspan was engineered to be deployed globally on bare-metal servers using unified Docker architecture. The `docker-compose.yml` natively configures an optimized Python ASGI backend layer, a standalone Next.js container, and a persistent local PostgreSQL database cluster.

```bash
# Boot the fully localized production container structure
./start.sh 

# Or invoke docker natively:
docker-compose up -d --build
```
*Note: We highly recommend configuring a proxy layer (NGINX/Caddy) to handle secure SSL terminations. Comprehensive deployment strategies are available in the [Official Docs](https://gitspan.vrma.dev/).*

---

## 🔑 Configure Environment Mapping

Because Gitspan securely intercepts traffic from cloud platforms like GitHub and GitLab dynamically, you must create an internal mapping file.

1. Copy `.env.example` to `.env` in ***both*** your root `frontend/` and `backend/` directories.
2. Inside your Cloud Developer Settings Panel (e.g GitHub Apps), create a new Application referencing your GitSpan domain (e.g., `https://sync.yourdomain.com/api/auth/callback/github`).
3. Place the exact resulting **Client ID** and **Client Secrets** within the respective `.env` files.

---

## 📝 License

This project is entirely open-source and officially licensed under the **[MIT License](LICENSE)**. 

Copyright (c) 2026 Abhishek (w3Abhishek)