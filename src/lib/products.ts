import lvIdylle from "@/assets/p-lv-idylle.png";
import lvIdylle2 from "@/assets/p-lv-idylle-2.png";
import lvIdylle3 from "@/assets/p-lv-idylle-3.png";
import lvIdylle4 from "@/assets/p-lv-idylle-4.png";
import lvIdylle5 from "@/assets/p-lv-idylle-5.png";
import lvIdylle6 from "@/assets/p-lv-idylle-6.png";
import diorTigerTee from "@/assets/diorfinal.png.jpeg";
import diorTigerTee2 from "@/assets/newdior2.jpeg";
import diorTigerTee3 from "@/assets/newdior3.jpeg";
import gucciGreenSun from "@/assets/p-gucci-green-sun.png";
import gucciGreenSun2 from "@/assets/p-gucci-green-sun-2.png";
import gucciGreenSun3 from "@/assets/p-gucci-green-sun-3.png";
import pradaSandals from "@/assets/p-prada-sandals.png";
import pradaSandals2 from "@/assets/p-prada-sandals-2.png";
import pradaSandals3 from "@/assets/p-prada-sandals-3.png";
import dgTigerTop from "@/assets/p-dg-brown-top.png";
import dgTigerTop2 from "@/assets/p-dg-brown-top-2.png";
import dgTigerTop3 from "@/assets/p-dg-brown-top-3.png";
import vwTartanBag from "@/assets/p-vw-brown-bag-square.jpg";
import vwTartanBag2 from "@/assets/p-vw-brown-bag-square-2.png";
import vwTartanBag3 from "@/assets/p-vw-brown-bag-square-3.png";
import vwTartanBag4 from "@/assets/p-vw-brown-bag-square-4.png";
import vwTartanBag5 from "@/assets/p-vw-brown-bag-square-5.png";

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
  /** Extra photos shown as a gallery on the product page. */
  gallery?: string[];
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
    details: [
      { label: "Size", value: "Mini · one size" },
      { label: "Measurements", value: "W 36cm · H 26cm (approx.)" },
      { label: "Material", value: "Mini Lin denim · vachetta leather trim" },
      { label: "Colour", value: "Dusty grey-blue / tan" },
      { label: "Hardware", value: "Gold-tone" },
      { label: "Condition", value: "Very good · pre-loved" },
    ],
    gallery: [lvIdylle2, lvIdylle3, lvIdylle4, lvIdylle5, lvIdylle6],
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
    details: [
      { label: "Size", value: "Mini · one size" },
      { label: "Measurements", value: "W 20cm · H 20cm · D 20cm (approx.)" },
      { label: "Material", value: "Vegan leather · tartan canvas" },
      { label: "Colour", value: "Brown / red tartan" },
      { label: "Hardware", value: "Silver-tone orb" },
      { label: "Condition", value: "Very good · pre-loved" },
    ],
    gallery: [vwTartanBag2, vwTartanBag3, vwTartanBag4, vwTartanBag5],
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
    details: [
      { label: "Size", value: "M · International" },
      { label: "Fit", value: "Regular · crew neck · short sleeve" },
      { label: "Material", value: "100% cotton" },
      { label: "Colour", value: "Ivory white" },
      { label: "Condition", value: "Very good · pre-loved" },
    ],
    gallery: [diorTigerTee2, diorTigerTee3],
    vestiaireUrl: "https://www.vestiairecollective.com/women-clothing/tops/dior/white-cotton-dior-top-67466994.shtml",
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
    description: "Slinky tiger-print stretch cami with thin straps and a deep scoop neck. Peak Y2K D&G.",
    details: [
      { label: "Size", value: "40 IT · S–M (fits UK 8 / US 4)" },
      { label: "Fit", value: "Slim · thin straps · scoop neck" },
      { label: "Material", value: "Stretch polyamide blend" },
      { label: "Colour", value: "Brown tiger print" },
      { label: "Condition", value: "Never worn · with tags" },
    ],
    gallery: [dgTigerTop2, dgTigerTop3],
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
    description: "Black satin and patent T-strap sandals on a tiny kitten heel. Prada Sport-era, impossibly chic.",
    details: [
      { label: "Size", value: "37 IT · UK 4 · US 6.5" },
      { label: "Heel", value: "~4 cm kitten" },
      { label: "Material", value: "Leather upper · leather sole" },
      { label: "Colour", value: "Black" },
      { label: "Condition", value: "Very good · minor scratches on heels" },
    ],
    gallery: [pradaSandals2, pradaSandals3],
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
    details: [
      { label: "Model", value: "GG 2164/S" },
      { label: "Size", value: "Oversized · one size" },
      { label: "Material", value: "Acetate frame · plastic lens" },
      { label: "Colour", value: "Marbled olive green / gold lettering" },
      { label: "Condition", value: "Very good · pre-loved" },
    ],
    gallery: [gucciGreenSun2, gucciGreenSun3],
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-accessories/sunglasses/gucci/green-plastic-gucci-sunglasses-67258298.shtml",
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
