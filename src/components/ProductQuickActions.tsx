import { useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";

/** Quick "Add to bag" + "Buy now" buttons for product cards in any grid.
 *  Always visible so customers can act from the scroll feed without opening
 *  the product page. Stops link navigation on click. */
export function ProductQuickActions({
  product,
  soldOut,
}: {
  product: Product;
  soldOut: boolean;
}) {
  const { add, lines } = useCart();
  const navigate = useNavigate();
  const inBag = lines.some((l) => l.product.id === product.id);

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onAdd = (e: MouseEvent) => {
    stop(e);
    if (soldOut) return;
    add(product);
  };

  const onBuy = (e: MouseEvent) => {
    stop(e);
    if (soldOut) return;
    if (!inBag) add(product);
    navigate({ to: "/checkout" });
  };

  if (soldOut) return null;

  return (
    <div className="mt-2 flex gap-1.5">
      <button
        type="button"
        onClick={onAdd}
        className="flex-1 rounded-full border border-foreground/15 bg-background px-2 py-1 text-[8px] tracking-luxe uppercase text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
      >
        {inBag ? "In bag ✓" : "Add to bag"}
      </button>
      <button
        type="button"
        onClick={onBuy}
        style={{ backgroundColor: "#dfacb1" }}
        className="flex-1 rounded-full px-2 py-1 text-[8px] tracking-luxe uppercase text-background transition-opacity hover:opacity-90"
      >
        Buy now
      </button>
    </div>
  );
}

