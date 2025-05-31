import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://tauri.app/v1/guides/getting-started/setup/vite
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: 'tsconfig.app.json',
    },
  },
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      external: [
        '@tauri-apps/api/app',
        '@tauri-apps/api/core',
        '@tauri-apps/api/event',
        '@tauri-apps/api/path',
        '@tauri-apps/api/process',
        '@tauri-apps/api/shell',
        '@tauri-apps/api/updater',
        '@tauri-apps/api/window',
        '@tauri-apps/plugin-shell',
        '@tauri-apps/plugin-updater',
      ],
    },
  },
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
      // Add HMR specific websocket endpoint
      '/socket.io': {
        target: 'ws://localhost:5173',
        ws: true,
      }
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  // Tauri expects a fixed port, fail if that port is not available
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
})
