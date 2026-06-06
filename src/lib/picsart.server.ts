/**
 * Picsart Remove Background wrapper.
 * Returns PNG bytes already composited onto a pure white #FFFFFF background.
 * Retries once on failure.
 * Server-only.
 */

const ENDPOINT = "https://api.picsart.io/tools/1.0/removebg";

export type RemoveBgResult =
  | { ok: true; bytes: Uint8Array; contentType: string }
  | { ok: false; error: string };

async function attempt(imageUrl: string, apiKey: string): Promise<RemoveBgResult> {
  const form = new FormData();
  form.append("image_url", imageUrl);
  form.append("output_type", "cutout");
  form.append("bg_color", "FFFFFF");      // pure white, NOT transparent
  form.append("format", "PNG");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "X-Picsart-API-Key": apiKey, accept: "application/json" },
      body: form,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `picsart_${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { data?: { url?: string } };
    const outUrl = json?.data?.url;
    if (!outUrl) return { ok: false, error: "picsart_no_url" };

    const dl = await fetch(outUrl);
    if (!dl.ok) return { ok: false, error: `picsart_download_${dl.status}` };
    const buf = new Uint8Array(await dl.arrayBuffer());
    return { ok: true, bytes: buf, contentType: dl.headers.get("content-type") ?? "image/png" };
  } catch (err) {
    const msg = err instanceof Error ? (err.name === "AbortError" ? "picsart_timeout" : err.message) : "picsart_unknown";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export async function removeBgWhite(imageUrl: string): Promise<RemoveBgResult> {
  const apiKey = process.env.PICSART_API_KEY;
  if (!apiKey) return { ok: false, error: "PICSART_API_KEY missing" };

  const first = await attempt(imageUrl, apiKey);
  if (first.ok) return first;

  // Retry once after a short pause
  await new Promise((r) => setTimeout(r, 1500));
  return attempt(imageUrl, apiKey);
}
