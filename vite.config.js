import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'

// Configure dev server to run on port 5173 and proxy /api requests to the ASP.NET backend
export default defineConfig({
  plugins: [
    ...(process.env.CF_PAGES || process.env.CF_PAGES_URL ? [cloudflare()] : []),
    react()
  ],
  server: {
    port: 3000,
    strictPort: false, // Try next available port if 3000 is in use
    proxy: {
      '/api2': {
        target: 'https://mapelectric-peru.duckdns.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path // Keep /api2 in the path
      }
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
})
