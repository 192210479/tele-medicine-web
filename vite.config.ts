import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: "all",
    proxy: {
      '/api': {
        target: 'http://103.249.82.251:8002',
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'http://103.249.82.251:8002',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://103.249.82.251:8002',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/uploads': {
        target: 'http://103.249.82.251:8002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
