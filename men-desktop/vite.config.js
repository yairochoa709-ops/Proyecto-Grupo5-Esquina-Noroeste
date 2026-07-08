import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    minify: 'terser',
    terserOptions: {
      format: { ascii_only: true },
      compress: { evaluate: false, unsafe: false, join_vars: false }
    }
  }
})
