/**
 * Thin helpers for the `product-images` storage bucket.
 * Server-only.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "product-images";

export async function uploadBytes(
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ url: string; path: string }> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`storage_upload_${error.message}`);
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function uploadFromUrl(
  path: string,
  sourceUrl: string,
): Promise<{ url: string; path: string }> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`fetch_${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  return uploadBytes(path, bytes, contentType);
}
