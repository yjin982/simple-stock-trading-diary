import YahooFinance from "yahoo-finance2";
import type { QuotePriceMap } from "~/types";

const yahooFinance = new YahooFinance();

// Yahoo는 "USDKRW=X"로 요청해도 응답 symbol을 "KRW=X"처럼 축약형으로
// 돌려줄 때가 있다 (같은 심볼도 요청마다 비일관적). 응답을 요청 심볼 기준으로
// 매핑해야 클라이언트의 키 조회(priceMap[symbol])가 항상 일치한다.
function resolveRequestedSymbol(
  requested: string[],
  returnedSymbol: string,
): string {
  if (requested.includes(returnedSymbol)) return returnedSymbol;
  const match = requested.find(
    (s) => s.startsWith("USD") && s.endsWith("=X") && s.slice(3) === returnedSymbol,
  );
  return match ?? returnedSymbol;
}

export default defineCachedEventHandler(
  async (event): Promise<QuotePriceMap> => {
    const { symbols } = getQuery(event);
    if (!symbols) {
      throw createError({
        statusCode: 400,
        statusMessage: "symbols 파라미터가 필요합니다.",
      });
    }

    const symbolList = String(symbols)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (symbolList.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "유효한 심볼이 없습니다.",
      });
    }
    const MAX_SYMBOLS = 50;
    if (symbolList.length > MAX_SYMBOLS) {
      throw createError({
        statusCode: 400,
        statusMessage: `심볼은 최대 ${MAX_SYMBOLS}개까지 조회할 수 있습니다.`,
      });
    }

    const raw = await (yahooFinance as any).quote(symbolList);
    const quotes: Array<{
      symbol: string;
      regularMarketPrice?: number;
      regularMarketTime?: Date | number;
    }> = Array.isArray(raw) ? raw : [raw];

    const result: QuotePriceMap = {};
    for (const quote of quotes) {
      if (!quote?.symbol || quote.regularMarketPrice == null) continue;
      const t = quote.regularMarketTime;
      const isoTime =
        t instanceof Date
          ? t.toISOString()
          : typeof t === "number"
            ? new Date(t * 1000).toISOString()
            : null;
      const key = resolveRequestedSymbol(symbolList, quote.symbol);
      result[key] = { price: quote.regularMarketPrice, time: isoTime };
    }

    return result;
  },
  {
    maxAge: 60 * 15, // 15분 캐시
    getKey: (event) => {
      const { symbols } = getQuery(event);
      const sorted = String(symbols ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .sort()
        .join(",");
      return `stock-quote:${sorted}`;
    },
  },
);
