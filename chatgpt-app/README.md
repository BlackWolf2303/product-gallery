# Product Gallery MCP App

This directory contains the ChatGPT-facing runtime:

```text
server/index.mjs        Streamable HTTP MCP server on /mcp
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

## Deploy a stable HTTPS endpoint on Render

The repository includes a root-level `render.yaml` Blueprint. It builds the
widget, starts the MCP HTTP server, and checks `/healthz` before routing traffic.

1. Push this project to a GitHub or GitLab repository.
2. In Render, choose **New → Blueprint** and connect that repository.
3. Confirm the `product-gallery-mcp` service and apply the Blueprint.
4. Wait for the deploy to become **Live**.
5. Open `https://<service-name>.onrender.com/healthz` and confirm it returns
   `{"status":"ok"}`.
6. Use `https://<service-name>.onrender.com/mcp` as the ChatGPT app endpoint.

The Blueprint uses Render's `starter` instance so the MCP endpoint remains
awake. To test without cost, change `plan: starter` to `plan: free`; free
services can sleep after inactivity, so they are not recommended for a reliable
ChatGPT integration.

After each push, Render automatically rebuilds and redeploys the app. Refresh
the developer-mode app in ChatGPT after a successful deployment so ChatGPT
reloads the latest tool and widget metadata.

## Add to ChatGPT

1. Enable Developer Mode in ChatGPT settings.
2. Open the app/plugin management page and create a developer app.
3. Paste the tunnel URL including `/mcp`.
4. Start a new chat, enable the app, and ask: `Show me the Lilac Élan product gallery.`

The server exposes one read-only tool: `show_product_gallery`. It registers the widget as `text/html;profile=mcp-app`, returns versioned `structuredContent`, serves the demo image through the same HTTPS origin, and declares that origin in the widget CSP.
