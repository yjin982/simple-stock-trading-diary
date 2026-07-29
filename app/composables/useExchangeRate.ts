import type { QuotePriceMap } from "~/types";

const USD_KRW_SYMBOL = "USDKRW=X";

export function useExchangeRate() {
  const usdKrw = useState<number | null>("exchangeRate-usdKrw", () => null);
  const fetching = useState<boolean>("exchangeRate-fetching", () => false);

  // 여러 컴포넌트가 동시에 이 composable을 호출해도 실제 요청은 한 번만
  // 나가도록 진행 중 여부를 useState로 공유한다 (SSR에서는 요청별로 격리됨).
  if (import.meta.client && !fetching.value) {
    fetching.value = true;
    $fetch<QuotePriceMap>("/api/stock/quote", {
      query: { symbols: USD_KRW_SYMBOL },
    })
      .then((data) => {
        usdKrw.value = data[USD_KRW_SYMBOL]?.price ?? usdKrw.value;
      })
      .catch(() => {
        // 조회 실패 시 기존 값 유지
      })
      .finally(() => {
        fetching.value = false;
      });
  }

  return { usdKrw };
}
