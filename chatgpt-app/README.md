# Product Gallery MCP App

This directory contains the ChatGPT-facing runtime:

```text
server/index.mjs        Streamable HTTP MCP server on /mcp
server/gallery.mjs      Shared tool, resource, schema, and widget contract
worker/index.mjs        Cloudflare Workers production runtime
web/entry.tsx           React widget entry
web/widget.css          iframe-level base styles
web/dist/               generated inline widget bundle
scripts/build-widget.mjs
```

## Run locally

Terminal 1:

```bash
npm run app:server
```

The MCP endpoint is `http://127.0.0.1:8787/mcp`.

Terminal 2:

```bash
npm run app:tunnel
```

Copy the generated `https://<name>.trycloudflare.com/mcp` URL into ChatGPT Developer Mode. Quick Tunnel URLs are temporary and stop working when either terminal process exits.

## Test the Cloudflare Worker locally

```bash
npm run app:worker:dev
```

Wrangler builds the widget before starting the Worker. Verify these URLs using
the local address printed by Wrangler:

```text
http://localhost:8787/healthz
http://localhost:8787/mcp
```

The `/mcp` URL shows a status page in a normal browser and handles Streamable
HTTP when called by ChatGPT or another MCP client.

## Deploy through Cloudflare Workers Builds

The root `wrangler.mcp.jsonc` is the source of truth for the Worker name, runtime,
static assets, build command, and observability. The production Worker uses the
stateless Web Standard Streamable HTTP transport, so it does not require a
Durable Object.

To connect the existing GitHub repository:

1. Open **Cloudflare Dashboard → Workers & Pages**.
2. Create a Worker by importing the `BlackWolf2303/product-gallery` repository.
3. Select `main` as the production branch.
4. Leave the root directory as `/`.
5. Leave the build command empty; `wrangler.mcp.jsonc` runs `npm run app:build`.
6. Use `npx wrangler deploy --config wrangler.mcp.jsonc` as the deploy command. The
   explicit config prevents the vinext preview build from redirecting Wrangler
   to its separate generated Worker.
7. Save and deploy.

After the first successful build, Cloudflare provides a stable URL similar to:

```text
https://product-gallery-mcp.<account>.workers.dev
```

Verify the deployment:

1. Open `https://product-gallery-mcp.<account>.workers.dev/healthz` and confirm
   it returns `{"status":"ok"}`.
2. Open `https://product-gallery-mcp.<account>.workers.dev/mcp` and confirm the
   MCP status page appears.
3. Use `https://product-gallery-mcp.<account>.workers.dev/mcp` as the ChatGPT app
   endpoint.

Every push to `main` triggers a new Workers Build. Branches can produce preview
versions without promoting them to production.

## Deploy from a terminal

If Wrangler is already authenticated with your Cloudflare account:

```bash
npm run app:worker:check
npm run app:worker:deploy
```

Refresh the developer-mode app in ChatGPT after a successful deployment so
ChatGPT reloads the latest tool and widget metadata.

## Add to ChatGPT

1. Enable Developer Mode in ChatGPT settings.
2. Open the app/plugin management page and create a developer app.
3. Paste the tunnel URL including `/mcp`.
4. Start a new chat, enable the app, and ask: `Show me the Lilac Élan product gallery.`

The server exposes one read-only tool: `show_product_gallery`. It registers the widget as `text/html;profile=mcp-app`, returns versioned `structuredContent`, serves the demo image through the same HTTPS origin, and declares that origin in the widget CSP.
