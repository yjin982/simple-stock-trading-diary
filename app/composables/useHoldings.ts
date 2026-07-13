import type { Holding, Trade } from '~/types'

export function useHoldings(trades: Ref<Trade[]>) {
  const positions = computed(() => buildFifoPositions(trades.value))

  const yahooSymbols = computed(() =>
    [...positions.value.values()]
      .filter(pos => lotsQty(pos.lots) > 0)
      .map(pos => toYahooSymbol(pos.stockCode, pos.market, pos.exchange)),
  )

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
