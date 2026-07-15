"use client";

import { useEffect, useState } from "react";
import type { ProductGalleryData, ProductGalleryWidgetState } from "./types";

type OpenAIWidgetBridge = {
  toolOutput?: unknown;
  widgetState?: ProductGalleryWidgetState | null;
  setWidgetState?: (state: ProductGalleryWidgetState) => void;
};

declare global {
  interface Window {
    openai?: OpenAIWidgetBridge;
  }
}

type ToolResultNotification = {
  jsonrpc?: string;
  id?: string | number;
  error?: unknown;
  method?: string;
  params?: { structuredContent?: unknown };
};

export function useProductGalleryToolOutput(fallbackData: ProductGalleryData) {
  const [data, setData] = useState<ProductGalleryData>(fallbackData);

  useEffect(() => {
    const initializeId = `product-gallery-init-${Date.now()}`;
    const initial = parseProductGalleryData(window.openai?.toolOutput);
    if (initial) setData(initial);

    const onMessage = (event: MessageEvent<ToolResultNotification>) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;

      if (message.id === initializeId && !message.error) {
        window.parent.postMessage(
          { jsonrpc: "2.0", method: "ui/notifications/initialized", params: {} },
          "*",
        );
        return;
      }

      if (message.method !== "ui/notifications/tool-result") return;

      const next = parseProductGalleryData(message.params?.structuredContent);
      if (next) setData(next);
    };

    const onSetGlobals = (event: Event) => {
      const globals = (event as CustomEvent<{ globals?: { toolOutput?: unknown } }>).detail?.globals;
      const next = parseProductGalleryData(globals?.toolOutput);
      if (next) setData(next);
    };

    window.addEventListener("message", onMessage, { passive: true });
    window.addEventListener("openai:set_globals", onSetGlobals, { passive: true });

    if (window.parent !== window) {
      window.parent.postMessage(
        {
          jsonrpc: "2.0",
          id: initializeId,
          method: "ui/initialize",
          params: {
            appInfo: { name: "product-gallery", version: "0.1.0" },
            appCapabilities: {},
            protocolVersion: "2026-01-26",
          },
        },
        "*",
      );
    }

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("openai:set_globals", onSetGlobals);
    };
  }, []);

  return data;
}

export function readPersistedImageId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const selected = window.openai?.widgetState?.modelContent?.selectedImageId;
  return typeof selected === "string" ? selected : undefined;
}

export function persistSelectedImage(imageId: string, label: string) {
  if (typeof window === "undefined") return;

  window.openai?.setWidgetState?.({
    modelContent: { selectedImageId: imageId },
    privateContent: null,
    imageIds: [],
  });

  if (window.parent !== window) {
    window.parent.postMessage(
      {
        jsonrpc: "2.0",
        id: `gallery-selection-${Date.now()}`,
        method: "ui/update-model-context",
        params: {
          content: [{ type: "text", text: `User selected product image: ${label}.` }],
        },
      },
      "*",
    );
  }
}

function parseProductGalleryData(value: unknown): ProductGalleryData | null {
  if (!isRecord(value) || value.type !== "product-gallery" || value.schemaVersion !== 1) return null;
  if (!isRecord(value.product) || !Array.isArray(value.images)) return null;

  const eyebrow = readString(value.product.eyebrow);
  const name = readString(value.product.name);
  const material = readString(value.product.material);
  if (!eyebrow || !name || !material) return null;

  const images = value.images.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = readString(item.id);
    const label = readString(item.label);
    const src = readSafeImageSource(item.src);
    if (!id || !label || !src) return [];

    return [{
      id,
      label,
      src,
      alt: readString(item.alt),
      backgroundPosition: readString(item.backgroundPosition),
      backgroundSize: readString(item.backgroundSize),
    }];
  });

  if (images.length === 0) return null;

  return {
    schemaVersion: 1,
    type: "product-gallery",
    product: { eyebrow, name, material },
    images,
    initialImageId: readString(value.initialImageId),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readSafeImageSource(value: unknown): string | undefined {
  const source = readString(value);
  if (!source) return undefined;
  return source.startsWith("/") || source.startsWith("https://") || source.startsWith("http://")
    ? source
    : undefined;
}
