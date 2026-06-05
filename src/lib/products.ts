import lvIdylle from "@/assets/p-lv-idylle.png";
import lvIdylle2 from "@/assets/p-lv-idylle-2.png";
import lvIdylle3 from "@/assets/p-lv-idylle-3.png";
import lvIdylle4 from "@/assets/p-lv-idylle-4.png";
import lvIdylle5 from "@/assets/p-lv-idylle-5.png";
import lvIdylle6 from "@/assets/p-lv-idylle-6.png";
import lvIdylle7 from "@/assets/p-lv-idylle-7.png";
import lvIdylle8 from "@/assets/p-lv-idylle-8.png";
import diorTigerTee from "@/assets/p-dior-white-top.png";
import diorTigerTee2 from "@/assets/p-dior-white-top-2.png";
import diorTigerTee3 from "@/assets/p-dior-white-top-3.png";
import diorTigerTee4 from "@/assets/p-dior-white-top-4.png";
import dgTigerCami from "@/assets/p-dg-tiger-cami.png";
import dgTigerCami2 from "@/assets/p-dg-tiger-cami-2.png";
import dgTigerCami3 from "@/assets/p-dg-tiger-cami-3.png";
import dgTigerCami4 from "@/assets/p-dg-tiger-cami-4.png";
import gucciGreenSun from "@/assets/p-gucci-green-sun.png";
import gucciGreenSun2 from "@/assets/p-gucci-green-sun-2.png";
import gucciGreenSun3 from "@/assets/p-gucci-green-sun-3.png";
import pradaSandals from "@/assets/p-prada-sandals.png";
import pradaSandals2 from "@/assets/p-prada-sandals-2.png";
import pradaSandals3 from "@/assets/p-prada-sandals-3.png";
import pradaSandals4 from "@/assets/p-prada-sandals-4.png";
import pradaSandals5 from "@/assets/p-prada-sandals-5.png";
import pradaSandals6 from "@/assets/p-prada-sandals-6.png";
import vwTartanBag from "@/assets/p-vw-brown-bag.png";
import vwTartanBag2 from "@/assets/p-vw-brown-bag-2.png";
import vwTartanBag3 from "@/assets/p-vw-brown-bag-3.png";
import vwTartanBag4 from "@/assets/p-vw-brown-bag-4.png";
import vwTartanBag6 from "@/assets/p-vw-brown-bag-6.png";
import vwTartanBag7 from "@/assets/p-vw-brown-bag-7.png";
import gucciAbbey from "@/assets/p-gucci-abbey.png";
import gucciAbbey2 from "@/assets/p-gucci-abbey-2.png";
import gucciAbbey3 from "@/assets/p-gucci-abbey-3.png";
import gucciAbbey4 from "@/assets/p-gucci-abbey-4.png";
import gucciAbbey5 from "@/assets/p-gucci-abbey-5.png";
import gucciAbbey6 from "@/assets/p-gucci-abbey-6.png";
import gucciAbbey7 from "@/assets/p-gucci-abbey-7.png";
import gucciAbbey8 from "@/assets/p-gucci-abbey-8.png";
import gucciAbbey9 from "@/assets/p-gucci-abbey-9.png";
import annCowl from "@/assets/p-ann-cowl.png";
import annCowl2 from "@/assets/p-ann-cowl-2.png";
import annCowl3 from "@/assets/p-ann-cowl-3.png";
import annCowl4 from "@/assets/p-ann-cowl-4.png";
import annCowl5 from "@/assets/p-ann-cowl-5.png";
import annCowl6 from "@/assets/p-ann-cowl-6.png";
import annCowl7 from "@/assets/p-ann-cowl-7.png";

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
  /** ISO date when the piece was listed on the site. */
  listedAt: string;

  // ────────────────────────────────────────────────────────────────────
  // ADMIN-ONLY. Never render any of these in customer-facing UI.
  // Used only by /admin/pricing to enforce the $150 minimum profit floor.
  // ────────────────────────────────────────────────────────────────────
  /** What this piece cost us (sourcing/supplier/Vestiaire). USD. */
  myCost?: number;
  /** Where the piece ships from (ISO-2). */
  originCountry?: string;
  /** Our internal outbound shipping estimate, USD. */
  estimatedShippingCost?: number;
  /** Our internal duties/taxes estimate at a typical destination, USD. */
  estimatedDutiesAndTaxes?: number;
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
    gallery: [lvIdylle2, lvIdylle3, lvIdylle4, lvIdylle5, lvIdylle6, lvIdylle7, lvIdylle8],
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/louis-vuitton/beige-denim-jeans-idylle-louis-vuitton-handbag-64583267.shtml",
    listedAt: "2024-01-15",
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
    gallery: [
      vwTartanBag2,
      vwTartanBag3,
      vwTartanBag4,
      vwTartanBag6,
      vwTartanBag7,
    ],
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/vivienne-westwood/brown-vegan-leather-vivienne-westwood-handbag-66949891.shtml",
    listedAt: "2024-04-01",
  },
  {
    id: "gucci-abbey-d-ring",
    name: "Abbey D-Ring GG Hobo",
    house: "Gucci",
    price: 980,
    img: gucciAbbey,
    swatch: "#c9a87a",
    category: "bags",
    tag: "Archive",
    description:
      "Classic Gucci Abbey hobo in beige/ebony GG canvas with rich brown leather trim and the signature gold D-ring. Slouchy, soft, instantly iconic.",
    details: [
      { label: "Size", value: "Medium · one size" },
      { label: "Material", value: "GG canvas · calfskin leather trim" },
      { label: "Colour", value: "Beige / ebony brown" },
      { label: "Hardware", value: "Gold-tone D-ring" },
      { label: "Origin", value: "Made in Italy" },
      { label: "Condition", value: "Very good · pre-loved" },
    ],
    gallery: [gucciAbbey2, gucciAbbey3, gucciAbbey4, gucciAbbey5, gucciAbbey6, gucciAbbey7, gucciAbbey8, gucciAbbey9],
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-bags/handbags/gucci/multicolour-cloth-abbey-gucci-handbag-67615661.shtml",
    listedAt: "2024-05-01",
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
    gallery: [diorTigerTee2, diorTigerTee3, diorTigerTee4],
    vestiaireUrl: "https://www.vestiairecollective.com/women-clothing/tops/dior/white-cotton-dior-top-67466994.shtml",
    listedAt: "2024-02-01",
  },
  {
    id: "ann-demeulemeester-cowl-top",
    name: "Asymmetric Cowl-Neck Top",
    house: "Ann Demeulemeester",
    price: 395,
    img: annCowl,
    swatch: "#1a1a1a",
    category: "tops",
    tag: "Archive",
    description:
      "Soft black lyocell-wool top with a draped asymmetric hem, sculptural snap-button funnel neck and a single trailing sash. Pure Ann — quiet, dark, architectural.",
    details: [
      { label: "Size", value: "38 FR · approx. S" },
      { label: "Fit", value: "Slim · long sleeve · asymmetric hem" },
      { label: "Material", value: "70% lyocell · 30% wool" },
      { label: "Colour", value: "Black" },
      { label: "Hardware", value: "Gunmetal snap buttons at neck" },
      { label: "Origin", value: "Made in Portugal" },
      { label: "Care", value: "Delicate handwash · cool iron reverse · no dryclean" },
      { label: "Condition", value: "Very good · pre-loved" },
    ],
    gallery: [annCowl2, annCowl3, annCowl4, annCowl5, annCowl6, annCowl7],
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-clothing/tops/ann-demeulemeester/black-wool-ann-demeulemeester-top-67634392.shtml",
    listedAt: "2024-05-15",
  },
  {
    id: "dg-tiger-cami",
    name: "Tiger Print Cami",
    house: "Dolce & Gabbana",
    price: 520,
    img: dgTigerCami,
    swatch: "#c9a35a",
    category: "tops",
    tag: "Vintage",
    description:
      "Y2K Dolce & Gabbana Underwear tiger-print cami with delicate criss-cross spaghetti straps. Pure early-aughts It-girl.",
    details: [
      { label: "Size", value: "II · approx. S" },
      { label: "Fit", value: "Slim · scoop neck · criss-cross back" },
      { label: "Material", value: "Stretch jersey" },
      { label: "Colour", value: "Tiger print · cream / black / gold" },
      { label: "Condition", value: "Very good · pre-loved" },
    ],
    gallery: [dgTigerCami2, dgTigerCami3, dgTigerCami4],
    listedAt: "2024-02-15",
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
    gallery: [pradaSandals2, pradaSandals3, pradaSandals4, pradaSandals5, pradaSandals6],
    vestiaireUrl:
      "https://www.vestiairecollective.com/women-shoes/sandals/prada/black-leather-soft-prada-sandals-67472977.shtml",
    listedAt: "2024-03-15",
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
    listedAt: "2024-03-01",
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
