import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios') || id.includes('zod') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      }
    }
  }
})
