import type { Trade, TradeRow } from "~/types";
import { daysBetween, fmtYYMMDD } from "./date";
import { stockKey } from "./stockKey";
import { toYahooSymbol } from "./yahooSymbol";

export type Lot = { qty: number; price: number; date: string };

// 소수점 수량(미국 주식)은 0.1 + 0.2 = 0.30000000000000004처럼 오차가 남는다.
// 수량을 0과 비교할 때는 === 0 / > 0 대신 이 값을 기준으로 비교한다.
export const QTY_EPSILON = 1e-9;

// 화면 표시·입력값 비교용 수량 반올림 (소수점 8자리)
export function roundQty(qty: number): number {
  return Math.round(qty * 1e8) / 1e8;
}

export type FifoPosition = {
  accountId: string;
  accountName?: string;
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  exchange?: "KOSPI" | "KOSDAQ";
  currency: "KRW" | "USD";
  lots: Lot[];
  oversoldQty: number; // 보유 잔고보다 많이 매도되어 매칭하지 못한 누적 수량
};

export function sortTradesAsc(trades: Trade[]): Trade[] {
  return [...trades].sort(
    (a, b) =>
      a.tradeDate.localeCompare(b.tradeDate) ||
      (a.sequence ?? 0) - (b.sequence ?? 0) ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

// 매도 한 건을 FIFO로 매칭한 결과
type SellMatch = {
  matched: Lot[]; // 이번 매도에 소진된 매수 lot (qty는 이번에 쓴 수량)
  unmatchedQty: number; // 잔고 부족으로 매칭하지 못한 수량 (정상 매도라면 0)
};

// FIFO 방식으로 lots 앞에서부터 sellQty만큼 소진한다.
function consumeFifoLots(lots: Lot[], sellQty: number): SellMatch {
  const matched: Lot[] = [];
  let remaining = sellQty;
  while (remaining > QTY_EPSILON && lots.length > 0) {
    const lot = lots[0]!;
    const used = Math.min(remaining, lot.qty);
    matched.push({ qty: used, price: lot.price, date: lot.date });
    lot.qty -= used;
    remaining -= used;
    if (lot.qty <= QTY_EPSILON) lots.shift();
  }
  return { matched, unmatchedQty: remaining > QTY_EPSILON ? remaining : 0 };
}

// 모든 FIFO 계산의 공통 루프. 거래를 sortTradesAsc 순서로 처리하며 포지션별로
// 매수 lot을 쌓고 매도마다 소진한다. 거래마다 onTrade를 호출한다 (매도면 sell에 매칭 결과).
// buildFifoPositions / computeRealizedPnl / buildTradeRows가 모두 이 함수를 써서
// 화면마다 매칭 결과가 달라지지 않게 한다.
function runFifo(
  trades: Trade[],
  onTrade?: (trade: Trade, pos: FifoPosition, sell: SellMatch | null) => void,
): Map<string, FifoPosition> {
  const positions = new Map<string, FifoPosition>();

  for (const t of sortTradesAsc(trades)) {
    // 계좌+시장+종목코드를 키로 설정. (같은 종목코드가 다른 계좌나 시장(KR/US)에 있을 수 있으므로)
    const key = `${t.accountId}|${stockKey(t.market, t.stockCode)}`;
    let pos = positions.get(key);
    if (!pos) {
      // 매수 이력 없이 매도부터 들어온 경우에도 잔고 부족 수량을 추적할 수 있도록 포지션을 만든다.
      pos = {
        accountId: t.accountId,
        accountName: t.accountName,
        stockCode: t.stockCode,
        stockName: t.stockName,
        market: t.market,
        exchange: t.exchange,
        currency: t.currency,
        lots: [],
        oversoldQty: 0,
      };
      positions.set(key, pos);
    }

    if (t.type === "BUY") {
      pos.lots.push({ qty: t.quantity, price: t.price, date: t.tradeDate });
      onTrade?.(t, pos, null);
    } else {
      const sell = consumeFifoLots(pos.lots, t.quantity);
      pos.oversoldQty += sell.unmatchedQty;
      onTrade?.(t, pos, sell);
    }
  }

  return positions;
}

// 거래 목록에서 FIFO 방식으로 잔여 포지션 맵을 생성 (키: accountId|market|stockCode)
export function buildFifoPositions(trades: Trade[]): Map<string, FifoPosition> {
  return runFifo(trades);
}

// 매수 거래 수정·삭제가 이후 매도 내역을 초과매도로 만드는지 확인.
// (매도 거래 자체는 이미 저장 시점에 그 시점 잔고로 검증되므로, 여기서는
// 매수 물량이 줄거나 시점이 밀려서 "다른" 거래가 새로 초과매도가 되는
// 경우만 신경 쓰면 된다.) before/after 각각 전체 FIFO를 계산해, 특정
// 포지션의 오버매도 수량이 이전보다 늘어났으면 이번 변경이 원인인 것이다.
export function wouldIntroduceOversell(before: Trade[], after: Trade[]): boolean {
  const beforePositions = buildFifoPositions(before);
  const afterPositions = buildFifoPositions(after);
  for (const [key, pos] of afterPositions) {
    const prevOversoldQty = beforePositions.get(key)?.oversoldQty ?? 0;
    if (pos.oversoldQty > prevOversoldQty + QTY_EPSILON) return true;
  }
  return false;
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
  oversoldQty: number;
  priceAvailable: boolean;
};

// FIFO 포지션 목록 → 종목별 평가금액/손익 계산 (보유수량 0인 포지션은 제외)
export function computeHoldingsFromPositions(
  positions: Iterable<FifoPosition>,
  priceMap: Record<string, number>,
): PositionHolding[] {
  const result: PositionHolding[] = [];
  for (const pos of positions) {
    const quantity = lotsQty(pos.lots);
    if (quantity <= QTY_EPSILON) continue;
    const totalCost = lotsCost(pos.lots);
    const avgPrice = totalCost / quantity;
    const sym = toYahooSymbol(pos.stockCode, pos.market, pos.exchange);
    // 현재가 조회 실패 시에도 합계 계산이 깨지지 않도록 평균단가를 임시값으로 쓰되,
    // priceAvailable로 실제 조회 여부를 구분해 UI가 정상 현재가처럼 보여주지 않게 한다.
    const priceAvailable = priceMap[sym] != null;
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
      priceAvailable,
      pnlRate: calcPnlRate(pnl, totalCost),
      oversoldQty: pos.oversoldQty,
    });
  }
  return result;
}

export type CurrencyHolding = {
  currency: "KRW" | "USD";
  evalAmount: number;
  totalCost: number;
};

export type CurrencyAggregate = {
  evalKRW: number;
  evalUSD: number;
  costKRW: number;
  costUSD: number;
  unrealizedKRW: number;
  unrealizedUSD: number;
  returnRateKRW: number;
  returnRateUSD: number;
};

// 보유종목 목록을 KRW/USD로 나눠 평가금액·매입원가·평가손익·수익률을 합산
export function aggregateByCurrency(
  holdings: CurrencyHolding[],
): CurrencyAggregate {
  let evalKRW = 0,
    evalUSD = 0,
    costKRW = 0,
    costUSD = 0;

  for (const h of holdings) {
    if (h.currency === "KRW") {
      evalKRW += h.evalAmount;
      costKRW += h.totalCost;
    } else {
      evalUSD += h.evalAmount;
      costUSD += h.totalCost;
    }
  }

  const unrealizedKRW = evalKRW - costKRW;
  const unrealizedUSD = evalUSD - costUSD;

  return {
    evalKRW,
    evalUSD,
    costKRW,
    costUSD,
    unrealizedKRW,
    unrealizedUSD,
    returnRateKRW: costKRW > 0 ? (unrealizedKRW / costKRW) * 100 : 0,
    returnRateUSD: costUSD > 0 ? (unrealizedUSD / costUSD) * 100 : 0,
  };
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

// 거래 목록에서 FIFO 방식으로 매매 행(TradeRow)을 생성 (최신 거래부터 반환)
export function buildTradeRows(trades: Trade[]): TradeRow[] {
  const result: TradeRow[] = [];

  runFifo(trades, (trade, _pos, sell) => {
    const base = {
      id: trade.id,
      date: trade.tradeDate,
      quantity: trade.quantity,
      price: trade.price,
      total: trade.price * trade.quantity,
      memo: trade.memo,
    };
    if (!sell) {
      result.push({ ...base, type: "BUY" });
      return;
    }

    const { matched } = sell;
    let avgHoldingDays: number | undefined;
    let holdingRange: string | undefined;
    let pnlRate: number | undefined;
    let realizedPnl: number | undefined;

    if (matched.length > 0) {
      const totalQty = matched.reduce((s, l) => s + l.qty, 0);
      const avgBuyPrice =
        matched.reduce((s, l) => s + l.qty * l.price, 0) / totalQty;
      const totalWeightedDays = matched.reduce(
        (s, l) => s + daysBetween(l.date, trade.tradeDate) * l.qty,
        0,
      );
      avgHoldingDays = Math.round(totalWeightedDays / totalQty);
      holdingRange = `${fmtYYMMDD(matched[0]!.date)}~${fmtYYMMDD(trade.tradeDate)}`;
      realizedPnl = calcRealizedPnl(trade.price, avgBuyPrice, totalQty);
      pnlRate = calcRealizedPnlRate(realizedPnl, avgBuyPrice, totalQty);
    }

    result.push({
      ...base,
      type: "SELL",
      avgHoldingDays,
      holdingRange,
      pnlRate,
      realizedPnl,
      // 매수 잔고보다 많이 매도해 일부(또는 전부) 수량을 매칭하지 못한 경우
      oversold: sell.unmatchedQty > 0,
    });
  });

  return result.reverse();
}

export type RealizedPnl = { KRW: number; USD: number; oversold: boolean };

// 전체 거래 내역에서 FIFO 방식으로 실현손익을 통화별로 계산
export function computeRealizedPnl(trades: Trade[]): RealizedPnl {
  const result: RealizedPnl = { KRW: 0, USD: 0, oversold: false };

  runFifo(trades, (t, pos, sell) => {
    if (!sell) return;
    // 잔고보다 큰 매도로 매칭되지 못한 수량은 실현손익 집계에서 제외됨을 표시
    if (sell.unmatchedQty > 0) result.oversold = true;
    const realized = sell.matched.reduce(
      (s, lot) => s + (t.price - lot.price) * lot.qty,
      0,
    );
    if (pos.currency === "KRW") result.KRW += realized;
    else result.USD += realized;
  });

  return result;
}
