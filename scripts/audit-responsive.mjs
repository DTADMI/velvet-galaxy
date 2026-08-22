#!/usr/bin/env node
// =============================================================================
// Velvet Galaxy — Mobile Responsiveness Audit
// Checks all pages for horizontal overflow at 320px viewport width.
// Run with: node scripts/audit-responsive.mjs
// Requires: next dev running on localhost:3000
// =============================================================================

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const MOBILE_WIDTH = 320;
const MOBILE_HEIGHT = 568;

// Common pages to check
const PAGES = [
  '/',                              // Home
  '/login',                         // Login
  '/register',                      // Register
  '/feed',                          // Feed
  '/explore',                       // Explore
  '/profile',                       // Profile
  '/settings',                      // Settings
  '/messages',                      // Messages
  '/notifications',                 // Notifications
  '/search',                        // Search
];

async function auditResponsive() {
  console.log('═══════════════════════════════════');
  console.log('  Mobile Responsiveness Audit     ');
  console.log('  Viewport: 320×568               ');
  console.log('═══════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT },
  });
  const page = await context.newPage();

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const route of PAGES) {
    console.log(`Testing: ${route}...`);

    try {
      await page.goto(`${BASE_URL}${route}`, { timeout: 10000, waitUntil: 'networkidle' }).catch(() => {
        console.log(`  ⚠️  Could not load (page may not exist or requires auth)`);
        return;
      });

      const issues = [];

      // Check 1: Horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return {
          bodyOverflow: body.scrollWidth > window.innerWidth,
          htmlOverflow: html.scrollWidth > window.innerWidth,
          maxWidth: Math.max(body.scrollWidth, html.scrollWidth),
          viewport: window.innerWidth,
        };
      });

      if (hasOverflow.bodyOverflow || hasOverflow.htmlOverflow) {
        issues.push(`Horizontal overflow detected: content ${hasOverflow.maxWidth}px > viewport ${hasOverflow.viewport}px`);
      }

      // Check 2: Elements wider than viewport with position: absolute/fixed
      const overflowingElements = await page.evaluate(() => {
        const elems = document.querySelectorAll('*');
        const offenders = [];
        for (const el of elems) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (rect.width > window.innerWidth + 5 && style.display !== 'none') {
            offenders.push({
              tag: el.tagName,
              class: el.className?.toString()?.slice(0, 50),
              width: Math.round(rect.width),
            });
          }
        }
        return offenders;
      });

      if (overflowingElements.length > 0) {
        for (const el of overflowingElements.slice(0, 5)) {
          issues.push(`Element too wide: <${el.tag} class="${el.class}"> — ${el.width}px`);
        }
      }

      // Check 3: Fixed-position elements covering content
      const hasFixedOverlay = await page.evaluate(() => {
        const fixed = [...document.querySelectorAll('*')].filter(el => {
          const style = window.getComputedStyle(el);
          return style.position === 'fixed';
        });

        let totalArea = 0;
        const viewportArea = window.innerWidth * window.innerHeight;
        for (const el of fixed) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            totalArea += rect.width * rect.height;
          }
        }

        return totalArea / viewportArea > 0.4; // More than 40% covered by fixed elements
      });

      if (hasFixedOverlay) {
        issues.push('Fixed elements cover >40% of viewport — may block content on mobile');
      }

      // Report
      if (issues.length === 0) {
        console.log(`  ✅ PASS`);
        passed++;
      } else {
        console.log(`  ❌ ${issues.length} issue(s):`);
        for (const issue of issues) {
          console.log(`     - ${issue}`);
        }
        failed++;
      }

      results.push({ route, passed: issues.length === 0, issues });
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      failed++;
      results.push({ route, passed: false, issues: [err.message] });
    }
  }

  await browser.close();

  // Summary
  console.log('\n═══════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed, ${PAGES.length} total`);
  console.log(`Score: ${Math.round((passed / PAGES.length) * 100)}% responsive at 320px`);
  console.log('═══════════════════════════════════\n');

  return results;
}

auditResponsive().catch(console.error);