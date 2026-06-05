// ADMIN-ONLY pricing math. Never import this from customer-facing components
// other than the gated /admin/* routes. None of these numbers may be rendered
// to buyers.

import type { Product } from "@/lib/products";

export const MINIMUM_PROFIT_USD = 150;

export type InternalPricing = {
  myCost: number;
  estimatedShippingCost: number;
  estimatedDutiesAndTaxes: number;
  minimumProfit: number;
  internalRequiredPrice: number;
  /** Current listed price (customer-facing). */
  listedPrice: number;
  /** Difference: listedPrice - internalRequiredPrice. Negative = under floor. */
  margin: number;
  /** True when the listed price covers cost + ship + duties + $150. */
  publishable: boolean;
  /** Whether we have enough internal data to even compute this. */
  hasData: boolean;
};

export function computeInternalPricing(p: Product): InternalPricing {
  const myCost = p.myCost ?? 0;
  const estShip = p.estimatedShippingCost ?? 0;
  const estDuties = p.estimatedDutiesAndTaxes ?? 0;
  const internalRequiredPrice = myCost + estShip + estDuties + MINIMUM_PROFIT_USD;
  const margin = p.price - internalRequiredPrice;
  const hasData = p.myCost != null;
  return {
    myCost,
    estimatedShippingCost: estShip,
    estimatedDutiesAndTaxes: estDuties,
    minimumProfit: MINIMUM_PROFIT_USD,
    internalRequiredPrice,
    listedPrice: p.price,
    margin,
    publishable: hasData ? p.price >= internalRequiredPrice : false,
    hasData,
  };
}

export function priceWarning(p: Product): string | null {
  const r = computeInternalPricing(p);
  if (!r.hasData) return "Missing internal cost data — cannot verify minimum profit.";
  if (!r.publishable) {
    return `Price too low. Increase product price to at least $${r.internalRequiredPrice.toLocaleString()} to protect $${MINIMUM_PROFIT_USD} minimum profit.`;
  }
  return null;
}
