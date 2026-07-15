# ChatGPT Product Gallery Component

An interactive React product gallery organized as a portable ChatGPT App component, with a Next/vinext page retained as its local preview host.

## Project structure

```text
app/                              # Local preview host only
chatgpt-app/                      # MCP server + iframe widget bundle
components/product-gallery/       # Portable ChatGPT App UI package
  ChatGPTProductGallery.tsx       # ChatGPT/MCP Apps-aware entry
  ProductGallery.tsx              # Host-agnostic presentational component
  chatgpt-bridge.ts               # Tool-result and widget-state bridge
  demo-data.ts                    # Local preview data
  product-gallery.module.css      # Component-scoped styles
  types.ts                        # Structured-content contract
  index.ts                        # Public package exports
  README.md                       # Integration contract
public/gallery/                   # Demo assets
worker/                           # Preview/deployment worker
```

## Local preview

```bash
npm install
npm run dev
npm run build
npm test
```

## Review inside ChatGPT

Run the MCP server and tunnel in separate terminals:

```bash
npm run app:server
npm run app:tunnel
```

Use the generated HTTPS URL with `/mcp` when creating the developer-mode app in ChatGPT. See [chatgpt-app/README.md](chatgpt-app/README.md) for the full handoff.

## Stable deployment

The included `render.yaml` deploys the MCP server as an always-on Render web
service. Push the project to GitHub or GitLab, create a Render Blueprint from
the repository, then use the generated
`https://<service-name>.onrender.com/mcp` endpoint in ChatGPT. See
[chatgpt-app/README.md](chatgpt-app/README.md#deploy-a-stable-https-endpoint-on-render).

## Component usage

Use the presentational component in any React host:

```tsx
import { ProductGallery } from "@/components/product-gallery";

<ProductGallery data={galleryData} />;
```

Use the ChatGPT-aware entry inside an Apps SDK/MCP Apps widget:

```tsx
import {
  ChatGPTProductGallery,
  demoProductGalleryData,
} from "@/components/product-gallery";

<ChatGPTProductGallery fallbackData={demoProductGalleryData} />;
```

The component renders from MCP `structuredContent`, listens for `ui/notifications/tool-result`, persists selected-image UI state when `window.openai.setWidgetState` is available, and informs the model of selection changes through `ui/update-model-context`.

See [the component integration guide](components/product-gallery/README.md) for the structured tool-output schema and MCP resource requirements.
