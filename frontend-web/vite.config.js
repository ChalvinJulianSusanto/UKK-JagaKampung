import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Optimasi build
  build: {
    // Code splitting manual untuk vendor dependencies
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-hot-toast'],

          // Charts dan data visualization
          'chart-vendor': ['recharts'],

          // Utilities
          'utils-vendor': ['axios', 'date-fns', 'xlsx'],
        },
      },
    },

    // Compress output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log di production
        drop_debugger: true,
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Source maps untuk debugging (disable di production untuk performa)
    sourcemap: false,
  },

  // Server optimization untuk development
  server: {
    // Enable HTTP/2 untuk faster loading
    https: false,

    // Warm up frequently used files
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/main.jsx',
        './src/components/layout/MainLayout.jsx',
        './src/pages/Dashboard.jsx',
      ],
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'lucide-react',
    ],
    exclude: ['xlsx'], // Large deps yang jarang digunakan
  },
})
