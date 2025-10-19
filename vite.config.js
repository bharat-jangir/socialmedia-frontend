import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Bharat Social Media - Vite Configuration
 * 
 * @author Bharat
 * @version 1.0.0
 */
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['sockjs-client', 'stompjs']
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
