import type { Trade, TradeRow } from "~/types";
import { daysBetween, fmtYYMMDD } from "./date";
import { toYahooSymbol } from "./yahooSymbol";

export type Lot = { qty: number; price: number };

export type FifoPosition = {
  accountId: string;
  accountName?: string;
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  exchange?: "KOSPI" | "KOSDAQ";
  currency: "KRW" | "USD";
  lots: Lot[];
};

export function sortTradesAsc(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
}

// FIFO 방식으로 lots 앞에서부터 sellQty만큼 소진. 소진되는 lot마다 onConsume 호출.
function consumeFifoLots(
  lots: Lot[],
  sellQty: number,
  onConsume?: (lot: Lot, usedQty: number) => void,
): void {
  let remaining = sellQty;
  while (remaining > 0 && lots.length > 0) {
    const lot = lots[0]!;
    const used = Math.min(remaining, lot.qty);
    onConsume?.(lot, used);
    lot.qty -= used;
    remaining -= used;
    if (lot.qty === 0) lots.shift();
  }
}

// 거래 목록에서 FIFO 방식으로 잔여 포지션 맵을 생성 (키: accountId|stockCode)
export function buildFifoPositions(trades: Trade[]): Map<string, FifoPosition> {
  const sorted = sortTradesAsc(trades);
  const positions = new Map<string, FifoPosition>();

  for (const t of sorted) {
    // 계좌와 종목코드를 키로 설정. (같은 종목이 다른 계좌에 있을 수 있으므로)
    const key = `${t.accountId}|${t.stockCode}`;
    if (t.type === "BUY") {
      // 매수
      if (!positions.has(key)) {
        // 최초 거래 = 키가 없음
        positions.set(key, {
          accountId: t.accountId,
          accountName: t.accountName,
          stockCode: t.stockCode,
          stockName: t.stockName,
          market: t.market,
          exchange: t.exchange,
          currency: t.currency,
          lots: [],
        });
      }
      // 매수 이력이 있음.
      positions.get(key)!.lots.push({ qty: t.quantity, price: t.price });
    } else {
      // 매도
      const pos = positions.get(key);
      if (!pos) continue; // 매도할 내역이 없음.
      consumeFifoLots(pos.lots, t.quantity);
    }
  }

  return positions;
}

// 주식 잔고 수량 계산
export function lotsQty(lots: Lot[]): number {
  return lots.reduce((s, l) => s + l.qty, 0);
}

// 주식 잔고 매입금액 계산
export function lotsCost(lots: Lot[]): number {
  return lots.reduce((s, l) => s + l.qty * l.price, 0);
}

// 미실현 손익 (평가금액 - 매입금액)
export function calcPnl(evalAmount: number, cost: number): number {
  return evalAmount - cost;
}

// 수익률 (%)
export function calcPnlRate(pnl: number, cost: number): number {
  return cost > 0 ? (pnl / cost) * 100 : 0;
}

export type PositionHolding = {
  accountId: string;
  accountName?: string;
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  exchange?: "KOSPI" | "KOSDAQ";
  currency: "KRW" | "USD";
  quantity: number;
  avgPrice: number;
  totalCost: number;
  currentPrice: number;
  evalAmount: number;
  pnl: number;
  pnlRate: number;
};

// FIFO 포지션 목록 → 종목별 평가금액/손익 계산 (보유수량 0인 포지션은 제외)
export function computeHoldingsFromPositions(
  positions: Iterable<FifoPosition>,
  priceMap: Record<string, number>,
): PositionHolding[] {
  const result: PositionHolding[] = [];
  for (const pos of positions) {
    const quantity = lotsQty(pos.lots);
    if (quantity <= 0) continue;
    const totalCost = lotsCost(pos.lots);
    const avgPrice = totalCost / quantity;
    const sym = toYahooSymbol(pos.stockCode, pos.market, pos.exchange);
    const currentPrice = priceMap[sym] ?? avgPrice;
    const evalAmount = currentPrice * quantity;
    const pnl = calcPnl(evalAmount, totalCost);
    result.push({
      accountId: pos.accountId,
      accountName: pos.accountName,
      stockCode: pos.stockCode,
      stockName: pos.stockName,
      market: pos.market,
      exchange: pos.exchange,
      currency: pos.currency,
      quantity,
      avgPrice,
      totalCost,
      currentPrice,
      evalAmount,
      pnl,
      pnlRate: calcPnlRate(pnl, totalCost),
    });
  }
  return result;
}

// 실현 손익 (매도가 - 평균매수가) × 수량
export function calcRealizedPnl(
  sellPrice: number,
  avgBuyPrice: number,
  qty: number,
): number {
  return (sellPrice - avgBuyPrice) * qty;
}

export function calcRealizedPnlRate(
  realizedPnl: number,
  avgBuyPrice: number,
  qty: number,
): number {
  const cost = avgBuyPrice * qty;
  return cost > 0 ? (realizedPnl / cost) * 100 : 0;
}

// 거래 목록에서 FIFO 방식으로 매매 행(TradeRow)을 생성 (역순 반환, 날짜 오름차순 입력 가정)
export function buildTradeRows(trades: Trade[]): TradeRow[] {
  const buyQueue: Array<{ date: string; remainingQty: number; price: number }> =
    [];
  const result: TradeRow[] = [];

  for (const trade of trades) {
    if (trade.type === "BUY") {
      buyQueue.push({
        date: trade.tradeDate,
        remainingQty: trade.quantity,
        price: trade.price,
      });
      result.push({
        id: trade.id,
        date: trade.tradeDate,
        type: "BUY",
        quantity: trade.quantity,
        price: trade.price,
        total: trade.price * trade.quantity,
        memo: trade.memo,
      });
    } else {
      let sellQty = trade.quantity;
      const matchedLots: Array<{ date: string; qty: number; price: number }> =
        [];

      while (sellQty > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0]!;
        const matchQty = Math.min(sellQty, buy.remainingQty);
        matchedLots.push({ date: buy.date, qty: matchQty, price: buy.price });
        buy.remainingQty -= matchQty;
        sellQty -= matchQty;
        if (buy.remainingQty === 0) buyQueue.shift();
      }

      let avgHoldingDays: number | undefined;
      let holdingRange: string | undefined;
      let pnlRate: number | undefined;
      let realizedPnl: number | undefined;

      if (matchedLots.length > 0) {
        const totalQty = matchedLots.reduce((s, l) => s + l.qty, 0);
        const avgBuyPrice =
          matchedLots.reduce((s, l) => s + l.qty * l.price, 0) / totalQty;
        const totalWeightedDays = matchedLots.reduce(
          (s, l) => s + daysBetween(l.date, trade.tradeDate) * l.qty,
          0,
        );
        avgHoldingDays = Math.round(totalWeightedDays / totalQty);
        holdingRange = `${fmtYYMMDD(matchedLots[0]!.date)}~${fmtYYMMDD(trade.tradeDate)}`;
        realizedPnl = calcRealizedPnl(trade.price, avgBuyPrice, totalQty);
        pnlRate = calcRealizedPnlRate(realizedPnl, avgBuyPrice, totalQty);
      }

      result.push({
        id: trade.id,
        date: trade.tradeDate,
        type: "SELL",
        quantity: trade.quantity,
        price: trade.price,
        total: trade.price * trade.quantity,
        memo: trade.memo,
        avgHoldingDays,
        holdingRange,
        pnlRate,
        realizedPnl,
      });
    }
  }

  return result.reverse();
}

export type RealizedPnl = { KRW: number; USD: number };

// 전체 거래 내역에서 FIFO 방식으로 실현손익을 통화별로 계산
export function computeRealizedPnl(trades: Trade[]): RealizedPnl {
  const sorted = sortTradesAsc(trades);
  const queues = new Map<string, { lots: Lot[]; currency: "KRW" | "USD" }>();
  const result: RealizedPnl = { KRW: 0, USD: 0 };

  for (const t of sorted) {
    const key = `${t.accountId}|${t.stockCode}`;
    if (t.type === "BUY") {
      if (!queues.has(key)) {
        queues.set(key, { lots: [], currency: t.currency });
      }
      queues.get(key)!.lots.push({ qty: t.quantity, price: t.price });
    } else {
      const queue = queues.get(key);
      if (!queue) continue;
      let realized = 0;
      consumeFifoLots(queue.lots, t.quantity, (lot, used) => {
        realized += (t.price - lot.price) * used;
      });
      if (queue.currency === "KRW") result.KRW += realized;
      else result.USD += realized;
    }
  }

  return result;
}
