// ADMIN-ONLY pricing math. Never import this from customer-facing components
// other than the gated /admin/* routes.

import type { Product } from "@/lib/products";
import { landedCost, worstCaseLandedCost, type LandedCost } from "@/lib/admin-rates";

export const MINIMUM_PROFIT_USD = 150;

export type InternalPricing = {
  myCost: number;
  /** Worst-case landed cost across all destinations we ship to. */
  worstLanded: LandedCost;
  /** Country code that produced the worst-case landing. */
  worstDestination: string;
  /** myCost + worst-case shipping + worst-case duties + $150. */
  internalRequiredPrice: number;
  listedPrice: number;
  /** listedPrice - internalRequiredPrice. Negative = price too low. */
  margin: number;
  publishable: boolean;
  hasData: boolean;
};

export function computeInternalPricing(p: Product): InternalPricing {
  const myCost = p.myCost ?? 0;
  const { destination, cost } = worstCaseLandedCost(p);
  const internalRequiredPrice = myCost + cost.total + MINIMUM_PROFIT_USD;
  const hasData = p.myCost != null && p.originCountry != null;
  return {
    myCost,
    worstLanded: cost,
    worstDestination: destination,
    internalRequiredPrice,
    listedPrice: p.price,
    margin: p.price - internalRequiredPrice,
    publishable: hasData ? p.price >= internalRequiredPrice : false,
    hasData,
  };
}

export function priceWarning(p: Product): string | null {
  const r = computeInternalPricing(p);
  if (!r.hasData) return "Missing myCost or originCountry — cannot verify minimum profit.";
  if (!r.publishable) {
    return `Price too low. Increase product price to at least $${r.internalRequiredPrice.toLocaleString()} to protect $${MINIMUM_PROFIT_USD} minimum profit (worst case: ship to ${r.worstDestination}).`;
  }
  return null;
}

// Per-buyer-country breakdown — used by the admin calculator to verify a
// specific destination, not just the worst case.
export type BuyerBreakdown = {
  buyerCountry: string;
  landed: LandedCost;
  internalCost: number;
  profit: number;
  ok: boolean;
};

export function computeForBuyer(p: Product, buyerCountry: string): BuyerBreakdown {
  const landed = landedCost(p, buyerCountry);
  const myCost = p.myCost ?? 0;
  const internalCost = myCost + landed.total;
  const profit = p.price - internalCost;
  return {
    buyerCountry,
    landed,
    internalCost,
    profit,
    ok: profit >= MINIMUM_PROFIT_USD,
  };
}
