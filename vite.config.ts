import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'public'),
  plugins: [react()],
  publicDir: path.resolve(__dirname, 'public/static'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname)],
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'public/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'public/index.html'),
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
