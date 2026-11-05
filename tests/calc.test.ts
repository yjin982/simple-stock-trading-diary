import { beforeEach, describe, expect, it } from "vitest";
import type { Trade } from "~/types";
import {
  aggregateByCurrency,
  buildFifoPositions,
  buildTradeRows,
  calcPnlRate,
  computeHoldingsFromPositions,
  computeRealizedPnl,
  lotsCost,
  lotsQty,
  sortTradesAsc,
  wouldIntroduceOversell,
  type FifoPosition,
} from "~/utils/calc";

// 테스트용 거래 생성. 만든 순서대로 createdAt이 1초씩 늘어나므로
// 같은 날짜·같은 sequence에서는 먼저 만든 거래가 앞선다.
let createdCount = 0;

beforeEach(() => {
  createdCount = 0;
});

type TradeInput = Partial<Trade> & Pick<Trade, "type" | "tradeDate" | "quantity" | "price">;

function trade(input: TradeInput): Trade {
  createdCount += 1;
  return {
    id: `t${createdCount}`,
    userId: "u1",
    accountId: "a1",
    stockCode: "005930",
    stockName: "삼성전자",
    market: "KR",
    exchange: "KOSPI",
    currency: "KRW",
    sequence: 0,
    createdAt: new Date(Date.UTC(2026, 0, 1) + createdCount * 1000).toISOString(),
    ...input,
  };
}

function buy(tradeDate: string, quantity: number, price: number, extra: Partial<Trade> = {}) {
  return trade({ type: "BUY", tradeDate, quantity, price, ...extra });
}

function sell(tradeDate: string, quantity: number, price: number, extra: Partial<Trade> = {}) {
  return trade({ type: "SELL", tradeDate, quantity, price, ...extra });
}

function usStock(extra: Partial<Trade> = {}): Partial<Trade> {
  return { stockCode: "AAPL", stockName: "Apple", market: "US", exchange: undefined, currency: "USD", ...extra };
}

function lotValues(pos: FifoPosition | undefined) {
  return pos?.lots.map((l) => ({ qty: l.qty, price: l.price }));
}

const KEY = "a1|KR|005930";

describe("sortTradesAsc", () => {
  it("거래일 → sequence → createdAt 순으로 정렬하고 원본 배열은 바꾸지 않는다", () => {
    const t1 = buy("2026-01-02", 1, 100);
    const t2 = sell("2026-01-01", 1, 100, { sequence: 1 });
    const t3 = buy("2026-01-01", 1, 100, { sequence: 0 });
    const t4 = buy("2026-01-01", 1, 100, { sequence: 1 });
    const input = [t1, t2, t3, t4];

    expect(sortTradesAsc(input).map((t) => t.id)).toEqual([t3.id, t2.id, t4.id, t1.id]);
    expect(input.map((t) => t.id)).toEqual([t1.id, t2.id, t3.id, t4.id]);
  });
});

describe("buildFifoPositions", () => {
  it("부분 매도는 가장 먼저 산 lot부터 소진한다", () => {
    const positions = buildFifoPositions([
      buy("2026-01-01", 10, 100),
      buy("2026-01-02", 10, 200),
      sell("2026-01-03", 15, 300),
    ]);
    const pos = positions.get(KEY)!;

    expect(lotValues(pos)).toEqual([{ qty: 5, price: 200 }]);
    expect(lotsQty(pos.lots)).toBe(5);
    expect(lotsCost(pos.lots)).toBe(1000);
    expect(pos.oversoldQty).toBe(0);
  });

  it("입력 순서와 상관없이 거래일 순으로 계산한다", () => {
    const positions = buildFifoPositions([
      sell("2026-01-03", 15, 300),
      buy("2026-01-02", 10, 200),
      buy("2026-01-01", 10, 100),
    ]);

    expect(lotValues(positions.get(KEY))).toEqual([{ qty: 5, price: 200 }]);
  });

  it("같은 날짜에서는 sequence 순서에 따라 결과가 달라진다", () => {
    const buyThenSell = buildFifoPositions([
      buy("2026-01-01", 10, 100, { sequence: 0 }),
      sell("2026-01-01", 10, 120, { sequence: 1 }),
    ]).get(KEY)!;
    expect(lotsQty(buyThenSell.lots)).toBe(0);
    expect(buyThenSell.oversoldQty).toBe(0);

    const sellThenBuy = buildFifoPositions([
      buy("2026-01-01", 10, 100, { sequence: 1 }),
      sell("2026-01-01", 10, 120, { sequence: 0 }),
    ]).get(KEY)!;
    expect(lotsQty(sellThenBuy.lots)).toBe(10);
    expect(sellThenBuy.oversoldQty).toBe(10);
  });

  it("보유 수량보다 많이 판 수량은 oversoldQty로 남긴다", () => {
    const pos = buildFifoPositions([buy("2026-01-01", 5, 100), sell("2026-01-02", 8, 120)]).get(KEY)!;

    expect(pos.lots).toHaveLength(0);
    expect(pos.oversoldQty).toBe(3);
  });

  it("매수 없이 매도만 있어도 포지션을 만들고 초과 매도로 표시한다", () => {
    const pos = buildFifoPositions([sell("2026-01-01", 4, 100)]).get(KEY);

    expect(pos).toBeDefined();
    expect(pos!.lots).toHaveLength(0);
    expect(pos!.oversoldQty).toBe(4);
  });

  it("계좌가 다르면 같은 종목이라도 따로 계산한다", () => {
    const positions = buildFifoPositions([
      buy("2026-01-01", 10, 100, { accountId: "a1" }),
      buy("2026-01-01", 5, 100, { accountId: "a2" }),
      sell("2026-01-02", 5, 120, { accountId: "a2" }),
    ]);

    expect(lotsQty(positions.get("a1|KR|005930")!.lots)).toBe(10);
    expect(lotsQty(positions.get("a2|KR|005930")!.lots)).toBe(0);
  });

  it("KR과 US에 같은 종목코드가 있어도 섞이지 않는다", () => {
    const positions = buildFifoPositions([
      buy("2026-01-01", 10, 100, { stockCode: "ABC" }),
      buy("2026-01-01", 5, 10, usStock({ stockCode: "ABC" })),
      sell("2026-01-02", 3, 12, usStock({ stockCode: "ABC" })),
    ]);

    expect(lotsQty(positions.get("a1|KR|ABC")!.lots)).toBe(10);
    expect(lotsQty(positions.get("a1|US|ABC")!.lots)).toBe(2);
  });

  it("미국 주식의 소수점 수량을 매도할 수 있다", () => {
    const pos = buildFifoPositions([
      buy("2026-01-01", 0.5, 10, usStock()),
      buy("2026-01-02", 0.25, 12, usStock()),
      sell("2026-01-03", 0.75, 15, usStock()),
    ]).get("a1|US|AAPL")!;

    expect(pos.lots).toHaveLength(0);
    expect(pos.oversoldQty).toBe(0);
  });
});

describe("computeHoldingsFromPositions", () => {
  it("현재가로 평가금액·손익·수익률을 계산한다", () => {
    const positions = buildFifoPositions([buy("2026-01-01", 10, 100)]);
    const [h] = computeHoldingsFromPositions(positions.values(), { "005930.KS": 150 });

    expect(h).toMatchObject({
      quantity: 10,
      avgPrice: 100,
      totalCost: 1000,
      currentPrice: 150,
      evalAmount: 1500,
      pnl: 500,
      pnlRate: 50,
      priceAvailable: true,
    });
  });

  it("현재가가 없으면 평균단가로 대신하고 priceAvailable을 false로 둔다", () => {
    const positions = buildFifoPositions([buy("2026-01-01", 10, 100)]);
    const [h] = computeHoldingsFromPositions(positions.values(), {});

    expect(h).toMatchObject({ currentPrice: 100, pnl: 0, priceAvailable: false });
  });

  it("거래소별 Yahoo 심볼로 가격을 찾는다", () => {
    const positions = buildFifoPositions([
      buy("2026-01-01", 1, 100, { stockCode: "035720", exchange: "KOSDAQ" }),
      buy("2026-01-01", 1, 10, usStock()),
    ]);
    const holdings = computeHoldingsFromPositions(positions.values(), { "035720.KQ": 110, AAPL: 11 });

    expect(holdings.map((h) => h.priceAvailable)).toEqual([true, true]);
  });

  it("전량 매도한 포지션은 제외한다", () => {
    const positions = buildFifoPositions([buy("2026-01-01", 10, 100), sell("2026-01-02", 10, 120)]);

    expect(computeHoldingsFromPositions(positions.values(), {})).toEqual([]);
  });
});

describe("computeRealizedPnl", () => {
  it("매칭된 lot마다 (매도가 - 매수가) × 수량을 더한다", () => {
    const result = computeRealizedPnl([
      buy("2026-01-01", 10, 100),
      buy("2026-01-02", 10, 200),
      sell("2026-01-03", 15, 300),
    ]);

    expect(result).toEqual({ KRW: 2500, USD: 0, oversold: false });
  });

  it("USD 종목은 USD로 따로 집계한다", () => {
    const result = computeRealizedPnl([
      buy("2026-01-01", 2, 10, usStock()),
      sell("2026-01-02", 1, 15, usStock()),
    ]);

    expect(result).toEqual({ KRW: 0, USD: 5, oversold: false });
  });

  it("초과 매도분은 손익에서 빼고 oversold로 표시한다", () => {
    const result = computeRealizedPnl([buy("2026-01-01", 5, 100), sell("2026-01-02", 8, 120)]);

    expect(result).toEqual({ KRW: 100, USD: 0, oversold: true });
  });

  it("다른 계좌의 매수 lot과 매칭하지 않는다", () => {
    const result = computeRealizedPnl([
      buy("2026-01-01", 10, 100, { accountId: "a1" }),
      buy("2026-01-02", 10, 200, { accountId: "a2" }),
      sell("2026-01-03", 10, 300, { accountId: "a2" }),
    ]);

    expect(result.KRW).toBe(1000);
  });
});

describe("buildTradeRows", () => {
  it("최신 거래부터 반환하고, 매도 행에 실현손익·보유기간을 붙인다", () => {
    const b1 = buy("2026-01-01", 10, 100);
    const b2 = buy("2026-01-11", 10, 200);
    const s1 = sell("2026-01-21", 15, 300);
    const rows = buildTradeRows([b1, b2, s1]);

    expect(rows.map((r) => r.id)).toEqual([s1.id, b2.id, b1.id]);
    expect(rows[1]).toMatchObject({ type: "BUY", quantity: 10, price: 200, total: 2000 });

    const sellRow = rows[0]!;
    expect(sellRow.realizedPnl).toBeCloseTo(2500);
    expect(sellRow.pnlRate).toBeCloseTo(125);
    // (20일 × 10주 + 10일 × 5주) / 15주 = 16.67 → 17
    expect(sellRow.avgHoldingDays).toBe(17);
    expect(sellRow.holdingRange).toBe("26/01/01~26/01/21");
    expect(sellRow.oversold).toBe(false);
  });

  it("초과 매도는 매칭된 수량만으로 손익을 계산하고 oversold로 표시한다", () => {
    const [sellRow] = buildTradeRows([buy("2026-01-01", 5, 100), sell("2026-01-02", 8, 120)]);

    expect(sellRow!.realizedPnl).toBeCloseTo(100);
    expect(sellRow!.oversold).toBe(true);
  });

  it("매수 없는 매도는 손익 없이 oversold로 표시한다", () => {
    const [sellRow] = buildTradeRows([sell("2026-01-01", 3, 100)]);

    expect(sellRow!.realizedPnl).toBeUndefined();
    expect(sellRow!.oversold).toBe(true);
  });

  it("매도 행 손익의 합이 computeRealizedPnl과 같다", () => {
    const trades = [
      buy("2026-01-01", 10, 100),
      sell("2026-01-02", 4, 150),
      buy("2026-01-03", 6, 120),
      sell("2026-01-04", 8, 130),
    ];
    const rowsTotal = buildTradeRows(trades).reduce((s, r) => s + (r.realizedPnl ?? 0), 0);

    expect(rowsTotal).toBeCloseTo(400);
    expect(computeRealizedPnl(trades).KRW).toBeCloseTo(rowsTotal);
  });
});

describe("wouldIntroduceOversell", () => {
  it("이후 매도가 쓰던 매수를 지우면 true", () => {
    const b1 = buy("2026-01-01", 10, 100);
    const s1 = sell("2026-01-02", 10, 120);

    expect(wouldIntroduceOversell([b1, s1], [s1])).toBe(true);
  });

  it("남은 매수로 매도를 감당할 수 있으면 false", () => {
    const b1 = buy("2026-01-01", 10, 100);
    const b2 = buy("2026-01-02", 10, 100);
    const s1 = sell("2026-01-03", 5, 120);

    expect(wouldIntroduceOversell([b1, b2, s1], [b1, s1])).toBe(false);
  });

  it("매수일을 매도 뒤로 옮기면 true", () => {
    const b1 = buy("2026-01-01", 10, 100);
    const s1 = sell("2026-01-02", 10, 120);

    expect(wouldIntroduceOversell([b1, s1], [{ ...b1, tradeDate: "2026-01-03" }, s1])).toBe(true);
  });

  it("이미 있던 초과 매도가 더 늘지 않으면 false", () => {
    const trades = [buy("2026-01-01", 5, 100), sell("2026-01-02", 8, 120)];

    expect(wouldIntroduceOversell(trades, [...trades])).toBe(false);
  });
});

describe("aggregateByCurrency / calcPnlRate", () => {
  it("KRW와 USD를 따로 합산한다", () => {
    const agg = aggregateByCurrency([
      { currency: "KRW", evalAmount: 1500, totalCost: 1000 },
      { currency: "USD", evalAmount: 90, totalCost: 100 },
    ]);

    expect(agg).toMatchObject({
      unrealizedKRW: 500,
      returnRateKRW: 50,
      unrealizedUSD: -10,
      returnRateUSD: -10,
    });
  });

  it("매입금액이 0이면 수익률은 0", () => {
    expect(calcPnlRate(100, 0)).toBe(0);
    expect(aggregateByCurrency([]).returnRateKRW).toBe(0);
  });
});
