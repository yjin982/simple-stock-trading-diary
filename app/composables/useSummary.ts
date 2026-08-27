import type { Holding, Trade } from "~/types";

type Summary = {
  evalKRW: number;
  evalUSD: number;
  costKRW: number;
  costUSD: number;
  unrealizedKRW: number;
  unrealizedUSD: number;
  realizedKRW: number;
  realizedUSD: number;
  returnRateKRW: number;
  returnRateUSD: number;
  hasKRW: boolean;
  hasUSD: boolean;
  hasDataIssue: boolean;
  hasEstimatedPrice: boolean;
};

export function useSummary(
  holdings: ComputedRef<Holding[]>,
  trades: Ref<Trade[]>,
) {
  return computed<Summary>(() => {
    const agg = aggregateByCurrency(
      holdings.value.map((h) => ({
        currency: h.currency,
        evalAmount: h.currentPrice * h.quantity,
        totalCost: h.avgPrice * h.quantity,
      })),
    );

    const { KRW: realizedKRW, USD: realizedUSD, oversold } = computeRealizedPnl(
      trades.value,
    );

    const hasKRW = trades.value.some((t) => t.currency === "KRW");
    const hasUSD = trades.value.some((t) => t.currency === "USD");
    const hasEstimatedPrice = holdings.value.some((h) => !h.priceAvailable);

    return {
      ...agg,
      realizedKRW,
      realizedUSD,
      hasKRW,
      hasUSD,
      hasDataIssue: oversold,
      hasEstimatedPrice,
    };
  });
}
