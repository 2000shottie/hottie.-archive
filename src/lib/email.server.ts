// Server-only helper to send transactional emails via Resend (gateway).
// Never import this file from client code.

import { getProduct } from "@/lib/products";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

// Customer emails must use a Resend-verified domain sender.
// Resend's onboarding sender only delivers to the Resend account owner.
const FROM_EMAIL = "orders@2000shottie.com";
const FROM = `2000shottie <${FROM_EMAIL}>`;
const REPLY_TO = "a2000shottie@hotmail.com";

type ShippingAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
} | null;

type OrderEmailInput = {
  to: string;
  customerName?: string | null;
  productIds: string[];
  quantities?: Record<string, number>;
  amountTotalCents: number | null;
  currency: string;
  shippingAddress?: ShippingAddress;
  sessionId: string;
};

function fmtMoney(cents: number | null, currency: string) {
  if (cents == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function resolveItems(productIds: string[], quantities?: Record<string, number>) {
  const uniqueIds = Array.from(new Set(productIds));
  return uniqueIds
    .map((id) => {
      const p = getProduct(id);
      const qty = quantities?.[id] ?? productIds.filter((x) => x === id).length;
      return p ? { p, qty } : null;
    })
    .filter((r): r is { p: NonNullable<ReturnType<typeof getProduct>>; qty: number } => Boolean(r));
}

function renderHtml(input: OrderEmailInput) {
  const items = resolveItems(input.productIds, input.quantities);

  const itemsHtml = items
    .map(
      ({ p, qty }) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;font-family:Georgia,serif;font-size:15px;color:#111;">
            ${p.house ? `<div style="color:#666;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">${p.house}</div>` : ""}
            <div>${p.name}</div>
            <div style="color:#888;font-size:12px;">Qty: ${qty}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-family:Georgia,serif;font-size:15px;color:#111;">
            $${(p.price * qty).toLocaleString()}
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
          <div style="font-family:Georgia,serif;font-size:13px;color:#888;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:28px;">Thank you for your order</div>

          <p style="font-family:Georgia,serif;font-size:15px;color:#111;line-height:1.6;">${hello}</p>
          <p style="font-family:Georgia,serif;font-size:15px;color:#111;line-height:1.6;">
            Thank you for your order — we're so glad it's going to a good home. Here's your order summary.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            ${itemsHtml}
            ${
              total
                ? `<tr><td style="padding:14px 0 0 0;font-family:Georgia,serif;font-size:15px;color:#111;">Order total</td>
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

          <div style="margin-top:28px;padding:18px 20px;background:#fafaf7;border:1px solid #eee;font-family:Georgia,serif;font-size:14px;color:#111;line-height:1.6;">
            <strong>Estimated delivery:</strong> 3–4 weeks.<br/>
            <strong>Customs duties &amp; taxes are already covered</strong> — nothing extra to pay on delivery.
          </div>

          <p style="font-family:Georgia,serif;font-size:13px;color:#888;line-height:1.6;margin-top:36px;">
            Questions about your order? Email <a href="mailto:a2000shottie@hotmail.com" style="color:#888;">a2000shottie@hotmail.com</a>.<br/>
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
    throw new Error("Email skipped: missing LOVABLE_API_KEY or RESEND_API_KEY");
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
      subject: "Thank you for your 2000shottie order",
      html: renderHtml(input),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend order confirmation failed: ${res.status} ${text}`);
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
    throw new Error("Email skipped: missing LOVABLE_API_KEY or RESEND_API_KEY");
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
    throw new Error(`Resend shipped email failed: ${res.status} ${text}`);
  }
}

// ---------- Admin "new order" notification ----------

const ADMIN_NOTIFY_TO = "a2000shottie@hotmail.com";
const ADMIN_FROM = `2000shottie Orders <${FROM_EMAIL}>`;

type AdminOrderInput = {
  productIds: string[];
  quantities?: Record<string, number>;
  amountTotalCents: number | null;
  currency: string;
  buyerEmail: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
  shippingAddress?: ShippingAddress;
  sessionId: string;
  paymentIntentId?: string | null;
  orderDate?: string | null;
};

function renderAdminHtml(input: AdminOrderInput) {
  const items = resolveItems(input.productIds, input.quantities);

  const itemsHtml = items
    .map(
      ({ p, qty }) =>
        `<li style="font-family:Georgia,serif;font-size:14px;color:#111;margin:4px 0;">
          <strong>${p.house ?? ""}</strong> — ${p.name} · Qty ${qty} · $${p.price.toLocaleString()} ea · Line $${(p.price * qty).toLocaleString()}
        </li>`,
    )
    .join("");

  const addr = input.shippingAddress;
  const addrHtml = addr
    ? `${[addr.line1, addr.line2].filter(Boolean).join(", ")}<br/>
       ${[addr.city, addr.state, addr.postal_code].filter(Boolean).join(" ")}<br/>
       ${addr.country ?? ""}`
    : "—";

  const total = fmtMoney(input.amountTotalCents, input.currency);
  const when = input.orderDate ? new Date(input.orderDate).toUTCString() : new Date().toUTCString();

  return `<!doctype html><html><body style="font-family:Georgia,serif;color:#111;padding:24px;background:#fafaf7;">
    <h2 style="margin:0 0 16px 0;">🛍️ New order on 2000shottie</h2>
    <p style="margin:0 0 6px 0;"><strong>Total:</strong> ${total || "—"}</p>
    <p style="margin:0 0 6px 0;"><strong>Order date:</strong> ${when}</p>
    <p style="margin:16px 0 4px 0;"><strong>Customer:</strong></p>
    <p style="margin:0;font-size:14px;line-height:1.6;">
      ${input.buyerName ?? "—"}<br/>
      ${input.buyerEmail}<br/>
      ${input.buyerPhone ?? "(no phone)"}
    </p>
    <p style="margin:16px 0 4px 0;"><strong>Items:</strong></p>
    <ul style="padding-left:20px;margin:0;">${itemsHtml || "<li>(no items resolved)</li>"}</ul>
    <p style="margin:16px 0 4px 0;"><strong>Ship to:</strong></p>
    <p style="margin:0;font-size:14px;line-height:1.5;">${addrHtml}</p>
    <p style="margin:20px 0 0 0;font-size:12px;color:#888;">
      Stripe session: ${input.sessionId}<br/>
      ${input.paymentIntentId ? `Stripe payment: ${input.paymentIntentId}` : ""}
    </p>
  </body></html>`;
}

export async function sendAdminOrderNotification(input: AdminOrderInput) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    throw new Error("Admin email skipped: missing LOVABLE_API_KEY or RESEND_API_KEY");
  }

  const total = fmtMoney(input.amountTotalCents, input.currency);
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: ADMIN_FROM,
      to: [ADMIN_NOTIFY_TO],
      reply_to: input.buyerEmail,
      subject: `🛍️ New order ${total ? `(${total})` : ""} — ${input.buyerEmail}`,
      html: renderAdminHtml(input),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Admin notification send failed: ${res.status} ${text}`);
  }
}
