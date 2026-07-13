import type { Holding, Trade } from '~/types'

export type Summary = {
  evalKRW: number
  evalUSD: number
  costKRW: number
  costUSD: number
  unrealizedKRW: number
  unrealizedUSD: number
  realizedKRW: number
  realizedUSD: number
  returnRateKRW: number
  returnRateUSD: number
  hasKRW: boolean
  hasUSD: boolean
}

export function useSummary(holdings: ComputedRef<Holding[]>, trades: Ref<Trade[]>) {
  return computed<Summary>(() => {
    let evalKRW = 0, evalUSD = 0, costKRW = 0, costUSD = 0

    for (const h of holdings.value) {
      const cost = h.avgPrice * h.quantity
      const evalAmount = h.currentPrice * h.quantity
      if (h.currency === 'KRW') { evalKRW += evalAmount; costKRW += cost }
      else { evalUSD += evalAmount; costUSD += cost }
    }

    const unrealizedKRW = evalKRW - costKRW
    const unrealizedUSD = evalUSD - costUSD
    const { KRW: realizedKRW, USD: realizedUSD } = computeRealizedPnl(trades.value)

    const hasKRW = trades.value.some(t => t.currency === 'KRW')
    const hasUSD = trades.value.some(t => t.currency === 'USD')

    return {
      evalKRW, evalUSD,
      costKRW, costUSD,
      unrealizedKRW, unrealizedUSD,
      realizedKRW, realizedUSD,
      returnRateKRW: costKRW > 0 ? ((unrealizedKRW + realizedKRW) / costKRW) * 100 : 0,
      returnRateUSD: costUSD > 0 ? ((unrealizedUSD + realizedUSD) / costUSD) * 100 : 0,
      hasKRW,
      hasUSD,
    }
  })
}
