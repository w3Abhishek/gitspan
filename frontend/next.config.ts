import type { NextConfig } from "next";

const isGithubPages = process.env.BUILD_STATIC === 'true';

const nextConfig: NextConfig = {
  // Use 'export' for GitHub Pages, 'standalone' for Docker/Servers
  output: isGithubPages ? 'export' : 'standalone',
  
  // Set basePath to repository name for GitHub Pages
  basePath: isGithubPages ? '/gitspan' : '',
  
  // Disable image optimization for static exports
  images: {
    unoptimized: isGithubPages,
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
