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
        target: 'https://urbanmate.towsindia.com',
        changeOrigin: true
      },
      '/urbanmate/uploads': {
        target: 'https://urbanmate.towsindia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/urbanmate\/uploads/, '/uploads')
      }
    }
  }
})
