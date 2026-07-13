import YahooFinance from "yahoo-finance2";
import type { Stock } from "~/types";

const yahooFinance = new YahooFinance();

export default defineCachedEventHandler(async (event) => {
  const { name } = getQuery(event);
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "검색어(name)가 필요합니다.",
    });
  }

  // yahoo-finance2 v3 오버로드 해석 오류를 피하기 위해 any 캐스팅 후 결과 타입 명시
  const result = (await (yahooFinance as any).search(String(name), {
    quotesCount: 20,
    newsCount: 0,
  })) as {
    quotes: Array<{
      symbol: string;
      shortname?: string;
      longname?: string;
      quoteType?: string;
    }>;
  };

  return (result.quotes ?? [])
    .filter((q) => q.quoteType === "EQUITY")
    .map(
      (q): Stock => ({
        code: q.symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        market: "US",
        currency: "USD",
        price: 0,
      }),
    );
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { name } = getQuery(event);
    return `stock-search-us:${String(name).toLowerCase().trim()}`;
  },
});
