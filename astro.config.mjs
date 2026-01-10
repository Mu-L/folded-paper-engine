// astro.config.mjs
import {defineConfig} from 'astro/config';
import react from "@astrojs/react";
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  srcDir: './src/website',
  outDir: './dist/website',
  site: 'https://fpe.papercraft.games',
  build: {
    format: "file",
  },
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        if (item.url === "https://fpe.papercraft.games/") {
          return {...item, url: "https://fpe.papercraft.games"};
        }

        return item;
      }
    }),
  ],
});
