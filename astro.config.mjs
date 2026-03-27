import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.lazarusreport.online',
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['leaflet'],
    },
  },
  
});
