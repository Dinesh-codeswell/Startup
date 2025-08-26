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
        
        // Replace ALL babel runtime modules including ESM variants
        if (
          request === '@babel/runtime/regenerator' ||
          request === '@babel/runtime/helpers/asyncToGenerator' ||
          request === '@babel/runtime/helpers/esm/defineProperty' ||
          request === '@babel/runtime/helpers/defineProperty' ||
          request === '@babel/runtime/helpers/esm/asyncToGenerator' ||
          request === '@babel/runtime/helpers/esm/regenerator' ||
          request === '@babel/runtime' ||
          request === 'regenerator-runtime' ||
          request.includes('@babel/runtime/regenerator') ||
          request.includes('@babel/runtime/helpers/esm/') ||
          request.includes('@babel/runtime/helpers/') ||
          request.includes('@babel/runtime') ||
          request.includes('defineProperty')
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
          module.resource.includes('@babel/runtime/helpers/esm/') ||
          module.resource.includes('@babel/runtime/helpers/') ||
          module.resource.includes('@babel/runtime') ||
          module.resource.includes('defineProperty') ||
          module.resource.includes('regenerator-runtime')
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