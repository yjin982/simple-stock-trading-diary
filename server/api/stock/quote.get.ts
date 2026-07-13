import YahooFinance from "yahoo-finance2";
import type { QuotePriceMap } from "~/types";

const yahooFinance = new YahooFinance();

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
      result[quote.symbol] = { price: quote.regularMarketPrice, time: isoTime };
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
