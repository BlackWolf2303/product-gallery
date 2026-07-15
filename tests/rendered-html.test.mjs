import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the product gallery preview", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Atelier Gallery — Lilac Élan<\/title>/i);
  assert.match(html, /Bộ sưu tập ảnh sản phẩm/);
  assert.match(html, /Lilac Élan/);
  assert.match(html, /10(?:<!-- -->)? ảnh/);
  assert.match(html, /aria-pressed="true"/);
});

test("keeps the ChatGPT component portable and the page preview-only", async () => {
  const componentRoot = new URL("../components/product-gallery/", import.meta.url);
  const [bridge, component, types, exports, page, css] = await Promise.all([
    readFile(new URL("chatgpt-bridge.ts", componentRoot), "utf8"),
    readFile(new URL("ProductGallery.tsx", componentRoot), "utf8"),
    readFile(new URL("types.ts", componentRoot), "utf8"),
    readFile(new URL("index.ts", componentRoot), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("product-gallery.module.css", componentRoot), "utf8"),
  ]);

  assert.match(bridge, /ui\/notifications\/tool-result/);
  assert.match(bridge, /setWidgetState/);
  assert.match(bridge, /ui\/update-model-context/);
  assert.match(types, /type:\s*"product-gallery"/);
  assert.match(component, /ProductGalleryProps/);
  assert.match(component, /aria-pressed/);
  assert.match(exports, /ChatGPTProductGallery/);
  assert.match(page, /ChatGPTProductGallery/);
  assert.match(css, /\.thumbnailScroll/);
  await assert.rejects(access(new URL("../app/product-gallery.tsx", import.meta.url)));
});

test("builds a self-contained ChatGPT widget bundle", async () => {
  const [js, css, workerJs, workerCss] = await Promise.all([
    stat(new URL("../chatgpt-app/web/dist/widget.js", import.meta.url)),
    stat(new URL("../chatgpt-app/web/dist/widget.css", import.meta.url)),
    stat(new URL("../chatgpt-app/web/dist/widget.js.txt", import.meta.url)),
    stat(new URL("../chatgpt-app/web/dist/widget.css.txt", import.meta.url)),
  ]);

  assert.ok(js.size > 0);
  assert.ok(css.size > 0);
  assert.equal(workerJs.size, js.size);
  assert.equal(workerCss.size, css.size);
});

test("configures a stateless Cloudflare Worker MCP endpoint", async () => {
  const [worker, config] = await Promise.all([
    readFile(new URL("../chatgpt-app/worker/index.mjs", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.mcp.jsonc", import.meta.url), "utf8"),
  ]);

  assert.match(worker, /WebStandardStreamableHTTPServerTransport/);
  assert.match(worker, /url\.pathname === MCP_PATH/);
  assert.match(worker, /env\.ASSETS\.fetch/);
  assert.match(config, /"main": "chatgpt-app\/worker\/index\.mjs"/);
  assert.match(config, /"run_worker_first": true/);
});
