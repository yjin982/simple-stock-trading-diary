import type { Trade, TradeRow } from '~/types'
import { daysBetween, fmtYYMMDD } from './date'

export type Lot = { qty: number; price: number }

export type FifoPosition = {
  accountId: string
  accountName?: string
  stockCode: string
  stockName: string
  market: 'KR' | 'US'
  exchange?: 'KOSPI' | 'KOSDAQ'
  currency: 'KRW' | 'USD'
  lots: Lot[]
}

// 거래 목록에서 FIFO 방식으로 잔여 포지션 맵을 생성 (키: accountId|stockCode)
export function buildFifoPositions(trades: Trade[]): Map<string, FifoPosition> {
  const sorted = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))
  const positions = new Map<string, FifoPosition>()

  for (const t of sorted) {
    const key = `${t.accountId}|${t.stockCode}`
    if (t.type === 'BUY') {
      if (!positions.has(key)) {
        positions.set(key, {
          accountId: t.accountId, accountName: t.accountName,
          stockCode: t.stockCode, stockName: t.stockName,
          market: t.market, exchange: t.exchange, currency: t.currency, lots: [],
        })
      }
      positions.get(key)!.lots.push({ qty: t.quantity, price: t.price })
    } else {
      const pos = positions.get(key)
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

// 거래 목록에서 FIFO 방식으로 매매 행(TradeRow)을 생성 (역순 반환, 날짜 오름차순 입력 가정)
export function buildTradeRows(trades: Trade[]): TradeRow[] {
  const buyQueue: Array<{ date: string; remainingQty: number; price: number }> = []
  const result: TradeRow[] = []

  for (const trade of trades) {
    if (trade.type === 'BUY') {
      buyQueue.push({ date: trade.tradeDate, remainingQty: trade.quantity, price: trade.price })
      result.push({ id: trade.id, date: trade.tradeDate, type: 'BUY', quantity: trade.quantity, price: trade.price, total: trade.price * trade.quantity, memo: trade.memo })
    } else {
      let sellQty = trade.quantity
      const matchedLots: Array<{ date: string; qty: number; price: number }> = []

      while (sellQty > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0]!
        const matchQty = Math.min(sellQty, buy.remainingQty)
        matchedLots.push({ date: buy.date, qty: matchQty, price: buy.price })
        buy.remainingQty -= matchQty
        sellQty -= matchQty
        if (buy.remainingQty === 0) buyQueue.shift()
      }

      let avgHoldingDays: number | undefined
      let holdingRange: string | undefined
      let pnlRate: number | undefined
      let realizedPnl: number | undefined

      if (matchedLots.length > 0) {
        const totalQty = matchedLots.reduce((s, l) => s + l.qty, 0)
        const avgBuyPrice = matchedLots.reduce((s, l) => s + l.qty * l.price, 0) / totalQty
        avgHoldingDays = Math.round(matchedLots.reduce((s, l) => s + daysBetween(l.date, trade.tradeDate), 0) / matchedLots.length)
        holdingRange = `${fmtYYMMDD(matchedLots[0]!.date)}~${fmtYYMMDD(trade.tradeDate)}`
        realizedPnl = calcRealizedPnl(trade.price, avgBuyPrice, totalQty)
        pnlRate = calcRealizedPnlRate(realizedPnl, avgBuyPrice, totalQty)
      }

      result.push({ id: trade.id, date: trade.tradeDate, type: 'SELL', quantity: trade.quantity, price: trade.price, total: trade.price * trade.quantity, memo: trade.memo, avgHoldingDays, holdingRange, pnlRate, realizedPnl })
    }
  }

  return result.reverse()
}

export type RealizedPnl = { KRW: number; USD: number }

// 전체 거래 내역에서 FIFO 방식으로 실현손익을 통화별로 계산
export function computeRealizedPnl(trades: Trade[]): RealizedPnl {
  const sorted = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))
  const queues = new Map<string, { lots: Lot[]; currency: 'KRW' | 'USD' }>()
  const result: RealizedPnl = { KRW: 0, USD: 0 }

  for (const t of sorted) {
    if (t.type === 'BUY') {
      if (!queues.has(t.stockCode)) {
        queues.set(t.stockCode, { lots: [], currency: t.currency })
      }
      queues.get(t.stockCode)!.lots.push({ qty: t.quantity, price: t.price })
    } else {
      const queue = queues.get(t.stockCode)
      if (!queue) continue
      let sellQty = t.quantity
      let realized = 0
      while (sellQty > 0 && queue.lots.length > 0) {
        const lot = queue.lots[0]!
        const used = Math.min(sellQty, lot.qty)
        realized += (t.price - lot.price) * used
        lot.qty -= used
        sellQty -= used
        if (lot.qty === 0) queue.lots.shift()
      }
      if (queue.currency === 'KRW') result.KRW += realized
      else result.USD += realized
    }
  }

  return result
}
