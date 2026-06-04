import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { markProductsSold } from "@/lib/sold.functions";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Order confirmed — HOTTIE." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const { lines, clear } = useCart();
  const markSold = useServerFn(markProductsSold);
  const queryClient = useQueryClient();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !session_id) return;
    done.current = true;
    const ids = lines.map((l) => l.product.id);
    (async () => {
      if (ids.length > 0) {
        try {
          await markSold({ data: { productIds: ids } });
          await queryClient.invalidateQueries({ queryKey: ["sold-products"] });
        } catch (e) {
          console.error("markProductsSold failed:", e);
        }
      }
      clear();
    })();
  }, [session_id, lines, markSold, clear, queryClient]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[700px] px-5 py-24 text-center">
        {session_id ? (
          <>
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Confirmed</p>
            <h1 className="mt-4 font-display text-5xl md:text-6xl">
              Thank you, <span className="font-script text-primary">babe</span>.
            </h1>
            <p className="mt-6 text-[14px] text-muted-foreground">
              Your order is in. We'll email you a confirmation shortly. Each piece is individually
              sourced — please allow 3–4 weeks for delivery.
            </p>
            <Link
              to="/"
              className="mt-10 inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background hover:bg-primary"
            >
              Keep browsing
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl">No order found.</h1>
            <Link
              to="/"
              className="mt-6 inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background hover:bg-primary"
            >
              Go home
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
