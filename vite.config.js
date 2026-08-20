import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Makes production build relative & deployable to any custom domain or subdirectory
  server: {
    port: 3000,
    open: true
  }
});
