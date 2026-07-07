import type { Holding, Trade } from '~/types'

export function useHoldings(trades: Ref<Trade[]>) {
  return computed<Holding[]>(() => {
    const sorted = [...trades.value].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))

    type Lot = { qty: number; price: number }
    type Position = {
      stockCode: string
      stockName: string
      market: 'KR' | 'US'
      currency: 'KRW' | 'USD'
      lots: Lot[]
    }

    const positions = new Map<string, Position>()

    for (const trade of sorted) {
      if (trade.type === 'BUY') {
        if (!positions.has(trade.stockCode)) {
          positions.set(trade.stockCode, {
            stockCode: trade.stockCode,
            stockName: trade.stockName,
            market: trade.market,
            currency: trade.currency,
            lots: [],
          })
        }
        positions.get(trade.stockCode)!.lots.push({ qty: trade.quantity, price: trade.price })
      }
      else {
        const pos = positions.get(trade.stockCode)
        if (!pos) continue

        let sellQty = trade.quantity
        while (sellQty > 0 && pos.lots.length > 0) {
          const lot = pos.lots[0]!
          const used = Math.min(sellQty, lot.qty)
          lot.qty -= used
          sellQty -= used
          if (lot.qty === 0) pos.lots.shift()
        }
      }
    }

    const result: Holding[] = []
    for (const pos of positions.values()) {
      const totalQty = pos.lots.reduce((s, l) => s + l.qty, 0)
      if (totalQty <= 0) continue

      const totalCost = pos.lots.reduce((s, l) => s + l.qty * l.price, 0)
      const avgPrice = totalCost / totalQty

      result.push({
        stockCode: pos.stockCode,
        stockName: pos.stockName,
        market: pos.market,
        currency: pos.currency,
        quantity: totalQty,
        avgPrice,
        currentPrice: 0,
        pnl: 0,
        pnlRate: 0,
      })
    }

    return result
  })
}
