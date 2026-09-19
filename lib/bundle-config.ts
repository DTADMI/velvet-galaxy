// =============================================================================
// Velvet Galaxy - Bundle Analysis Configuration
// Analyze bundle size with: pnpm build && npx vite-bundle-analyzer dist
// Or via next.config.mjs experimental.optimizePackageImports
// =============================================================================

/** @type {import('next').NextConfig} */
// Add to velvet-galaxy's next.config.mjs:

// Bundle analysis configuration
const bundleAnalysisConfig = {
  // Optimize package imports to reduce client bundle
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-avatar',
      '@radix-ui/react-slot',
      'lucide-react',
      'date-fns',
      'recharts',
    ],
    optimizeCss: true,
  },

  // Webpack bundle analyzer (uncomment to analyze)
  // webpack: (config, { isServer }) => {
  //   if (!isServer && process.env.ANALYZE === 'true') {
  //     const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  //     config.plugins.push(new BundleAnalyzerPlugin({
  //       analyzerMode: 'static',
  //       reportFilename: './reports/bundle-analysis.html',
  //       openAnalyzer: false,
  //     }));
  //   }
  //   return config;
  // },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Code splitting hints
  // Pages over 100KB should use dynamic imports
};

// Bundle budget thresholds (enforced via CI)
const BUNDLE_BUDGETS = {
  // Maximum page size (first load JS)
  maxPageSize: {
    home: 150,     // KB
    login: 100,    // KB
    feed: 200,     // KB
    profile: 200,  // KB
  },
  // Maximum total vendor bundle
  maxVendorBundle: 500, // KB
  // Maximum initial CSS
  maxCssSize: 50,  // KB
};

export { bundleAnalysisConfig, BUNDLE_BUDGETS };