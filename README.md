# Cloudflare Workers status page

Monitor HTTP endpoints, show daily availability and latency history, and get Slack / Telegram / Discord alerts when status changes. Built with **[Astro](https://astro.build/)** (SSR on **[Cloudflare Workers](https://workers.cloudflare.com/)**), **Cron Triggers**, and **KV**.

**Live site:** [status.tikvite.org](https://status.tikvite.org)

Based on [eidam/cf-workers-status-page](https://github.com/eidam/cf-workers-status-page) (originally Flareact + Workers Sites); this fork uses Astro, static assets via the **`ASSETS`** binding, and a small worker wrapper for **`scheduled`** (cron) + Astro **`fetch`**.

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/) with Workers enabled  
- A KV namespace for monitor state (binding name **`KV_STATUS_PAGE`**)  
- Optional notification channels: Slack, Discord, and/or Telegram  

For **GitHub Actions** deploys, you also need:

- Cloudflare API token with permission to manage Workers (e.g. **Edit Cloudflare Workers**)

## Configuration

1. Edit **[`config.yaml`](./config.yaml)** — monitors, copy, `settings.url` (must match your public status URL, e.g. `https://status.tikvite.org`), logo path under `public/`, histogram window, etc.
2. On each **`npm run dev`** / **`npm run build`**, **`scripts/emit-config.mjs`** writes **`src/generated/config.json`** (gitignored). Do not edit that JSON by hand.

## Deploy with GitHub Actions

1. Fork or clone this repo and push to GitHub.
2. **Settings → Secrets and variables → Actions** — add:
   - **`CF_API_TOKEN`** — Cloudflare API token  
   - **`CF_ACCOUNT_ID`** — Cloudflare account ID  
   - Optional: **`SECRET_SLACK_WEBHOOK_URL`**, **`SECRET_DISCORD_WEBHOOK_URL`**, **`SECRET_TELEGRAM_API_TOKEN`**, **`SECRET_TELEGRAM_CHAT_ID`**
3. Enable **Actions** for the repository.
4. Push to **`main`**. The workflow runs **`npm ci`**, **`npm run build`**, ensures **`KV_STATUS_PAGE`** is listed under **`[env.production]`** in `wrangler.toml`, runs **`wrangler deploy --env production`**, uploads secrets, and runs KV GC.

## Deploy from your machine

```bash
npm ci
npm run build
npx wrangler deploy --env production
```

Ensure **`wrangler.toml`** has **`KV_STATUS_PAGE`** bound for the target environment (the production block is often appended by CI the first time).

## Local development

**Requirements:** Node **18+**, npm.

```bash
npm install
npm run dev
```

`config.yaml` is compiled to **`src/generated/config.json`** automatically via **`predev`**. Tailwind CSS is built to **`public/style.css`** as part of **`npm run dev`**.

To exercise **KV** and **`cloudflare:workers`** bindings locally, use [**Wrangler**](https://developers.cloudflare.com/workers/wrangler/) / the Astro + Cloudflare dev flow as in current `@astrojs/cloudflare` docs (bindings come from your Wrangler config).

## Wrangler layout

- **[`wrangler.toml`](./wrangler.toml)** — production-oriented: Worker **`main`** (`dist/server/cloudflare-worker.mjs`), **`[assets]`** → **`dist/client`**, cron **`[triggers]`**.  
- **`wrangler.astro.toml`** — minimal config used by **`@astrojs/cloudflare`** during **`astro build` / dev** (see [`astro.config.mjs`](./astro.config.mjs)).

Adjust cron schedule if you hit KV limits on the free tier (e.g. every 2 minutes: `crons = ["*/2 * * * *"]`).

## Optional: Telegram

1. [Create a bot](https://core.telegram.org/bots#creating-a-new-bot) and put the token in **`SECRET_TELEGRAM_API_TOKEN`**.  
2. Message the bot from the chat that should receive alerts.  
3. Resolve chat id, e.g. `curl "https://api.telegram.org/bot<TOKEN>/getUpdates"`.  
4. Set **`SECRET_TELEGRAM_CHAT_ID`** and redeploy.

## Manual cron trigger (same as before)

The Worker exposes **`GET /api/triggerCron`** and **`GET /api/trigger-cron`** for a manual run (protect or remove in production if you do not want it public).

## Known limitations

- **Subrequest budget** — each scheduled run does one `fetch` per monitor; Slack/Telegram/Discord add more. Very large monitor counts can hit [Worker limits](https://developers.cloudflare.com/workers/platform/limits/).  
- **KV eventual consistency** — notifications can arrive before the status page reflects the latest KV read.  
- **Cold start / first run** — allow a minute or two after deploy for cron to populate data.

## License

See [LICENSE](./LICENSE).
