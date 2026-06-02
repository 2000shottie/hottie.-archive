import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useStock } from "@/lib/useStock";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — HOTTIE." },
      { name: "description", content: "Secure checkout." },
    ],
  }),
  component: CheckoutPage,
});

const checkoutSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  phone: z.string().trim().min(5, "Enter a valid phone").max(30),
  address: z.string().trim().min(3, "Required").max(200),
  apt: z.string().trim().max(60).optional(),
  city: z.string().trim().min(1, "Required").max(80),
  state: z.string().trim().min(1, "Required").max(80),
  zip: z.string().trim().min(2, "Required").max(20),
  country: z.string().trim().min(2, "Required").max(60),
  cardName: z.string().trim().min(1, "Required").max(80),
  cardNumber: z.string().trim().regex(/^[0-9 ]{12,23}$/, "Enter a valid card number"),
  cardExp: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/YY"),
  cardCvc: z.string().trim().regex(/^\d{3,4}$/, "3–4 digits"),
});

type FormState = Record<keyof z.infer<typeof checkoutSchema>, string>;

function CheckoutPage() {
  const { lines, subtotal, clear, count } = useCart();
  const navigate = useNavigate();
  const shipping = subtotal > 0 ? 15 : 0;
  const total = subtotal + shipping;
  const [availableIds, setAvailableIds] = useState<Record<string, boolean>>({});
  const checkoutBlocked = useMemo(
    () => lines.some(({ product }) => !!product.vestiaireUrl && availableIds[product.id] !== true),
    [availableIds, lines],
  );
  const reportAvailability = (id: string, available: boolean) =>
    setAvailableIds((prev) => (prev[id] === available ? prev : { ...prev, [id]: available }));

  const [form, setForm] = useState<FormState>({
    email: "", firstName: "", lastName: "", phone: "",
    address: "", apt: "", city: "", state: "", zip: "", country: "United States",
    cardName: "", cardNumber: "", cardExp: "", cardCvc: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutBlocked) {
      toast.error("Checking Vestiaire stock — sold pieces can’t be purchased.");
      return;
    }
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Check the highlighted fields.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    toast.success("Order placed — you'll get a confirmation email soon. ♡");
    clear();
    navigate({ to: "/" });
  };

  if (count === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="mx-auto max-w-[800px] px-5 py-24 text-center">
          <h1 className="font-display text-4xl">Your bag is empty.</h1>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-foreground px-7 py-3.5 text-[11px] tracking-luxe uppercase text-background hover:bg-primary"
          >
            Find something soft
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-5 py-10 md:px-10 md:py-16">
        <Link to="/cart" className="text-[11px] tracking-luxe uppercase text-foreground/60 hover:text-primary">
          ← Back to bag
        </Link>
        <h1 className="mt-4 font-display text-4xl md:text-6xl">
          Soft <span className="font-script text-primary">checkout</span>
        </h1>

        <form onSubmit={onSubmit} className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[1.4fr,1fr]" noValidate>
          <div className="space-y-10">
            <Section title="Contact">
              <Field label="Email" error={errors.email}>
                <input className={inputCls} type="email" autoComplete="email" value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input className={inputCls} type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} />
              </Field>
            </Section>

            <Section title="Shipping">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" error={errors.firstName}>
                  <input className={inputCls} autoComplete="given-name" value={form.firstName} onChange={update("firstName")} />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input className={inputCls} autoComplete="family-name" value={form.lastName} onChange={update("lastName")} />
                </Field>
              </div>
              <Field label="Address" error={errors.address}>
                <input className={inputCls} autoComplete="street-address" value={form.address} onChange={update("address")} />
              </Field>
              <Field label="Apt / Suite (optional)" error={errors.apt}>
                <input className={inputCls} value={form.apt} onChange={update("apt")} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" error={errors.city}>
                  <input className={inputCls} autoComplete="address-level2" value={form.city} onChange={update("city")} />
                </Field>
                <Field label="State / Region" error={errors.state}>
                  <input className={inputCls} autoComplete="address-level1" value={form.state} onChange={update("state")} />
                </Field>
                <Field label="ZIP / Postcode" error={errors.zip}>
                  <input className={inputCls} autoComplete="postal-code" value={form.zip} onChange={update("zip")} />
                </Field>
                <Field label="Country" error={errors.country}>
                  <input className={inputCls} autoComplete="country-name" value={form.country} onChange={update("country")} />
                </Field>
              </div>
            </Section>

            <Section title="Payment" sub="Demo only — no real charge.">
              <Field label="Name on card" error={errors.cardName}>
                <input className={inputCls} autoComplete="cc-name" value={form.cardName} onChange={update("cardName")} />
              </Field>
              <Field label="Card number" error={errors.cardNumber}>
                <input className={inputCls} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={form.cardNumber} onChange={update("cardNumber")} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry (MM/YY)" error={errors.cardExp}>
                  <input className={inputCls} autoComplete="cc-exp" placeholder="08/28" value={form.cardExp} onChange={update("cardExp")} />
                </Field>
                <Field label="CVC" error={errors.cardCvc}>
                  <input className={inputCls} inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={form.cardCvc} onChange={update("cardCvc")} />
                </Field>
              </div>
            </Section>

            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Each item is individually sourced from our exclusive network of designer collections.
              Because we curate just for you, please allow approximately 3–4 weeks for delivery so you can receive a piece that's truly one-of-a-kind.
            </p>
            <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">
              All sales are final — no returns or refunds.
            </p>

            <button
              type="submit"
              disabled={submitting || checkoutBlocked}
              className="w-full rounded-full bg-foreground py-4 text-[11px] tracking-luxe uppercase text-background transition-colors hover:bg-primary disabled:opacity-60"
            >
              {checkoutBlocked ? "Checking stock…" : submitting ? "Placing order…" : `Pay $${total.toLocaleString()}`}
            </button>
          </div>

          <aside className="h-fit rounded-2xl border border-border/70 bg-blush/30 p-6 md:sticky md:top-24">
            <h2 className="text-[11px] tracking-luxe uppercase">Order</h2>
            <ul className="mt-5 space-y-4">
              {lines.map(({ product, qty }) => (
                <CheckoutLine
                  key={product.id}
                  product={product}
                  qty={qty}
                  onStock={(available) => reportAvailability(product.id, available)}
                />
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>${subtotal.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>${shipping}</dd></div>
              <div className="flex justify-between font-display text-[16px] pt-2 border-t border-border"><dt>Total</dt><dd>${total.toLocaleString()}</dd></div>
            </dl>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function CheckoutLine({
  product,
  qty,
  onStock,
}: {
  product: Product;
  qty: number;
  onStock: (available: boolean) => void;
}) {
  const { data: stock } = useStock(product.vestiaireUrl);
  const available = stock ? stock.available : false;

  useEffect(() => onStock(available), [available, onStock]);

  return (
    <li className="flex items-center gap-3">
      <div
        className="relative size-14 shrink-0 overflow-hidden rounded-lg"
        style={{ background: `linear-gradient(160deg, ${product.swatch}, white 78%)` }}
      >
        <img src={product.img} alt="" className="size-full object-contain p-1" />
        {!available && product.vestiaireUrl && (
          <span className="absolute inset-0 grid place-items-center bg-background/55 text-[8px] tracking-luxe uppercase text-foreground">
            Sold
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]">{product.name}</p>
        <p className="text-[11px] text-muted-foreground">
          Qty {qty}{!available && product.vestiaireUrl ? " · unavailable" : ""}
        </p>
      </div>
      <p className="text-[13px]">${(product.price * qty).toLocaleString()}</p>
    </li>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] tracking-luxe uppercase text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
