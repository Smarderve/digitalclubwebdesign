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
  },
  preview: {
    host: '127.0.0.1',
    port: 4178,
  },
})
