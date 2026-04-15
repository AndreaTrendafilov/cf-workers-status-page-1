import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig, sessionDrivers } from 'astro/config';

// https://docs.astro.build/en/guides/integrations-guide/cloudflare/
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // Avoid IMAGES / SESSION bindings we do not use; use Node prerender (workerd hit "Code generation from strings disallowed" here).
    imageService: 'passthrough',
    prerenderEnvironment: 'node',
    configPath: './wrangler.astro.toml', // deploy uses root wrangler.toml (main + assets + cron)
  }),
  integrations: [react()],
  session: {
    driver: sessionDrivers.memory(),
  },
});
