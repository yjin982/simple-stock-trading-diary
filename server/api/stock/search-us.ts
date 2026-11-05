import YahooFinance from "yahoo-finance2";
import type { Stock } from "~/types";

const yahooFinance = new YahooFinance();

// 외부 호출에만 캐시를 건다 (1시간). 검색어는 소문자로 맞춰 같은 검색을 한 번만 호출한다.
const searchUsStocks = defineCachedFunction(
  async (query: string): Promise<Stock[]> => {
    const result = await yahooFinance.search(query, {
      quotesCount: 20,
      newsCount: 0,
    });

    return result.quotes.flatMap((q): Stock[] => {
      // 검색 결과에는 Yahoo 외부 항목처럼 필드 타입이 정해지지 않은 항목도 섞여 있어 직접 확인한다
      if (q.quoteType !== "EQUITY" && q.quoteType !== "ETF") return [];
      if (!("symbol" in q) || typeof q.symbol !== "string") return [];
      const name = [q.shortname, q.longname].find((v): v is string => typeof v === "string");
      return [{
        code: q.symbol,
        name: name ?? q.symbol,
        market: "US",
        currency: "USD",
        price: 0,
      }];
    });
  },
  {
    name: "stock-search-us",
    maxAge: 60 * 60,
    getKey: (query: string) => query,
  },
);

export default defineEventHandler(async (event) => {
  await requireUser(event);

  const { name } = getQuery(event);
  const query = typeof name === "string" ? name.trim().toLowerCase() : "";
  if (!query) {
    throw createError({
      statusCode: 400,
      statusMessage: "검색어(name)가 필요합니다.",
    });
  }

  try {
    return await searchUsStocks(query);
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "종목 검색 서버에서 응답을 받지 못했습니다.",
    });
  }
});
