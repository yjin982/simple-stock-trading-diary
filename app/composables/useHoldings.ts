import type { Holding, Trade } from '~/types'

export function useHoldings(trades: Ref<Trade[]>) {
  return computed<Holding[]>(() => {
    const positions = buildFifoPositions(trades.value)
    const result: Holding[] = []

    for (const pos of positions.values()) {
      const quantity = lotsQty(pos.lots)
      if (quantity <= 0) continue

      const totalCost = lotsCost(pos.lots)
      const avgPrice = lotsAvgPrice(pos.lots)
      const currentPrice = getDummyPrice(pos.stockCode, avgPrice)
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
}
