// Server-only helper to send transactional emails via Resend (gateway).
// Never import this file from client code.

import { getProduct } from "@/lib/products";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Send from the merchant's own verified domain on Resend.
const FROM = "2000shottie <orders@2000shottie.com>";
const REPLY_TO = "info@2000shottie.com";


type OrderEmailInput = {
  to: string;
  customerName?: string | null;
  productIds: string[];
  amountTotalCents: number | null;
  currency: string;
  shippingAddress?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
  sessionId: string;
};

function fmtMoney(cents: number | null, currency: string) {
  if (cents == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function renderHtml(input: OrderEmailInput) {
  const items = input.productIds
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p));

  const itemsHtml = items
    .map(
      (p) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;font-family:Georgia,serif;font-size:15px;color:#111;">
            ${p.house ? `<div style="color:#666;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">${p.house}</div>` : ""}
            <div>${p.name}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-family:Georgia,serif;font-size:15px;color:#111;">
            $${p.price.toLocaleString()}
          </td>
        </tr>`,
    )
    .join("");

  const addr = input.shippingAddress;
  const addrHtml = addr
    ? `<p style="font-family:Georgia,serif;font-size:14px;color:#333;line-height:1.6;margin:0;">
        ${[addr.line1, addr.line2].filter(Boolean).join("<br/>")}<br/>
        ${[addr.city, addr.state, addr.postal_code].filter(Boolean).join(" ")}<br/>
        ${addr.country ?? ""}
      </p>`
    : "";

  const total = fmtMoney(input.amountTotalCents, input.currency);
  const hello = input.customerName ? `Hi ${input.customerName.split(" ")[0]},` : "Hello,";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#fafaf7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px;border:1px solid #eee;">
        <tr><td>
          <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.06em;color:#111;margin-bottom:8px;">2000shottie</div>
          <div style="font-family:Georgia,serif;font-size:13px;color:#888;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:28px;">Order confirmed</div>

          <p style="font-family:Georgia,serif;font-size:15px;color:#111;line-height:1.6;">${hello}</p>
          <p style="font-family:Georgia,serif;font-size:15px;color:#111;line-height:1.6;">
            Thank you for your order. Each piece is hand-prepared and shipped within 2–3 business days. You'll receive tracking as soon as it leaves us.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            ${itemsHtml}
            ${
              total
                ? `<tr><td style="padding:14px 0 0 0;font-family:Georgia,serif;font-size:15px;color:#111;">Total (incl. shipping)</td>
                   <td style="padding:14px 0 0 0;font-family:Georgia,serif;font-size:15px;color:#111;text-align:right;"><strong>${total}</strong></td></tr>`
                : ""
            }
          </table>

          ${
            addrHtml
              ? `<div style="margin-top:24px;">
                  <div style="font-family:Georgia,serif;font-size:12px;color:#888;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;">Shipping to</div>
                  ${addrHtml}
                </div>`
              : ""
          }

          <p style="font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;margin-top:36px;">
            Questions? Just reply to this email — it goes straight to ${REPLY_TO}.<br/>
            Order ref: ${input.sessionId}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendOrderConfirmationEmail(input: OrderEmailInput) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.error("Email skipped: missing LOVABLE_API_KEY or RESEND_API_KEY");
    return;
  }

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: FROM,
      to: [input.to],
      reply_to: REPLY_TO,
      subject: "Your 2000shottie order is confirmed",
      html: renderHtml(input),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Resend send failed:", res.status, text);
  }
}

// ---------- Shipped / tracking email ----------

type ShippedEmailInput = {
  to: string;
  customerName?: string | null;
  productIds: string[];
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  sessionId: string;
};

function renderShippedHtml(input: ShippedEmailInput) {
  const items = input.productIds
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p));

  const itemsHtml = items
    .map(
      (p) => `
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-family:Georgia,serif;font-size:14px;color:#111;">
          ${p.house ? `<div style="color:#666;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">${p.house}</div>` : ""}
          ${p.name}
        </td></tr>`,
    )
    .join("");

  const hello = input.customerName ? `Hi ${input.customerName.split(" ")[0]},` : "Hello,";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#fafaf7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf7;padding:32px 0;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px;border:1px solid #eee;"><tr><td>
      <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.06em;color:#111;margin-bottom:8px;">2000shottie</div>
      <div style="font-family:Georgia,serif;font-size:13px;color:#888;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:28px;">Your order has shipped</div>

      <p style="font-family:Georgia,serif;font-size:15px;color:#111;line-height:1.6;">${hello}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#111;line-height:1.6;">
        Your order is on the way. Tracking details below.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">${itemsHtml}</table>

      <div style="margin:28px 0;padding:20px;background:#fafaf7;border:1px solid #eee;">
        <div style="font-family:Georgia,serif;font-size:12px;color:#888;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;">${input.carrier}</div>
        <div style="font-family:Georgia,serif;font-size:16px;color:#111;margin-bottom:14px;">Tracking #: ${input.trackingNumber}</div>
        <a href="${input.trackingUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-family:Georgia,serif;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;padding:12px 22px;">Track package</a>
      </div>

      <p style="font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;margin-top:36px;">
        Questions? Reply to this email — it goes to ${REPLY_TO}.<br/>
        Order ref: ${input.sessionId}
      </p>
    </td></tr></table>
  </td></tr></table>
</body></html>`;
}

export async function sendShippedEmail(input: ShippedEmailInput) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.error("Email skipped: missing LOVABLE_API_KEY or RESEND_API_KEY");
    return;
  }

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: FROM,
      to: [input.to],
      reply_to: REPLY_TO,
      subject: `Your 2000shottie order has shipped — ${input.carrier} ${input.trackingNumber}`,
      html: renderShippedHtml(input),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Resend shipped send failed:", res.status, text);
  }
}
