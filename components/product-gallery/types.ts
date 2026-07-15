export type ProductGalleryImage = {
  id: string;
  label: string;
  src: string;
  alt?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
};

export type ProductGalleryData = {
  schemaVersion: 1;
  type: "product-gallery";
  product: {
    eyebrow: string;
    name: string;
    material: string;
  };
  images: ProductGalleryImage[];
  initialImageId?: string;
};

export type ProductGalleryProps = {
  data: ProductGalleryData;
  selectedImageId?: string;
  onSelectedImageChange?: (image: ProductGalleryImage) => void;
  className?: string;
};

export type ProductGalleryWidgetState = {
  modelContent: { selectedImageId: string } | null;
  privateContent: null;
  imageIds: string[];
};
