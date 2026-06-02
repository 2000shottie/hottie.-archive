import bagBlack from "@/assets/p-bag-black.png";
import bagPink from "@/assets/p-bag-pink.png";
import bagWhite from "@/assets/p-bag-white.png";
import sun1 from "@/assets/p-sunglasses.png";
import sun2 from "@/assets/p-sunglasses-2.png";
import heels from "@/assets/p-heels.png";
import necklace from "@/assets/p-necklace.png";
import balCity from "@/assets/p-balenciaga-city.png";

export type Product = {
  id: string;
  name: string;
  house: string;
  price: number;
  img: string;
  tag?: string;
  swatch: string;
  description?: string;
};

export const products: Product[] = [
  { id: "bal-city", name: "City Moto Bag — Burgundy", house: "Balenciaga", price: 800, img: balCity, tag: "Just In", swatch: "oklch(0.88 0.05 18)", description: "Iconic distressed burgundy leather City bag. Slouchy moto silhouette with signature studs and mirror. A true archive piece." },
  { id: "1", name: "Quilted Mini Shoulder", house: "Maison BLNCGA", price: 1480, img: bagBlack, swatch: "oklch(0.92 0.045 12)" },
  { id: "2", name: "Cat-Eye Acetate Frames", house: "Saint Lila", price: 320, img: sun1, swatch: "oklch(0.86 0.005 250)" },
  { id: "3", name: "Powder Top-Handle Mini", house: "Roma Atelier", price: 1240, img: bagPink, tag: "Archive", swatch: "oklch(0.92 0.045 12)" },
  { id: "4", name: "Chrome Stiletto 95", house: "Vega Studio", price: 690, img: heels, swatch: "oklch(0.95 0.012 20)" },
  { id: "5", name: "Heavy Curb Choker", house: "Atelier Onze", price: 280, img: necklace, swatch: "oklch(0.86 0.005 250)" },
  { id: "6", name: "Ivory Raffia Micro", house: "Côte Maison", price: 560, img: bagWhite, tag: "New", swatch: "oklch(0.95 0.012 20)" },
  { id: "7", name: "Tortoise Rectangle Frames", house: "Saint Lila", price: 360, img: sun2, swatch: "oklch(0.92 0.045 12)" },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
