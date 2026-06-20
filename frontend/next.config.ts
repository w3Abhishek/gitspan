import type { NextConfig } from "next";

const isGithubPages = process.env.BUILD_STATIC === 'true';

const nextConfig: NextConfig = {
  // Use 'export' for GitHub Pages, 'standalone' for Docker/Servers
  output: isGithubPages ? 'export' : 'standalone',
  
  // Disable image optimization for static exports
  images: {
    unoptimized: isGithubPages,
  },
  
  // Explicitly ignore dynamic parameter routes that mock data during purely static site exports 
  // since they require an active node server to resolve DB items mapping to UUID IDs!
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    if (isGithubPages) {
       // Filter out any paths mapped implicitly as completely dynamic [id] string catches from Turbopack defaults.
       const filteredMap: any = {}
       for (const key in defaultPathMap) {
         if (!key.includes('[id]')) {
           filteredMap[key] = defaultPathMap[key]
         }
       }
       return filteredMap
    }
    return defaultPathMap
  },

  // Rewrites are only supported in full server environments, NOT static exports
  rewrites: isGithubPages ? undefined : async () => {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*", // Proxy to Backend
        },
      ]
    };
  },
};

export default nextConfig;
