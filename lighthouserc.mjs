// =============================================================================
// Velvet Galaxy - Lighthouse Audit Configuration
// Run with: npx lighthouse http://localhost:3000 --output=html --output-path=./reports/lighthouse.html
// Or CI: npx lighthouse http://localhost:3000 --output=json --chrome-flags="--headless"
// =============================================================================

/** @type {import('lighthouse').Config} */
export default {
  extends: 'lighthouse:default',
  settings: {
    locale: 'fr',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
      'interactive',
      'server-response-time',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      'unused-css-rules',
      'unused-javascript',
      'uses-responsive-images',
      'offscreen-images',
      'uses-optimized-images',
      'uses-webp-images',
      'uses-text-compression',
      'efficient-animated-content',
      'duplicated-javascript',
      'legacy-javascript',
      'dom-size',
      'bootup-time',
      'mainthread-work-breakdown',
    ],
    budgets: [
      {
        resourceSizes: [
          { resourceType: 'script', budget: 200 },    // KB
          { resourceType: 'stylesheet', budget: 50 },  // KB
          { resourceType: 'image', budget: 500 },      // KB
          { resourceType: 'font', budget: 100 },       // KB
          { resourceType: 'total', budget: 800 },      // KB
        ],
        timingBudget: [
          { metric: 'first-contentful-paint', budget: 2000 },       // ms
          { metric: 'largest-contentful-paint', budget: 3000 },     // ms
          { metric: 'total-blocking-time', budget: 300 },            // ms
          { metric: 'cumulative-layout-shift', budget: 0.1 },       // score
          { metric: 'speed-index', budget: 4000 },                   // ms
        ],
      },
    ],
  },
};