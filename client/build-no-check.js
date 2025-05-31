#!/usr/bin/env node

/**
 * Build script that skips TypeScript checking for faster CI builds
 * This is used in GitHub Actions where we want to build quickly
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Building Nyx client (skipping type check for speed)...');

try {
  // Run Vite build without TypeScript checking
  execSync('vite build', {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      // Skip TypeScript checking for faster builds
      VITE_SKIP_TYPE_CHECK: 'true'
    }
  });
  
  console.log('✅ Client build completed successfully!');
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  process.exit(1);
}
