/** @type {import('next').NextConfig} */
const nextConfig = {
  // Essential for Vercel deployment
  output: 'standalone',
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Disable turbopack for production builds
  experimental: {
    turbo: undefined,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Optimize dependencies
  transpilePackages: ['lucide-react', 'framer-motion'],
}

module.exports = nextConfig
