import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls to the local Django backend so dev needs no CORS handling
    // and mirrors production, where /api is served from the same origin.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
