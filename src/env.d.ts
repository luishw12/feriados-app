/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_AUTHOR_NAME: string;
  readonly PUBLIC_LINKEDIN_URL: string;
  readonly PUBLIC_GITHUB_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __FERIADOS_BOOTSTRAP_LOCATION__?: string;
}
