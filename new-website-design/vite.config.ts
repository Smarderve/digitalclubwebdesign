import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      /* The project previously used lucide-react. Icons are now Phosphor glyphs
         from the Iconify collections, exposed through one module with the same
         component API. */
      { find: 'lucide-react', replacement: path.resolve(root, 'src/components/ui/icons.tsx') },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5178,
    /* Local development only. In production the SPA and the Flask API are served
       from one origin (integration architecture §12.3); this proxy reproduces that
       in the browser so Flask-Login cookies, the future CSRF token and Origin
       checks behave exactly as they will in production. It changes no build output. */
    proxy: {
      '/api': { target: 'http://127.0.0.1:5051', changeOrigin: false },
      '/healthz': { target: 'http://127.0.0.1:5051', changeOrigin: false },
      '/static/uploads': { target: 'http://127.0.0.1:5051', changeOrigin: false },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4178,
  },
})
