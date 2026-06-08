import { createServerFn } from "@tanstack/react-start";
import { requireAdminToken } from "@/lib/admin-auth";

/**
 * Returns ok if the request carries a valid admin token. The middleware
 * does all the work; if it fails the call throws and the unlock UI shows
 * an error.
 */
export const verifyAdminToken = createServerFn({ method: "POST" })
  .middleware([requireAdminToken])
  .handler(async () => ({ ok: true as const }));
