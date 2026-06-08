/**
 * Product import server functions.
 *
 * `startImport` kicks off the full pipeline for a single Vestiaire URL:
 *   scrape → clean each image via Picsart → resize to 1600x1600 white square →
 *   upload to storage → create a draft `products` row + `product_images` rows.
 *
 * Status is written to `import_jobs` as we go so the admin UI can poll it
 * and show "Importing → Cleaning images → Creating listing → Ready".
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminToken } from "@/lib/admin-auth";

const MAX_IMAGES = 6;

const StartInput = z.object({ url: z.string().url().max(2000) });
const JobIdInput = z.object({ jobId: z.string().uuid() });
const PublishInput = z.object({ productId: z.string().uuid() });

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function categoryFor(brand: string, title: string): string {
  const t = `${title} ${brand}`.toLowerCase();
  if (/(bag|hobo|tote|clutch|pouch|satchel|bowler|crossbody)/.test(t)) return "bags";
  if (/(sandal|heel|pump|boot|sneaker|loafer|shoe|mule)/.test(t)) return "shoes";
  if (/(sunglass|eyewear|shield)/.test(t)) return "eyewear";
  if (/(necklace|bracelet|ring|earring|jewel)/.test(t)) return "jewelry";
  if (/(skirt|trouser|jean|pant|short)/.test(t)) return "bottoms";
  if (/(tee|top|shirt|blouse|cami|tank|knit|sweater|cardigan|jacket|coat)/.test(t)) return "tops";
  return "tops";
}

export const startImport = createServerFn({ method: "POST" })
  .middleware([requireAdminToken])
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job, error } = await supabaseAdmin
      .from("import_jobs")
      .insert({
        source_url: data.url,
        status: "queued",
        step_label: "Importing product",
      })
      .select()
      .single();
    if (error || !job) throw new Error(`job_create_failed: ${error?.message}`);

    // Run the pipeline; if anything throws, mark the job failed.
    runPipeline(job.id, data.url).catch(async (err) => {
      const message = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from("import_jobs")
        .update({ status: "failed", error: message, step_label: `Failed: ${message}` })
        .eq("id", job.id);
    });

    return { jobId: job.id as string };
  });

export const getImportJob = createServerFn({ method: "GET" })
  .middleware([requireAdminToken])
  .inputValidator((input: unknown) => JobIdInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: job } = await supabaseAdmin
      .from("import_jobs")
      .select("*")
      .eq("id", data.jobId)
      .maybeSingle();
    if (!job) return null;

    let product: any = null;
    let images: any[] = [];
    if (job.product_id) {
      const [{ data: p }, { data: imgs }] = await Promise.all([
        supabaseAdmin.from("products").select("*").eq("id", job.product_id).maybeSingle(),
        supabaseAdmin
          .from("product_images")
          .select("*")
          .eq("product_id", job.product_id)
          .order("position"),
      ]);
      product = p;
      images = imgs ?? [];
    }
    return { job, product, images };
  });

export const publishProduct = createServerFn({ method: "POST" })
  .middleware([requireAdminToken])
  .inputValidator((input: unknown) => PublishInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ status: "published" })
      .eq("id", data.productId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveProduct = createServerFn({ method: "POST" })
  .middleware([requireAdminToken])
  .inputValidator((input: unknown) => PublishInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ status: "archived" })
      .eq("id", data.productId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listDraftProducts = createServerFn({ method: "GET" })
  .middleware([requireAdminToken])
  .handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("status", "draft")
    .order("created_at", { ascending: false });
  if (!products?.length) return [];
  const ids = products.map((p) => p.id);
  const { data: imgs } = await supabaseAdmin
    .from("product_images")
    .select("*")
    .in("product_id", ids)
    .order("position");
  return products.map((p) => ({ ...p, images: (imgs ?? []).filter((i) => i.product_id === p.id) }));
});

// ───────────────────────────────────────────────────────────────────────────
// Pipeline (fire-and-forget from startImport)
// ───────────────────────────────────────────────────────────────────────────

async function runPipeline(jobId: string, url: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { scrapeVestiaireProduct } = await import("./vestiaire-scraper.server");
  const { removeBgWhite } = await import("./picsart.server");
  const { squareWhite1600 } = await import("./image-square.server");
  const { uploadBytes, uploadFromUrl } = await import("./storage.server");

  // 1. Scrape
  await supabaseAdmin
    .from("import_jobs")
    .update({ status: "scraping", step_label: "Importing product", progress_current: 0, progress_total: 0 })
    .eq("id", jobId);

  const scraped = await scrapeVestiaireProduct(url);
  const images = scraped.images.slice(0, MAX_IMAGES);

  // 2. Create draft product (so we can attach images one by one)
  const baseSlug = slugify(`${scraped.brand}-${scraped.title}`) || `import-${Date.now()}`;
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: product, error: pErr } = await supabaseAdmin
    .from("products")
    .insert({
      slug,
      name: scraped.title,
      house: scraped.brand,
      price: scraped.price,
      currency: scraped.currency.toLowerCase(),
      description: scraped.description,
      category: categoryFor(scraped.brand, scraped.title),
      size: scraped.size ?? null,
      condition: scraped.condition ?? null,
      seller_country: scraped.sellerCountry ?? null,
      vestiaire_url: url,
      vestiaire_id: scraped.vestiaireId ?? null,
      status: "draft",
    })
    .select()
    .single();
  if (pErr || !product) throw new Error(`product_insert_${pErr?.message}`);

  await supabaseAdmin
    .from("import_jobs")
    .update({
      product_id: product.id,
      status: "cleaning_images",
      step_label: "Cleaning images",
      progress_total: images.length,
      progress_current: 0,
    })
    .eq("id", jobId);

  // 3. Process every image (with per-image error handling — never break the flow)
  let needsReview = false;
  for (let i = 0; i < images.length; i++) {
    const original = images[i];
    const safeBase = `${product.id}/${i.toString().padStart(2, "0")}`;

    // Always back up the original first
    let originalPath: string | null = null;
    try {
      const ext = original.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase() ?? "jpg";
      const backup = await uploadFromUrl(`${safeBase}-original.${ext}`, original);
      originalPath = backup.path;
    } catch {
      // Backup failed — non-fatal, we still try to process
    }

    let processedUrl: string;
    let imgNeedsReview = false;

    try {
      const result = await removeBgWhite(original);
      if (!result.ok) throw new Error(result.error);
      const squared = await squareWhite1600(result.bytes);
      const up = await uploadBytes(`${safeBase}-clean.jpg`, squared, "image/jpeg");
      processedUrl = up.url;
    } catch {
      // Picsart (or compositing) failed even after retry — fall back to original
      imgNeedsReview = true;
      needsReview = true;
      try {
        const fb = await uploadFromUrl(`${safeBase}-fallback.jpg`, original);
        processedUrl = fb.url;
      } catch {
        // Last resort: just reference the remote URL
        processedUrl = original;
      }
    }

    await supabaseAdmin.from("product_images").insert({
      product_id: product.id,
      position: i,
      processed_url: processedUrl,
      original_url: original,
      original_storage_path: originalPath,
      needs_review: imgNeedsReview,
    });

    await supabaseAdmin
      .from("import_jobs")
      .update({ progress_current: i + 1 })
      .eq("id", jobId);
  }

  // 4. Finalize
  await supabaseAdmin
    .from("products")
    .update({ needs_image_review: needsReview })
    .eq("id", product.id);

  await supabaseAdmin
    .from("import_jobs")
    .update({ status: "ready", step_label: "Ready to publish" })
    .eq("id", jobId);
}
