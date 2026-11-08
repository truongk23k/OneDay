/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages phục vụ ở /OneDay/, Vercel phục vụ ở gốc (Vercel tự đặt biến VERCEL khi build).
  base: process.env.VERCEL ? '/' : '/OneDay/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
  },
})
