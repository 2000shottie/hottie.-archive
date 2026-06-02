import bagBlack from "@/assets/p-bag-black.png";
import bagPink from "@/assets/p-bag-pink.png";
import bagWhite from "@/assets/p-bag-white.png";
import sun1 from "@/assets/p-sunglasses.png";
import sun2 from "@/assets/p-sunglasses-2.png";
import heels from "@/assets/p-heels.png";
import necklace from "@/assets/p-necklace.png";
import dgMissCharles from "@/assets/p-dg-miss-charles.png";

export type Product = {
  id: string;
  name: string;
  house: string;
  price: number;
  img: string;
  tag?: string;
  swatch: string;
  description?: string;
  /** Source listing URL on Vestiaire Collective. When present, stock is polled
   *  automatically and the product flips to "Sold out" when it goes off-market. */
  vestiaireUrl?: string;
};

export const products: Product[] = [
  {
    id: "dg-miss-charles",
    name: "Miss Charles Leather Handbag — Black",
    house: "Dolce & Gabbana",
    price: 570,
    img: dgMissCharles,
    tag: "Just In",
    swatch: "oklch(0.86 0.005 250)",
    description:
      "Dolce & Gabbana Miss Charles top-handle in black leather. Structured silhouette, gold hardware, very good vintage condition. One of one — once it's gone, it's gone.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/dolce-gabbana/black-leather-miss-charles-dolce-gabbana-handbag-66869227.shtml",
  },
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
