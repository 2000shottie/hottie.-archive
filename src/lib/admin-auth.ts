/**
 * Admin auth middleware.
 *
 * The site has no user accounts, so admin server functions are protected
 * by a shared `ADMIN_TOKEN` secret. The client attaches the token (stored
 * in localStorage after a successful unlock) as an `x-admin-token` header;
 * `requireAdminToken` validates it server-side.
 *
 * Used by every server fn that exposes admin-only data or write paths
 * (orders, imports, publish/archive, stock sync).
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const ADMIN_TOKEN_HEADER = "x-admin-token";
export const ADMIN_TOKEN_STORAGE_KEY = "hottie.admin.token.v1";

/** Server middleware — apply to every admin createServerFn. */
export const requireAdminToken = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) {
      throw new Error("ADMIN_TOKEN is not configured");
    }
    const provided = getRequestHeader(ADMIN_TOKEN_HEADER);
    if (!provided || provided.length !== expected.length) {
      throw new Error("Unauthorized");
    }
    // constant-time compare
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
    }
    if (mismatch !== 0) throw new Error("Unauthorized");
    return next();
  },
);

/** Global client middleware — attaches the token from localStorage. */
export const attachAdminToken = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
        : null;
    return next({ headers: token ? { [ADMIN_TOKEN_HEADER]: token } : {} });
  },
);
