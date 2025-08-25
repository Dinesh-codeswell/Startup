/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 1,
    // Enable server components optimization
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    unoptimized: true
  },
  // Ignore build errors from backend directory
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration
  webpack: (config, { isServer, webpack }) => {
    // Ignore backend files during frontend build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Fix Supabase WebSocket factory warnings
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Suppress specific warnings for Supabase realtime
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      // Supabase realtime WebSocket warnings
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /websocket-factory\.js/,
        message: /Critical dependency/,
      },
      // General dynamic import warnings for WebSocket libraries
      {
        message: /Critical dependency: the request of a dependency is an expression/,
        module: /realtime-js/,
      },
    ];

    // Handle WebSocket and other Node.js specific modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'ws': false,
      'bufferutil': false,
      'utf-8-validate': false,
    };

    // Add plugin to ignore specific warnings
    config.plugins.push(
      new webpack.ContextReplacementPlugin(
        /\/node_modules\/@supabase\/realtime-js/,
        (data) => {
          delete data.dependencies[0].critical;
          return data;
        }
      )
    );
    
    // Exclude backend and Frontend directories from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend/**', '**/Frontend/**', '**/node_modules/**']
    };
    
    return config;
  },
};

module.exports = nextConfig;
