/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration only
  reactStrictMode: true,
  swcMinify: true,
  
  // Image configuration
  images: {
    unoptimized: true,
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Ignore build errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;