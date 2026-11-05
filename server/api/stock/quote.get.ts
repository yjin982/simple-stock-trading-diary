import YahooFinance from "yahoo-finance2";
import type { QuotePriceMap } from "~/types";

const yahooFinance = new YahooFinance();

const MAX_SYMBOLS = 50;
// 미국 티커(BRK.B), 국내(005930.KS), 환율(USDKRW=X), 지수(^GSPC) 형식만 허용
const SYMBOL_PATTERN = /^[A-Za-z0-9.=^-]{1,20}$/;

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

// 외부 호출에만 캐시를 건다 (15분). 실패한 호출은 캐시되지 않는다.
const fetchQuotes = defineCachedFunction(
  async (symbols: string[]): Promise<QuotePriceMap> => {
    const quotes = await yahooFinance.quote(symbols);

    const result: QuotePriceMap = {};
    for (const quote of quotes) {
      if (!quote?.symbol || quote.regularMarketPrice == null) continue;
      const t = quote.regularMarketTime;
      const key = resolveRequestedSymbol(symbols, quote.symbol);
      result[key] = {
        price: quote.regularMarketPrice,
        time: t instanceof Date ? t.toISOString() : null,
      };
    }
    return result;
  },
  {
    name: "stock-quote",
    maxAge: 60 * 15,
    getKey: (symbols: string[]) => [...symbols].sort().join(","),
  },
);

export default defineEventHandler(async (event): Promise<QuotePriceMap> => {
  await requireUser(event);

  const { symbols } = getQuery(event);
  if (!symbols) {
    throw createError({
      statusCode: 400,
      statusMessage: "symbols 파라미터가 필요합니다.",
    });
  }

  const symbolList = [
    ...new Set(
      String(symbols)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];

  if (symbolList.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "유효한 심볼이 없습니다.",
    });
  }
  if (symbolList.length > MAX_SYMBOLS) {
    throw createError({
      statusCode: 400,
      statusMessage: `심볼은 최대 ${MAX_SYMBOLS}개까지 조회할 수 있습니다.`,
    });
  }
  const invalid = symbolList.find((s) => !SYMBOL_PATTERN.test(s));
  if (invalid) {
    throw createError({
      statusCode: 400,
      statusMessage: `잘못된 심볼 형식입니다: ${invalid}`,
    });
  }

  try {
    return await fetchQuotes(symbolList);
  } catch {
    // Yahoo 차단·장애 등 외부 원인. 클라이언트는 이 경우 가격 조회 실패로 표시한다.
    throw createError({
      statusCode: 502,
      statusMessage: "시세 서버에서 응답을 받지 못했습니다.",
    });
  }
});
