import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { artheusStudio } from './studio/plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss(), artheusStudio()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  server: { port: 5173 },
})
