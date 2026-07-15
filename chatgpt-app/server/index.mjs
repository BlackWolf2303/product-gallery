import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
const MCP_PATH = "/mcp";
const TEMPLATE_URI = "ui://widget/product-gallery-v1.html";
const widgetJsPath = fileURLToPath(new URL("../web/dist/widget.js", import.meta.url));
const widgetCssPath = fileURLToPath(new URL("../web/dist/widget.css", import.meta.url));
const productImagePath = fileURLToPath(
  new URL("../../public/gallery/lavender-bag-contact-sheet.png", import.meta.url),
);

const widgetJs = readFileSync(widgetJsPath, "utf8").replace(/<\/script/gi, "<\\/script");
const widgetCss = readFileSync(widgetCssPath, "utf8");
const productImage = readFileSync(productImagePath);

const productSchema = z.object({
  eyebrow: z.string(),
  name: z.string(),
  material: z.string(),
});

const imageSchema = z.object({
  id: z.string(),
  label: z.string(),
  src: z.string().url(),
  alt: z.string().optional(),
  backgroundPosition: z.string().optional(),
  backgroundSize: z.string().optional(),
});

const galleryOutputSchema = {
  schemaVersion: z.literal(1),
  type: z.literal("product-gallery"),
  product: productSchema,
  images: z.array(imageSchema),
  initialImageId: z.string().optional(),
};

function createGalleryServer(origin) {
  const server = new McpServer(
    { name: "product-gallery", version: "0.1.0" },
    {
      instructions:
        "Use show_product_gallery when the user asks to view, inspect, compare, or browse the Lilac Élan product photos.",
    },
  );

  registerAppResource(
    server,
    "product-gallery-widget",
    TEMPLATE_URI,
    {},
    async () => ({
      contents: [
        {
          uri: TEMPLATE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml(),
          _meta: {
            ui: {
              prefersBorder: false,
              csp: {
                connectDomains: [origin],
                resourceDomains: [origin],
              },
            },
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "show_product_gallery",
    {
      title: "Show product gallery",
      description:
        "Displays an interactive gallery of the Lilac Élan handbag with selectable product photos.",
      inputSchema: {},
      outputSchema: galleryOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: TEMPLATE_URI },
        "openai/outputTemplate": TEMPLATE_URI,
        "openai/toolInvocation/invoking": "Preparing the product gallery…",
        "openai/toolInvocation/invoked": "Product gallery ready.",
      },
    },
    async () => ({
      structuredContent: galleryData(origin),
      content: [
        {
          type: "text",
          text: "Showing 10 interactive photos of the Lilac Élan handbag.",
        },
      ],
      _meta: {},
    }),
  );

  return server;
}

function widgetHtml() {
  return `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${widgetCss}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${widgetJs}</script>
  </body>
</html>`.trim();
}

function galleryData(origin) {
  const src = `${origin}/assets/lavender-bag-contact-sheet.png`;
  return {
    schemaVersion: 1,
    type: "product-gallery",
    product: {
      eyebrow: "Atelier No. 04",
      name: "Lilac Élan",
      material: "Da hạt mềm · Lilac",
    },
    initialImageId: "front",
    images: [
      image("front", "Mặt trước", src, "0% 0%", "300% 200%"),
      image("side", "Góc nghiêng", src, "50% 0%", "300% 200%"),
      image("clasp", "Chi tiết khoá", src, "100% 0%", "300% 200%"),
      image("worn", "Khi đeo", src, "0% 100%", "300% 200%"),
      image("inside", "Bên trong túi", src, "50% 100%", "300% 200%"),
      image("back", "Mặt sau", src, "100% 100%", "300% 200%"),
      image("stitching", "Chi tiết đường may", src, "4% 5%", "360% 240%"),
      image("handle", "Chi tiết quai túi", src, "47% 3%", "360% 240%"),
      image("leather", "Bề mặt da", src, "96% 7%", "360% 240%"),
      image("styling", "Phối cùng trang phục", src, "3% 96%", "360% 240%"),
    ],
  };
}

function image(id, label, src, backgroundPosition, backgroundSize) {
  return {
    id,
    label,
    src,
    alt: `Lilac Élan — ${label}`,
    backgroundPosition,
    backgroundSize,
  };
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname.startsWith(MCP_PATH)) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ name: "product-gallery", status: "ok", mcp: MCP_PATH }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok" }));
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
    res.end(`<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Product Gallery MCP</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #121113; color: #f5f0e8; font: 16px/1.55 system-ui, sans-serif; }
      main { width: min(620px, calc(100% - 40px)); padding: 32px; border: 1px solid #3a353d; border-radius: 18px; background: #1c191e; }
      h1 { margin: 0 0 12px; font: 36px/1.1 Georgia, serif; }
      code { display: block; overflow-wrap: anywhere; padding: 14px; border-radius: 10px; background: #0f0e10; color: #d4bddf; }
      .status { color: #9bd5ad; }
    </style>
  </head>
  <body>
    <main>
      <p class="status">● MCP server đang hoạt động</p>
      <h1>Product Gallery MCP</h1>
      <p>Đây là endpoint giao thức dành cho ChatGPT/MCP client, không phải trang gallery độc lập.</p>
      <code>${escapeHtml(endpoint)}</code>
      <p>Hãy dán toàn bộ URL trên vào phần tạo app ở ChatGPT Developer Mode.</p>
    </main>
  </body>
</html>`);
    return;
  }

  const mcpMethods = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && mcpMethods.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const origin = requestOrigin(req);
    const server = createGalleryServer(origin);
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

function requestOrigin(req) {
  const forwardedHost = firstHeader(req.headers["x-forwarded-host"]);
  const host = forwardedHost ?? req.headers.host ?? `127.0.0.1:${port}`;
  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]);
  const protocol = forwardedProto ?? (String(host).includes("localhost") || String(host).startsWith("127.") ? "http" : "https");
  return `${protocol}://${host}`;
}

function firstHeader(value) {
  return Array.isArray(value) ? value[0] : value?.split(",")[0]?.trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
