# Product Gallery ChatGPT App Component

This folder is the portable UI package. The Next.js page is only a local preview host.

## Structured tool output

Return this shape from the render tool as `structuredContent`:

```json
{
  "schemaVersion": 1,
  "type": "product-gallery",
  "product": {
    "eyebrow": "Atelier No. 04",
    "name": "Lilac Élan",
    "material": "Da hạt mềm · Lilac"
  },
  "initialImageId": "front",
  "images": [
    {
      "id": "front",
      "label": "Mặt trước",
      "src": "https://cdn.example.com/products/lilac-front.jpg",
      "alt": "Túi Lilac Élan nhìn từ mặt trước"
    }
  ]
}
```

`backgroundPosition` and `backgroundSize` are optional and intended for sprite/demo assets. Production tool results should normally provide one square image URL per item.

## ChatGPT integration

- `ChatGPTProductGallery` reads initial data from `window.openai.toolOutput` when available.
- It listens for the standard MCP Apps `ui/notifications/tool-result` notification and renders the latest `structuredContent`.
- Selected-image UI state is persisted with `window.openai.setWidgetState` when supported.
- Selection changes are mirrored to the model with `ui/update-model-context`.
- Incoming data is validated before rendering; invalid tool output falls back to the provided preview data.

The MCP server should register the built HTML as a `text/html;profile=mcp-app` resource and point the render tool to that resource with `_meta.ui.resourceUri` and `_meta["openai/outputTemplate"]`.
