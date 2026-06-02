import lvIdylle from "@/assets/p-lv-idylle.png";
import diorTigerTee from "@/assets/p-dior-white-top.png";
import gucciGreenSun from "@/assets/p-gucci-green-sun.png";
import pradaSandals from "@/assets/p-prada-sandals.png";
import dgTigerTop from "@/assets/p-dg-brown-top.png";
import vwTartanBag from "@/assets/p-vw-brown-bag.png";

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
  /** Key spec lines shown on the product page (size, material, color, etc.). */
  details?: { label: string; value: string }[];
  /** Source listing URL on Vestiaire Collective. When present, stock is polled
   *  automatically and the product flips to "Sold out" when it goes off-market. */
  vestiaireUrl?: string;
};

export const products: Product[] = [
  {
    id: "lv-idylle-mini-lin",
    name: "Idylle Mini Lin Bowler",
    house: "Louis Vuitton",
    price: 750,
    img: lvIdylle,
    swatch: "#cbd1cd",
    category: "bags",
    tag: "Vintage",
    description:
      "Mini Lin monogram bowler in dusty grey-blue with tan vachetta handles and gold hardware. Quintessential early-2000s LV.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/louis-vuitton/beige-denim-jeans-idylle-louis-vuitton-handbag-64583267.shtml",
  },
  {
    id: "vw-tartan-yasmine-bag",
    name: "Tartan Yasmine Bag",
    house: "Vivienne Westwood",
    price: 780,
    img: vwTartanBag,
    swatch: "#caa78a",
    category: "bags",
    tag: "Archive",
    description:
      "Brown and red tartan top-handle bag with red leather trim, signature blue orb print and detachable strap. Pure Westwood archive energy.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/vivienne-westwood/brown-vegan-leather-vivienne-westwood-handbag-66949891.shtml",
  },
  {
    id: "dior-tiger-tee",
    name: "Tiger Print Tee",
    house: "Christian Dior",
    price: 450,
    img: diorTigerTee,
    swatch: "#f4f1ec",
    category: "tops",
    description:
      "Ivory cotton tee with the iconic Dior tiger sketch printed at the front. Soft, easy, instantly recognisable.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-clothing/tops/dior/white-cotton-dior-top-67466994.shtml",
  },
  {
    id: "dg-tiger-cami",
    name: "Tiger Print Cami",
    house: "Dolce & Gabbana",
    price: 410,
    img: dgTigerTop,
    swatch: "#e9d39a",
    category: "tops",
    tag: "2000s",
    description:
      "Slinky tiger-print stretch cami with thin straps and a deep scoop neck. Peak Y2K D&G.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-clothing/tops/dolce-gabbana/brown-polyamide-dolce-gabbana-top-67070568.shtml",
  },
  {
    id: "prada-t-strap-kitten",
    name: "T-Strap Kitten Sandals",
    house: "Prada",
    price: 450,
    img: pradaSandals,
    swatch: "#dadada",
    category: "shoes",
    description:
      "Black satin and patent T-strap sandals on a tiny kitten heel. Prada Sport-era, impossibly chic.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-shoes/sandals/prada/black-leather-soft-prada-sandals-67472977.shtml",
  },
  {
    id: "gucci-olive-shield-sun",
    name: "Olive Shield Sunglasses",
    house: "Gucci",
    price: 580,
    img: gucciGreenSun,
    swatch: "#cbc28c",
    category: "eyewear",
    tag: "Rare",
    description:
      "Oversized shield sunglasses in marbled olive-green acetate with subtle gold Gucci lettering. Big-aughts statement.",
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-accessories/sunglasses/gucci/green-plastic-gucci-sunglasses-67258298.shtml",
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
