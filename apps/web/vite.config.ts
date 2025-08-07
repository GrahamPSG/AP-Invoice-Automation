import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    // Optimize for Vercel deployment
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    
    // Optimize chunk sizes for Vercel
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
    
    chunkSizeWarningLimit: 500,
  },
  
  // Development server
  server: {
    port: 5173,
    host: true,
  },
  
  preview: {
    port: 4173,
    host: true,
  }
})