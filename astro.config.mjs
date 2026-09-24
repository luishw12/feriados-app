// @ts-check
import { defineConfig, envField } from 'astro/config';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel';
import { cacheVercel } from '@astrojs/vercel/cache';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PUBLIC_SITE_URL || 'https://feriados.luishw.com.br';

export default defineConfig({
  site,
  output: 'server',
  trailingSlash: 'always',
  adapter: vercel({
    // Banco SQLite embutido (gerado do seed no build) — usado apenas quando o Turso
    // não está configurado, ex.: previews. Fica em modo somente leitura.
    includeFiles: ['.data/feriados.db'],
    maxDuration: 30,
  }),
  cache: {
    provider: cacheVercel(),
  },
  integrations: [preact()],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'always',
  },
  env: {
    schema: {
      TURSO_DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURSO_AUTH_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      ADMIN_GITHUB_LOGINS: envField.string({ context: 'server', access: 'secret', optional: true }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GA_MEASUREMENT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      ADMIN_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      EMAIL_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      INDEXNOW_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
