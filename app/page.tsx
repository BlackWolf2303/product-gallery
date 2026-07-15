import type { Metadata } from "next";
import {
  ChatGPTProductGallery,
  demoProductGalleryData,
} from "@/components/product-gallery";

export const metadata: Metadata = {
  title: "Atelier Gallery — Lilac Élan",
  description: "Interactive product gallery for the Lilac Élan leather handbag.",
};

export default function Home() {
  return <ChatGPTProductGallery fallbackData={demoProductGalleryData} />;
}
