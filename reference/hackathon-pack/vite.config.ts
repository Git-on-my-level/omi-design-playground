import { defineConfig } from 'vite';

export default defineConfig({
  root: 'examples/vanilla-html',
  publicDir: false,
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
});
