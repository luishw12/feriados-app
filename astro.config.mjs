// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site = env.PUBLIC_SITE_URL || 'https://feriados.luishw.com.br';

/** @type {import('@astrojs/sitemap').SitemapOptions} */
const sitemapOptions = {
  serialize(item) {
    const path = new URL(item.url).pathname;
    const segments = path.split('/').filter(Boolean);

    /** @type {'weekly' | 'monthly'} */
    let changefreq = 'monthly';

    if (segments.length === 0) {
      item.priority = 1.0;
      changefreq = 'weekly';
    } else if (segments[0] === 'guia') {
      item.priority = 0.95;
      changefreq = 'weekly';
    } else if (segments[0] === 'feriado') {
      item.priority = 0.75;
    } else if (segments[0] === 'sobre' || segments[0] === 'privacidade' || segments[0] === 'changelog') {
      item.priority = segments[0] === 'sobre' ? 0.9 : 0.85;
    } else if (segments.length === 1) {
      item.priority = 0.9;
    } else if (segments.length === 2) {
      item.priority = 0.7;
    } else {
      item.priority = 0.65;
    }

    // EnumChangefreq do sitemap aceita esses literais em runtime
    item.changefreq = /** @type {import('sitemap').EnumChangefreq} */ (changefreq);
    return item;
  },
  entryLimit: 45000,
};

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [react(), sitemap(sitemapOptions)],
  output: 'static',
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
