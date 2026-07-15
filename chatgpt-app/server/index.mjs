import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  createGalleryServer,
  endpointHtml,
  MCP_PATH,
} from "./gallery.mjs";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
const widgetJsPath = fileURLToPath(new URL("../web/dist/widget.js", import.meta.url));
const widgetCssPath = fileURLToPath(new URL("../web/dist/widget.css", import.meta.url));
const productImagePath = fileURLToPath(
  new URL("../../public/gallery/lavender-bag-contact-sheet.png", import.meta.url),
);

const widgetAssets = {
  widgetJs: readFileSync(widgetJsPath, "utf8").replace(/<\/script/gi, "<\\/script"),
  widgetCss: readFileSync(widgetCssPath, "utf8"),
};
const productImage = readFileSync(productImagePath);

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname.startsWith(MCP_PATH)) {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    writeJson(res, { name: "product-gallery", status: "ok", mcp: MCP_PATH });
    return;
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    writeJson(res, { status: "ok" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/assets/lavender-bag-contact-sheet.png") {
    res.writeHead(200, {
      "content-type": "image/png",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    });
    res.end(productImage);
    return;
  }

  if (
    req.method === "GET" &&
    url.pathname === MCP_PATH &&
    String(req.headers.accept ?? "").includes("text/html")
  ) {
    const endpoint = `${requestOrigin(req)}${MCP_PATH}`;
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(endpointHtml(endpoint));
    return;
  }

  const mcpMethods = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && mcpMethods.has(req.method)) {
    Object.entries(corsHeaders()).forEach(([name, value]) => res.setHeader(name, value));

    const server = createGalleryServer(requestOrigin(req), widgetAssets);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!res.headersSent) res.writeHead(500).end("Internal server error");
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, host, () => {
  console.log(`Product Gallery MCP server: http://${host}:${port}${MCP_PATH}`);
});

function shutdown(signal) {
  console.log(`${signal} received; closing HTTP server`);
  httpServer.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

function writeJson(res, value) {
  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "content-type, mcp-session-id, last-event-id, mcp-protocol-version",
    "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
  };
}

function requestOrigin(req) {
  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]);
  const forwardedHost = firstHeader(req.headers["x-forwarded-host"]);
  const protocol = forwardedProto ?? (req.socket.encrypted ? "https" : "http");
  const requestHost = forwardedHost ?? req.headers.host ?? `${host}:${port}`;
  return `${protocol}://${requestHost}`;
}

function firstHeader(value) {
  if (Array.isArray(value)) return value[0];
  return value?.split(",")[0]?.trim();
}
