/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Optimize images with better settings
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // Cache for 1 hour
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    loader: 'default',
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.licdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Enable compression
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  // Optimize output and force Node.js runtime
  output: 'standalone',
  // Disable Edge Runtime completely
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Disable Edge Runtime features
    esmExternals: false,
    forceSwcTransforms: true,
    swcMinify: true,
  },
  
  // Force SWC compiler instead of Babel
  swcMinify: true,
  
  // Force server target to avoid Edge Runtime
  target: 'server',

  // Enable static optimization
  trailingSlash: false,
  // Optimize page loading
  poweredByHeader: false,
  // Ensure proper static file serving
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Ignore build errors from backend directory
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration
  webpack: (config, { isServer, webpack }) => {
    // Handle client-side fallbacks - Enhanced for Spline compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        '@babel/runtime/regenerator': false,
      };
    }

    // Fix "self is not defined" error
    config.resolve.alias = {
      ...config.resolve.alias,
      'ws': false,
      'bufferutil': false,
      'utf-8-validate': false,
    };

    // Define global variables for browser environment
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'global': 'globalThis',
        })
      );
    }
    
    // Handle @splinetool/runtime specifically to avoid Edge Runtime issues
    // Exclude from server-side processing to prevent Dynamic Code Evaluation errors
    if (!isServer) {
      config.module.rules.push({
        test: /node_modules\/@splinetool\/runtime/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['next/babel'],
            plugins: [],
          },
        },
      });
    } else {
       // Exclude problematic packages from server-side bundle
       config.externals = config.externals || [];
       if (Array.isArray(config.externals)) {
         config.externals.push(
           '@splinetool/runtime', 
           '@babel/runtime/regenerator',
           '@babel/runtime',
           'regenerator-runtime'
         );
       } else if (typeof config.externals === 'function') {
         const originalExternals = config.externals;
         config.externals = (context, request, callback) => {
           if ([
             '@splinetool/runtime',
             '@babel/runtime/regenerator', 
             '@babel/runtime',
             'regenerator-runtime'
           ].includes(request)) {
             return callback(null, 'commonjs ' + request);
           }
           return originalExternals(context, request, callback);
         };
       }
     }
    
    // Fix module loading issues and webpack runtime errors
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Force SWC compilation
        config.resolve.fallback = {
          ...config.resolve.fallback,
          'regenerator-runtime': false,
        };

    // Fix webpack runtime module loading error
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          plugins: [],
        },
      },
    });

    // Suppress specific warnings for Supabase realtime, Edge Runtime, and Spline
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
      // Edge Runtime warnings
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /A Node\.js API is used \(process\.versions at line: \d+\) which is not supported in the Edge Runtime/,
      },
      {
        module: /node_modules\/@supabase\/supabase-js/,
        message: /A Node\.js API is used \(process\.version at line: \d+\) which is not supported in the Edge Runtime/,
      },
      // Spline runtime warnings
      {
        module: /node_modules\/@splinetool\/runtime/,
        message: /Dynamic Code Evaluation/,
      },
      {
        module: /node_modules\/@splinetool\/runtime/,
        message: /eval.*not allowed in Edge Runtime/,
      },
      // General dynamic import warnings for WebSocket libraries
      {
        message: /Critical dependency: the request of a dependency is an expression/,
        module: /realtime-js/,
      },
    ];

    // Add plugin to ignore specific warnings (with error handling)
    try {
      config.plugins.push(
        new webpack.ContextReplacementPlugin(
          /\/node_modules\/@supabase\/realtime-js/,
          (data) => {
            if (data.dependencies && data.dependencies[0]) {
              delete data.dependencies[0].critical;
            }
            return data;
          }
        )
      );
    } catch (error) {
      console.warn('Failed to add ContextReplacementPlugin:', error);
    }
    
    // Exclude backend and Frontend directories from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend/**', '**/Frontend/**', '**/node_modules/**']
    };

    // Fix bundle splitting to prevent runtime errors
    if (config.optimization && config.optimization.splitChunks) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }

    // Add performance optimizations
    if (!isServer) {
      const path = require('path');
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;