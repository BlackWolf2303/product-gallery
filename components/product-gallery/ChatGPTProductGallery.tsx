"use client";

import { useEffect, useState } from "react";
import { persistSelectedImage, readPersistedImageId, useProductGalleryToolOutput } from "./chatgpt-bridge";
import { ProductGallery } from "./ProductGallery";
import type { ProductGalleryData, ProductGalleryImage } from "./types";

export function ChatGPTProductGallery({ fallbackData }: { fallbackData: ProductGalleryData }) {
  const data = useProductGalleryToolOutput(fallbackData);
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(
    data.initialImageId ?? data.images[0]?.id,
  );

  useEffect(() => {
    const persisted = readPersistedImageId();
    if (persisted && data.images.some((image) => image.id === persisted)) {
      setSelectedImageId(persisted);
      return;
    }

    if (!data.images.some((image) => image.id === selectedImageId)) {
      setSelectedImageId(data.initialImageId ?? data.images[0]?.id);
    }
  }, [data, selectedImageId]);

  const handleSelection = (image: ProductGalleryImage) => {
    setSelectedImageId(image.id);
    persistSelectedImage(image.id, image.label);
  };

  return (
    <ProductGallery
      data={data}
      selectedImageId={selectedImageId}
      onSelectedImageChange={handleSelection}
    />
  );
}
