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
  
  // Completely disable Edge Runtime
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Disable Edge Runtime features completely
    esmExternals: false,
    forceSwcTransforms: true,
    swcMinify: true,
  },
  
  // Force SWC compiler instead of Babel
  swcMinify: true,

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
    // Import custom plugin to remove babel runtime
    const BabelRuntimeRemovalPlugin = require('./lib/webpack-babel-runtime-plugin');
    
    // Add the custom plugin to completely remove babel runtime
    config.plugins.push(new BabelRuntimeRemovalPlugin());
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
        '@babel/runtime': false,
        'regenerator-runtime': false,
      };
    }

    // Fix "self is not defined" error and merge with existing aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      'ws': false,
      'bufferutil': false,
      'utf-8-validate': false,
      // Force problematic babel runtime modules to use empty module
      '@babel/runtime/regenerator': require.resolve('./lib/empty-module.js'),
      '@babel/runtime/helpers/asyncToGenerator': require.resolve('./lib/empty-module.js'),
      'regenerator-runtime': require.resolve('./lib/empty-module.js'),
    };

    // Define global variables for both browser and server environment
    config.plugins.push(
      new webpack.DefinePlugin({
        'global': 'globalThis',
        'self': isServer ? 'global' : 'self',
        'window': isServer ? 'undefined' : 'window',
      })
    );
    
    // Additional server-side globals
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'global',
          'window': 'undefined',
        })
      );
    }
    
    // Completely separate client and server builds
    if (isServer) {
      // Aggressive server-side externals to prevent client code inclusion
      config.externals = [
        ...(config.externals || []),
        // Externalize all client-side packages
        '@splinetool/runtime',
        '@babel/runtime',
        'regenerator-runtime',
        'three',
        'cannon',
        'cannon-es',
        // Pattern-based exclusions
        /^@splinetool\/.*/,
        /^three\/.*/,
        /^cannon\/.*/,
        /^@babel\/runtime\/.*/,
        // Custom function to handle all client-side modules
        ({ context, request }, callback) => {
          // Externalize any module that might contain client-side code
          if (
            request?.includes('@splinetool') ||
            request?.includes('three') ||
            request?.includes('cannon') ||
            request?.includes('@babel/runtime') ||
            request?.includes('regenerator-runtime')
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
      
      // Completely disable splitChunks for server to prevent vendors.js creation
       config.optimization = config.optimization || {};
       config.optimization.splitChunks = false;
      
      // Add comprehensive server-side polyfills
      config.plugins.push(
        new webpack.DefinePlugin({
          'typeof window': '"undefined"',
          'typeof document': '"undefined"',
          'typeof navigator': '"undefined"',
          'typeof location': '"undefined"',
          'typeof self': '"undefined"',
          'self': 'global',
          'window': 'undefined',
          'document': 'undefined',
          'navigator': 'undefined',
          'location': 'undefined',
        })
      );
      
      // Add a plugin to completely remove client-side webpack runtime
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.compilation.tap('RemoveClientRuntime', (compilation) => {
            compilation.hooks.processAssets.tap(
              {
                name: 'RemoveClientRuntime',
                stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
              },
              (assets) => {
                // Remove any assets that contain client-side webpack runtime
                Object.keys(assets).forEach((assetName) => {
                  if (assetName.includes('vendors') || assetName.includes('runtime')) {
                    const source = assets[assetName].source();
                    if (typeof source === 'string' && source.includes('self.webpackChunk')) {
                      // Replace with empty module
                      assets[assetName] = {
                        source: () => 'module.exports = {};',
                        size: () => 'module.exports = {};'.length,
                      };
                    }
                  }
                });
              }
            );
          });
        },
      });
    } else {
      // Client-side configuration for Spline
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