/**
 * Fit any image onto a 1600x1600 pure white square with natural padding.
 * Used after Picsart removes the background.
 * Server-only — relies on a WASM image library that runs in the worker runtime.
 */

const TARGET = 1600;
// Subject occupies ~71% of the canvas — matches existing hero crops on the site.
const SUBJECT_FRACTION = 0.71;

export async function squareWhite1600(input: Uint8Array): Promise<Uint8Array> {
  const photon = await import("@cf-wasm/photon");
  const { PhotonImage, resize, SamplingFilter, padding_left, padding_right, padding_top, padding_bottom, Rgba } = photon;

  const src = PhotonImage.new_from_byteslice(input);
  const w0 = src.get_width();
  const h0 = src.get_height();
  const maxDim = Math.max(w0, h0);
  const scale = (TARGET * SUBJECT_FRACTION) / maxDim;
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const resized = resize(src, w, h, SamplingFilter.Lanczos3);
  src.free();

  const white = new Rgba(255, 255, 255, 255);
  let canvas = resized;

  const padLeft = Math.floor((TARGET - w) / 2);
  const padRight = TARGET - w - padLeft;
  const padTop = Math.floor((TARGET - h) / 2);
  const padBottom = TARGET - h - padTop;

  if (padLeft > 0) {
    const next = padding_left(canvas, padLeft, white);
    canvas.free();
    canvas = next;
  }
  if (padRight > 0) {
    const next = padding_right(canvas, padRight, white);
    canvas.free();
    canvas = next;
  }
  if (padTop > 0) {
    const next = padding_top(canvas, padTop, white);
    canvas.free();
    canvas = next;
  }
  if (padBottom > 0) {
    const next = padding_bottom(canvas, padBottom, white);
    canvas.free();
    canvas = next;
  }

  const out = canvas.get_bytes_jpeg(90);
  canvas.free();
  return out;
}
