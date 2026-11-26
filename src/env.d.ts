/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_YM_ID: string;
  readonly PUBLIC_GA_ID: string;
  readonly PUBLIC_GOOGLE_ADS_ID: string;
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
