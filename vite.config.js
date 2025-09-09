import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configure dev server to run on port 5173 and proxy /api requests to the ASP.NET backend
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false, // Try next available port if 3000 is in use
    proxy: {
      '/api': {
        target: 'http://localhost:5184',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path // Keep /api in the path
      }
    }
  }
})
