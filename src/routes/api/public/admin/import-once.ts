import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * One-shot admin import helper. Runs the full Vestiaire scrape → clean →
 * upload → insert pipeline, then optionally overrides the price and
 * publishes. Gated by a shared bearer token (reuses the sandbox webhook
 * secret so we don't have to provision a new env var).
 */
const Body = z.object({
  url: z.string().url().max(2000),
  price: z.number().int().min(0).max(1_000_000).optional(),
  publish: z.boolean().optional().default(true),
});

export const Route = createFileRoute("/api/public/admin/import-once")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = process.env.PAYMENTS_SANDBOX_WEBHOOK_SECRET;
        if (!expected || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
        }
        const parsed = Body.safeParse(payload);
        if (!parsed.success) {
          return Response.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
        }
        const { url, price, publish } = parsed.data;

        try {
          const { startImport, getImportJob, publishProduct } = await import(
            "@/lib/import-product.functions"
          );

          const { jobId } = await startImport({ data: { url } });

          // Poll up to ~3 min for the pipeline to finish
          const deadline = Date.now() + 180_000;
          let final: any = null;
          while (Date.now() < deadline) {
            const snap = await getImportJob({ data: { jobId } });
            if (snap && (snap.job.status === "ready" || snap.job.status === "failed")) {
              final = snap;
              break;
            }
            await new Promise((r) => setTimeout(r, 2000));
          }

          if (!final) {
            return Response.json({ ok: false, error: "timeout", jobId }, { status: 504 });
          }
          if (final.job.status === "failed") {
            return Response.json({ ok: false, error: final.job.error, jobId }, { status: 500 });
          }

          const productId = final.product?.id;
          if (!productId) {
            return Response.json({ ok: false, error: "no_product", jobId }, { status: 500 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (typeof price === "number") {
            await supabaseAdmin.from("products").update({ price }).eq("id", productId);
          }
          if (publish) {
            await publishProduct({ data: { productId } });
          }

          return Response.json({ ok: true, jobId, productId });
        } catch (err) {
          const message = err instanceof Error ? err.message : "unknown";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
