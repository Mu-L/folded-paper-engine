// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Treat your existing website folder as Astro's src dir
  srcDir: './src/website',

  // Pages are already in src/website/pages
  // Layouts already in src/website/layouts

  // Where to put the built static site
  outDir: './dist',

  // Optional: set site URL later when you want
  // site: 'https://fpe.papercraft.games',
});
