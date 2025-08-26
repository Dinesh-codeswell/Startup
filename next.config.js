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
  
  // Webpack configuration to fix module resolution
  webpack: (config, { isServer }) => {
    // Fix webpack module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Ignore build errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;