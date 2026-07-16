import type { Holding, Trade } from '~/types'

export function useHoldings(trades: Ref<Trade[]>) {
  const positions = computed(() => buildFifoPositions(trades.value))

  const yahooSymbols = computed(() => {
    const seen = new Set<string>()
    const symbols: string[] = []
    for (const pos of positions.value.values()) {
      if (lotsQty(pos.lots) > 0) {
        const sym = toYahooSymbol(pos.stockCode, pos.market, pos.exchange)
        if (!seen.has(sym)) { seen.add(sym); symbols.push(sym) }
      }
    }
    return symbols
  })

  const { priceMap, loading: pricesLoading, priceTime } = usePriceMap(yahooSymbols)

  const holdings = computed<Holding[]>(() => {
    const result: Holding[] = []
    for (const pos of positions.value.values()) {
      const quantity = lotsQty(pos.lots)
      if (quantity <= 0) continue
      const totalCost = lotsCost(pos.lots)
      const avgPrice = lotsAvgPrice(pos.lots)
      const sym = toYahooSymbol(pos.stockCode, pos.market, pos.exchange)
      const currentPrice = priceMap.value[sym] ?? avgPrice
      const evalAmount = currentPrice * quantity
      const pnl = calcPnl(evalAmount, totalCost)
      result.push({
        accountId: pos.accountId,
        accountName: pos.accountName,
        stockCode: pos.stockCode,
        stockName: pos.stockName,
        market: pos.market,
        currency: pos.currency,
        quantity,
        avgPrice,
        currentPrice,
        pnl,
        pnlRate: calcPnlRate(pnl, totalCost),
      })
    }
    return result
  })

  return { holdings, pricesLoading, priceTime }
}
