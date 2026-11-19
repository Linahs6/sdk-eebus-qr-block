import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: { entry: 'src/main.tsx', formats: ['umd'], name: 'EebusQrBlock', fileName: () => 'bundle.js' },
    rollupOptions: { external: [], output: { inlineDynamicImports: true } },
    cssCodeSplit: false,
    minify: true,
    sourcemap: false,
  },
})
