"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ProductGalleryImage, ProductGalleryProps } from "./types";
import styles from "./product-gallery.module.css";

export function ProductGallery({
  data,
  selectedImageId,
  onSelectedImageChange,
  className,
}: ProductGalleryProps) {
  const firstImageId = data.initialImageId ?? data.images[0]?.id;
  const [internalImageId, setInternalImageId] = useState(firstImageId);
  const currentImageId = selectedImageId ?? internalImageId;

  useEffect(() => {
    if (!data.images.some((image) => image.id === currentImageId)) {
      setInternalImageId(firstImageId);
    }
  }, [currentImageId, data.images, firstImageId]);

  const activeIndex = useMemo(() => {
    const index = data.images.findIndex((image) => image.id === currentImageId);
    return index >= 0 ? index : 0;
  }, [currentImageId, data.images]);

  const activeImage = data.images[activeIndex];

  const selectImage = useCallback((image: ProductGalleryImage) => {
    if (selectedImageId === undefined) setInternalImageId(image.id);
    onSelectedImageChange?.(image);
  }, [onSelectedImageChange, selectedImageId]);

  const selectRelative = useCallback((delta: number) => {
    const nextIndex = (activeIndex + delta + data.images.length) % data.images.length;
    selectImage(data.images[nextIndex]);
  }, [activeIndex, data.images, selectImage]);

  if (!activeImage) return null;

  return (
    <main className={`${styles.galleryShell}${className ? ` ${className}` : ""}`}>
      <section className={styles.gallery} aria-label="Bộ sưu tập ảnh sản phẩm">
        <div className={styles.galleryHeading}>
          <p className={styles.eyebrow}>{data.product.eyebrow}</p>
          <h1>{data.product.name}</h1>
          <p className={styles.material}>{data.product.material}</p>
        </div>

        <div className={styles.heroFrame}>
          <div
            className={`${styles.productImage} ${styles.heroImage}`}
            style={imageStyle(activeImage)}
            role="img"
            aria-label={activeImage.alt ?? `${data.product.name} — ${activeImage.label}`}
          />
          <div className={styles.heroShade} aria-hidden="true" />

          <div className={styles.imageMeta} aria-live="polite">
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
            <span className={styles.imageMetaRule} />
            <span>{String(data.images.length).padStart(2, "0")}</span>
          </div>

          <div className={styles.heroActions}>
            <button className={`${styles.pillButton} ${styles.pillButtonLight}`} type="button" onClick={() => selectRelative(1)}>
              Xem chi tiết <span aria-hidden="true">↗</span>
            </button>
            <button className={styles.roundButton} type="button" onClick={() => selectRelative(1)} aria-label="Ảnh kế tiếp">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <aside className={styles.thumbnailRail} aria-label="Chọn ảnh sản phẩm">
          <div className={styles.thumbnailRailTop}>
            <span>Gallery</span>
            <span>{data.images.length} ảnh</span>
          </div>
          <div className={styles.thumbnailScroll}>
            {data.images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className={`${styles.thumbnail} ${activeIndex === index ? styles.thumbnailActive : ""}`}
                onClick={() => selectImage(image)}
                aria-label={`Hiển thị ảnh: ${image.label}`}
                aria-pressed={activeIndex === index}
              >
                <span className={`${styles.productImage} ${styles.thumbnailImage}`} style={imageStyle(image)} aria-hidden="true" />
                <span className={styles.thumbnailNumber}>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function imageStyle(image: ProductGalleryImage): CSSProperties {
  return {
    backgroundImage: `url(${JSON.stringify(image.src)})`,
    backgroundPosition: image.backgroundPosition ?? "center",
    backgroundSize: image.backgroundSize ?? "cover",
  };
}
