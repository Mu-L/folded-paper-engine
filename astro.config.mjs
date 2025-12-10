// astro.config.mjs
import {defineConfig} from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  srcDir: './src/website',
  outDir: './dist/website',
  site: 'https://fpe.papercraft.games',
  integrations: [sitemap()],
});
