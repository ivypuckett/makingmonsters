/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), svelte()],
  build: {
    outDir: '../build/pb_public',
    emptyOutDir: true,
  },
  // Under Vitest (mode === 'test'), resolve Svelte's browser build so component
  // mounting works in jsdom; otherwise it picks the server build and mount() fails.
  resolve: {
    conditions: mode === 'test' ? ['browser'] : undefined,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup.js'],
    include: ['src/**/*.{test,spec}.{js,svelte.js}'],
  },
}))
