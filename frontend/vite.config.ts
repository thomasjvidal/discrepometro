import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(fileURLToPath(new URL('.', import.meta.url)), "./src"),
      },
    },
    server: {
      port: 5173,
      host: true,
      // Security headers for development
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    },
    build: {
      // Security optimizations for production
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js']
          }
        }
      },
      // Source maps only in development
      sourcemap: mode === 'development',
      // Minify in production
      minify: mode === 'production',
      // Security headers for production
      target: 'es2015'
    },
    define: {
      // Expose env variables to the client
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
      // Security: prevent eval usage
      'global': 'globalThis',
    }
  }
})
