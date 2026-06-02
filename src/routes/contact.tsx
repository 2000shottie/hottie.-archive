import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SUPPORT_EMAIL = "a2000shottie@hotmail.com";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — HOTTIE." },
      { name: "description", content: "Need help with an order or a piece? We'd love to hear from you." },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(1, "Required").max(140),
  message: z.string().trim().min(5, "Tell us a little more").max(1000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Partial<Record<keyof typeof form, string>> = {};
      for (const i of parsed.error.issues) {
        const k = i.path[0] as keyof typeof form;
        if (!fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    const body = `Hi HOTTIE team,\n\n${parsed.data.message}\n\n— ${parsed.data.name} (${parsed.data.email})`;
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(parsed.data.subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    toast.success("Opening your email app — we'll reply within 24h ♡");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-[1100px] px-5 py-14 md:px-10 md:py-24">
        <p className="text-[11px] tracking-luxe uppercase text-muted-foreground">Support</p>
        <h1 className="mt-3 font-display text-4xl md:text-7xl">
          Say <span className="font-script text-primary">hi.</span>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Questions about a piece, an order, sizing, or shipping? Send us a note — we usually reply within 24 hours.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[1.3fr,1fr]">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Your name" error={errors.name}>
                <input className={inputCls} value={form.name} onChange={update("name")} />
              </Field>
              <Field label="Email" error={errors.email}>
                <input className={inputCls} type="email" value={form.email} onChange={update("email")} />
              </Field>
            </div>
            <Field label="Subject" error={errors.subject}>
              <input className={inputCls} value={form.subject} onChange={update("subject")} placeholder="Order #, sizing, shipping…" />
            </Field>
            <Field label="Message" error={errors.message}>
              <textarea
                className={`${inputCls} min-h-[160px] resize-y`}
                value={form.message}
                onChange={update("message")}
                placeholder="Tell us what's up…"
              />
            </Field>
            <button
              type="submit"
              className="rounded-full bg-foreground px-8 py-3.5 text-[11px] tracking-luxe uppercase text-background transition-colors hover:bg-primary"
            >
              Send message →
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-border/70 bg-blush/30 p-6">
            <h2 className="text-[11px] tracking-luxe uppercase text-foreground">Direct</h2>
            <p className="mt-3 text-[13px] text-muted-foreground">Prefer your own inbox?</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-3 block break-all font-display text-xl text-foreground hover:text-primary"
            >
              {SUPPORT_EMAIL}
            </a>
            <div className="mt-8 space-y-3 text-[13px]">
              <p className="text-foreground">Replies within 24h, mon–fri.</p>
              <p className="text-muted-foreground">Worldwide tracked shipping. Returns within 14 days on unworn pieces.</p>
            </div>
            <Link
              to="/"
              className="mt-8 inline-block text-[11px] tracking-luxe uppercase text-foreground/70 hover:text-primary"
            >
              ← Back to the edit
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] tracking-luxe uppercase text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
