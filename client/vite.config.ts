import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // ESBuild options for client-side builds
  },
  define: {
    __vite_ssr_exportName__: 'undefined',
    global: 'globalThis'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
