import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AdminOrder = {
  id: string;
  stripeSessionId: string;
  buyerEmail: string;
  buyerName: string | null;
  productIds: string[];
  amountTotalCents: number | null;
  currency: string;
  shippingAddress: Record<string, string | null> | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  shippedEmailSentAt: string | null;
  createdAt: string;
};

// Carrier → tracking URL builder. Add more as needed.
function buildTrackingUrl(carrier: string, num: string): string {
  const n = encodeURIComponent(num);
  switch (carrier.toLowerCase()) {
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${n}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
    case "dhl":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${n}`;
    case "royal mail":
      return `https://www.royalmail.com/track-your-item#/tracking-results/${n}`;
    case "la poste":
      return `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`;
    default:
      // Universal fallback
      return `https://parcelsapp.com/en/tracking/${n}`;
  }
}

export const listOrders = createServerFn({ method: "GET" }).handler(async (): Promise<AdminOrder[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    stripeSessionId: r.stripe_session_id as string,
    buyerEmail: r.buyer_email as string,
    buyerName: (r.buyer_name as string | null) ?? null,
    productIds: (r.product_ids as string[]) ?? [],
    amountTotalCents: (r.amount_total_cents as number | null) ?? null,
    currency: (r.currency as string) ?? "usd",
    shippingAddress: (r.shipping_address as Record<string, string | null> | null) ?? null,
    carrier: (r.carrier as string | null) ?? null,
    trackingNumber: (r.tracking_number as string | null) ?? null,
    trackingUrl: (r.tracking_url as string | null) ?? null,
    shippedAt: (r.shipped_at as string | null) ?? null,
    shippedEmailSentAt: (r.shipped_email_sent_at as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
});

const sendSchema = z.object({
  orderId: z.string().uuid(),
  carrier: z.string().trim().min(1).max(40),
  trackingNumber: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9 \-]+$/),
});

export const sendTrackingEmail = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof sendSchema>) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendShippedEmail } = await import("@/lib/email.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");

    const trackingUrl = buildTrackingUrl(data.carrier, data.trackingNumber);
    const nowIso = new Date().toISOString();

    await sendShippedEmail({
      to: order.buyer_email as string,
      customerName: (order.buyer_name as string | null) ?? null,
      productIds: (order.product_ids as string[]) ?? [],
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      trackingUrl,
      sessionId: order.stripe_session_id as string,
    });

    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        carrier: data.carrier,
        tracking_number: data.trackingNumber,
        tracking_url: trackingUrl,
        shipped_at: (order.shipped_at as string | null) ?? nowIso,
        shipped_email_sent_at: nowIso,
      })
      .eq("id", data.orderId);
    if (updErr) throw new Error(updErr.message);

    return { ok: true as const, trackingUrl };
  });
