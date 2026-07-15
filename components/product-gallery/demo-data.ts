import type { ProductGalleryData } from "./types";

const sprite = "/gallery/lavender-bag-contact-sheet.png";

export const demoProductGalleryData: ProductGalleryData = {
  schemaVersion: 1,
  type: "product-gallery",
  product: {
    eyebrow: "Atelier No. 04",
    name: "Lilac Élan",
    material: "Da hạt mềm · Lilac",
  },
  initialImageId: "front",
  images: [
    { id: "front", label: "Mặt trước", src: sprite, backgroundPosition: "0% 0%", backgroundSize: "300% 200%" },
    { id: "side", label: "Góc nghiêng", src: sprite, backgroundPosition: "50% 0%", backgroundSize: "300% 200%" },
    { id: "clasp", label: "Chi tiết khoá", src: sprite, backgroundPosition: "100% 0%", backgroundSize: "300% 200%" },
    { id: "worn", label: "Khi đeo", src: sprite, backgroundPosition: "0% 100%", backgroundSize: "300% 200%" },
    { id: "inside", label: "Bên trong túi", src: sprite, backgroundPosition: "50% 100%", backgroundSize: "300% 200%" },
    { id: "back", label: "Mặt sau", src: sprite, backgroundPosition: "100% 100%", backgroundSize: "300% 200%" },
    { id: "stitching", label: "Chi tiết đường may", src: sprite, backgroundPosition: "4% 5%", backgroundSize: "360% 240%" },
    { id: "handle", label: "Chi tiết quai túi", src: sprite, backgroundPosition: "47% 3%", backgroundSize: "360% 240%" },
    { id: "leather", label: "Bề mặt da", src: sprite, backgroundPosition: "96% 7%", backgroundSize: "360% 240%" },
    { id: "styling", label: "Phối cùng trang phục", src: sprite, backgroundPosition: "3% 96%", backgroundSize: "360% 240%" },
  ],
};
