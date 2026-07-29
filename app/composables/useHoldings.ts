import type { Holding, Trade } from "~/types";

export function useHoldings(trades: Ref<Trade[]>) {
  const positions = computed(() => buildFifoPositions(trades.value));

  const yahooSymbols = computed(() => {
    const seen = new Set<string>();
    const symbols: string[] = [];
    for (const pos of positions.value.values()) {
      if (lotsQty(pos.lots) > 0) {
        const sym = toYahooSymbol(pos.stockCode, pos.market, pos.exchange);
        if (!seen.has(sym)) {
          seen.add(sym);
          symbols.push(sym);
        }
      }
    }
    return symbols;
  });

  const {
    priceMap,
    loading: pricesLoading,
    priceTime,
  } = usePriceMap(yahooSymbols);

  const holdings = computed<Holding[]>(() =>
    computeHoldingsFromPositions(positions.value.values(), priceMap.value),
  );

  return { holdings, pricesLoading, priceTime };
}
