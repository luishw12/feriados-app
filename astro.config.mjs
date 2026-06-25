// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site = env.PUBLIC_SITE_URL || 'https://feriados.luishw.com.br';

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind(),
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        const segments = path.split('/').filter(Boolean);

        if (segments.length === 0) {
          item.priority = 1.0;
        } else if (segments[0] === 'guia') {
          item.priority = 0.95;
        } else if (segments[0] === 'feriado') {
          item.priority = 0.7;
        } else if (segments.length === 1) {
          item.priority = 0.9;
        } else {
          item.priority = 0.8;
        }

        item.changefreq = 'monthly';
        return item;
      },
    }),
  ],
  output: 'static',
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
});
