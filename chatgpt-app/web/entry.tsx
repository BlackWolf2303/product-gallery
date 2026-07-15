import { createRoot } from "react-dom/client";
import {
  ChatGPTProductGallery,
  demoProductGalleryData,
} from "../../components/product-gallery";
import "./widget.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element for product gallery widget.");
}

createRoot(root).render(
  <ChatGPTProductGallery fallbackData={demoProductGalleryData} />,
);
