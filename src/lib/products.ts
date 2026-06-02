import bagBlack from "@/assets/p-bag-black.png";
import bagPink from "@/assets/p-bag-pink.png";
import bagWhite from "@/assets/p-bag-white.png";
import sun1 from "@/assets/p-sunglasses.png";
import sun2 from "@/assets/p-sunglasses-2.png";
import heels from "@/assets/p-heels.png";
import necklace from "@/assets/p-necklace.png";
import dgMissCharles from "@/assets/p-dg-miss-charles.png";

export type Category = "bags" | "tops" | "bottoms" | "shoes" | "jewelry" | "eyewear";

export const CATEGORY_LABELS: Record<Category, string> = {
  bags: "Bags",
  tops: "Tops",
  bottoms: "Bottoms",
  shoes: "Shoes",
  jewelry: "Jewelry",
  eyewear: "Eyewear",
};

export type Product = {
  id: string;
  name: string;
  house: string;
  price: number;
  img: string;
  tag?: string;
  swatch: string;
  category: Category;
  description?: string;
  /** Source listing URL on Vestiaire Collective. When present, stock is polled
   *  automatically and the product flips to "Sold out" when it goes off-market. */
  vestiaireUrl?: string;
};

export const products: Product[] = [];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
