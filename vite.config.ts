import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure assets are referenced from the root for SPA deployment
  root: 'public', // Process files in the 'public' directory (e.g., public/index.html)
  build: {
    outDir: '../dist', // Output to project_root/dist (relative from 'public' root)
    emptyOutDir: true, // Clean the dist directory before building
  },
  server: {
    // For local dev, proxy API requests to the worker if running 'vite dev' separately
    // from 'wrangler dev'. However, 'wrangler dev' with the [build] command
    // is the recommended way to test the integrated setup.
    // proxy: {
    //   '/api': 'http://localhost:8787' // Assuming wrangler dev runs on 8787
    // }
  }
})