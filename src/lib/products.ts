import lvIdylle from "@/assets/p-lv-idylle.png";
import diorWhiteTop from "@/assets/p-dior-white-top.png";
import gucciGreenSun from "@/assets/p-gucci-green-sun.png";
import pradaSandals from "@/assets/p-prada-sandals.png";
import dgBrownTop from "@/assets/p-dg-brown-top.png";
import vwBrownBag from "@/assets/p-vw-brown-bag.png";

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

export const products: Product[] = [
  {
    id: "lv-idylle-beige-denim",
    name: "Idylle Denim Handbag",
    house: "Louis Vuitton",
    price: 750,
    img: lvIdylle,
    swatch: "#e8dcc4",
    category: "bags",
    tag: "New In",
    description:
      "Beige denim Idylle handbag with monogram weave and tan leather trim. A soft, archival LV silhouette.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/louis-vuitton/beige-denim-jeans-idylle-louis-vuitton-handbag-64583267.shtml",
  },
  {
    id: "vw-brown-orb-bag",
    name: "Orb Top-Handle Bag",
    house: "Vivienne Westwood",
    price: 780,
    img: vwBrownBag,
    swatch: "#d6b89a",
    category: "bags",
    description:
      "Tan vegan-leather top-handle bag with signature gold orb. Structured, ladylike, unmistakably Westwood.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/vivienne-westwood/brown-vegan-leather-vivienne-westwood-handbag-66949891.shtml",
  },
  {
    id: "dior-white-cotton-top",
    name: "Tailored Cotton Top",
    house: "Dior",
    price: 450,
    img: diorWhiteTop,
    swatch: "#f4f1ec",
    category: "tops",
    description:
      "Crisp white cotton top, sculpted at the waist. Quiet luxury, perfect under tailoring or denim.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-clothing/tops/dior/white-cotton-dior-top-67466994.shtml",
  },
  {
    id: "dg-brown-silk-top",
    name: "Liquid Cami Top",
    house: "Dolce & Gabbana",
    price: 410,
    img: dgBrownTop,
    swatch: "#c89a76",
    category: "tops",
    tag: "2000s",
    description:
      "Chocolate brown polyamide cami with that perfect 2000s sheen. Spaghetti straps, soft drape.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-clothing/tops/dolce-gabbana/brown-polyamide-dolce-gabbana-top-67070568.shtml",
  },
  {
    id: "prada-soft-sandals-black",
    name: "Soft Crossed Sandals",
    house: "Prada",
    price: 450,
    img: pradaSandals,
    swatch: "#e9e9ec",
    category: "shoes",
    description:
      "Black padded leather slides with crossed straps and the triangle logo plaque. Quietly cool.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-shoes/sandals/prada/black-leather-soft-prada-sandals-67472977.shtml",
  },
  {
    id: "gucci-green-oversized-sun",
    name: "Oversized Square Sunglasses",
    house: "Gucci",
    price: 580,
    img: gucciGreenSun,
    swatch: "#c8e0c0",
    category: "eyewear",
    tag: "Rare",
    description:
      "Translucent jade-green oversized square frames with gold GG hardware. Pure Y2K it-girl energy.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-accessories/sunglasses/gucci/green-plastic-gucci-sunglasses-67258298.shtml",
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
