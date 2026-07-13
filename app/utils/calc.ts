import type { Trade } from '~/types'

export type Lot = { qty: number; price: number }

export type FifoPosition = {
  stockCode: string
  stockName: string
  market: 'KR' | 'US'
  exchange?: 'KOSPI' | 'KOSDAQ'
  currency: 'KRW' | 'USD'
  lots: Lot[]
}

// 거래 목록에서 FIFO 방식으로 잔여 포지션 맵을 생성
export function buildFifoPositions(trades: Trade[]): Map<string, FifoPosition> {
  const sorted = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))
  const positions = new Map<string, FifoPosition>()

  for (const t of sorted) {
    if (t.type === 'BUY') {
      if (!positions.has(t.stockCode)) {
        positions.set(t.stockCode, {
          stockCode: t.stockCode, stockName: t.stockName,
          market: t.market, exchange: t.exchange, currency: t.currency, lots: [],
        })
      }
      positions.get(t.stockCode)!.lots.push({ qty: t.quantity, price: t.price })
    } else {
      const pos = positions.get(t.stockCode)
      if (!pos) continue
      let sellQty = t.quantity
      while (sellQty > 0 && pos.lots.length > 0) {
        const lot = pos.lots[0]!
        const used = Math.min(sellQty, lot.qty)
        lot.qty -= used
        sellQty -= used
        if (lot.qty === 0) pos.lots.shift()
      }
    }
  }

  return positions
}

// Lot 집계
export function lotsQty(lots: Lot[]): number {
  return lots.reduce((s, l) => s + l.qty, 0)
}

export function lotsCost(lots: Lot[]): number {
  return lots.reduce((s, l) => s + l.qty * l.price, 0)
}

export function lotsAvgPrice(lots: Lot[]): number {
  const qty = lotsQty(lots)
  return qty > 0 ? lotsCost(lots) / qty : 0
}

// 미실현 손익 (평가금액 - 매입금액)
export function calcPnl(evalAmount: number, cost: number): number {
  return evalAmount - cost
}

// 수익률 (%)
export function calcPnlRate(pnl: number, cost: number): number {
  return cost > 0 ? (pnl / cost) * 100 : 0
}

// 실현 손익 (매도가 - 평균매수가) × 수량
export function calcRealizedPnl(sellPrice: number, avgBuyPrice: number, qty: number): number {
  return (sellPrice - avgBuyPrice) * qty
}

export function calcRealizedPnlRate(realizedPnl: number, avgBuyPrice: number, qty: number): number {
  const cost = avgBuyPrice * qty
  return cost > 0 ? (realizedPnl / cost) * 100 : 0
}
