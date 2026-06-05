import { createFileRoute } from "@tanstack/react-router";

import { products } from "@/lib/products";
import { fetchVestiaireStockStatus } from "@/lib/stock.functions";

export const Route = createFileRoute("/api/public/hooks/sync-stock")({
  server: {
    handlers: {
      POST: async () => {
        const vestiaireProducts = products.filter((product) => product.vestiaireUrl);
        const soldProductIds: string[] = [];
        const checked = [];

        for (const product of vestiaireProducts) {
          const stock = await fetchVestiaireStockStatus(product.vestiaireUrl!);
          checked.push({ id: product.id, available: stock.available, reason: stock.reason });
          if (!stock.available) soldProductIds.push(product.id);
        }

        if (soldProductIds.length > 0) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const rows = soldProductIds.map((id) => ({ product_id: id }));
          const { error } = await supabaseAdmin
            .from("sold_products")
            .upsert(rows, { onConflict: "product_id" });

          if (error) {
            console.error("sync-stock sold_products upsert error:", error);
            return Response.json({ ok: false, error: "Could not update sold products" }, { status: 500 });
          }
        }

        return Response.json({ ok: true, checked, soldProductIds });
      },
    },
  },
});