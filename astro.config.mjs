import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  base: '/',
  build: {
    assets: 'assets',
  },
  integrations: [react(), tailwind()],
});
