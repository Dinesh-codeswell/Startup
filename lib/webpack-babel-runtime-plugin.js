/**
 * Custom webpack plugin to completely remove babel runtime from the build
 * This prevents Edge Runtime issues by replacing problematic modules
 */

class BabelRuntimeRemovalPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('BabelRuntimeRemovalPlugin', (factory) => {
      factory.hooks.beforeResolve.tap('BabelRuntimeRemovalPlugin', (resolveData) => {
        if (!resolveData) return;
        
        const request = resolveData.request;
        
        // Replace problematic babel runtime modules
        if (
          request === '@babel/runtime/regenerator' ||
          request === '@babel/runtime/helpers/asyncToGenerator' ||
          request === 'regenerator-runtime' ||
          request.includes('@babel/runtime/regenerator') ||
          request.includes('@babel/runtime/helpers')
        ) {
          resolveData.request = require.resolve('../lib/empty-module.js');
        }
      });
    });
    
    // Also handle module resolution
    compiler.hooks.compilation.tap('BabelRuntimeRemovalPlugin', (compilation) => {
      compilation.hooks.buildModule.tap('BabelRuntimeRemovalPlugin', (module) => {
        if (module.resource && (
          module.resource.includes('@babel/runtime/regenerator') ||
          module.resource.includes('@babel/runtime/helpers')
        )) {
          // Replace the module content with empty export
          module._source = {
            source: () => 'module.exports = {};',
            size: () => 18
          };
        }
      });
    });
  }
}

module.exports = BabelRuntimeRemovalPlugin;