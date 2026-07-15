import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

export const MCP_PATH = "/mcp";
export const TEMPLATE_URI = "ui://widget/product-gallery-v1.html";

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

export function createGalleryServer(origin, widgetAssets) {
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
          text: widgetHtml(widgetAssets),
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

export function widgetHtml({ widgetJs, widgetCss }) {
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

export function galleryData(origin) {
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

export function endpointHtml(endpoint) {
  return `<!doctype html>
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
</html>`;
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
