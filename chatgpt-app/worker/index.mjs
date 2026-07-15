import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import widgetJs from "../web/dist/widget.js.txt";
import widgetCss from "../web/dist/widget.css.txt";
import {
  createGalleryServer,
  endpointHtml,
  MCP_PATH,
} from "../server/gallery.mjs";

const widgetAssets = {
  widgetJs: widgetJs.replace(/<\/script/gi, "<\\/script"),
  widgetCss,
};
const productImagePath = "/gallery/lavender-bag-contact-sheet.png";

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith(MCP_PATH)) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json({ name: "product-gallery", status: "ok", mcp: MCP_PATH });
    }

    if (request.method === "GET" && url.pathname === "/healthz") {
      return json({ status: "ok" });
    }

    if (
      ["GET", "HEAD"].includes(request.method) &&
      url.pathname === "/assets/lavender-bag-contact-sheet.png"
    ) {
      const assetUrl = new URL(productImagePath, url.origin);
      const assetResponse = await env.ASSETS.fetch(
        new Request(assetUrl, { method: "GET", headers: request.headers }),
      );
      const headers = new Headers(assetResponse.headers);
      headers.set("access-control-allow-origin", "*");
      headers.set("cache-control", "public, max-age=3600");
      return new Response(request.method === "HEAD" ? null : assetResponse.body, {
        status: assetResponse.status,
        headers,
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === MCP_PATH &&
      (request.headers.get("accept") ?? "").includes("text/html")
    ) {
      return new Response(endpointHtml(`${url.origin}${MCP_PATH}`), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (
      url.pathname === MCP_PATH &&
      ["POST", "GET", "DELETE"].includes(request.method)
    ) {
      const server = createGalleryServer(url.origin, widgetAssets);
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      try {
        await server.connect(transport);
        const response = await transport.handleRequest(request);
        return withCors(response);
      } catch (error) {
        console.error("MCP request failed", error);
        return withCors(new Response("Internal server error", { status: 500 }));
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};

export default worker;

function json(value) {
  return new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(corsHeaders())) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, GET, DELETE, OPTIONS",
    "access-control-allow-headers":
      "content-type, mcp-session-id, last-event-id, mcp-protocol-version",
    "access-control-expose-headers": "mcp-session-id, mcp-protocol-version",
  };
}
