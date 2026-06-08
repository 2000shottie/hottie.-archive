import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyAdminToken } from "@/lib/admin-session.functions";
import { ADMIN_TOKEN_STORAGE_KEY } from "@/lib/admin-auth";

/**
 * Wraps every admin page. Reads an admin token from localStorage and
 * verifies it server-side before rendering children. Without a valid
 * token the children — and the admin server functions they call —
 * are never invoked.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const verify = useServerFn(verifyAdminToken);
  const [status, setStatus] = useState<"checking" | "ok" | "locked">("checking");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!stored) {
      setStatus("locked");
      return;
    }
    verify()
      .then(() => setStatus("ok"))
      .catch(() => {
        window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        setStatus("locked");
      });
  }, [verify]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setBusy(true);
    setError(null);
    // Optimistically store so the global attacher sends it on this call.
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, input.trim());
    try {
      await verify();
      setStatus("ok");
      setInput("");
    } catch {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      setError("Invalid token.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking") {
    return (
      <main className="mx-auto max-w-md p-10 text-sm text-muted-foreground">
        Checking access…
      </main>
    );
  }

  if (status === "locked") {
    return (
      <main className="mx-auto max-w-md p-10">
        <h1 className="font-display text-3xl">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the admin token to continue.
        </p>
        <form className="mt-4 flex gap-2" onSubmit={unlock}>
          <input
            type="password"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Admin token"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </main>
    );
  }

  return <>{children}</>;
}

export function adminSignOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  window.location.reload();
}
