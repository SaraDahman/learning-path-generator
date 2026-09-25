import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const clientRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: clientRoot,
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5055,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});