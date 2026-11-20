import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/urbanmate/",
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/urbanmate/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/urbanmate\/uploads/, '/uploads')
      }
    }
  }
})
