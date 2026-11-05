import type { QuotePriceMap } from "~/types";

const USD_KRW_SYMBOL = "USDKRW=X";

type RateStatus = "idle" | "loading" | "done" | "failed";

export function useExchangeRate() {
  const usdKrw = useState<number | null>("exchangeRate-usdKrw", () => null);
  const status = useState<RateStatus>("exchangeRate-status", () => "idle");

  // 여러 컴포넌트가 동시에 이 composable을 호출해도 실제 요청은 한 번만
  // 나가도록 진행 중 여부를 useState로 공유한다 (SSR에서는 요청별로 격리됨).
  if (import.meta.client && status.value !== "loading") {
    status.value = "loading";
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
        status.value = usdKrw.value != null ? "done" : "failed";
      });
  }

  const krwEquiv = (usd: number) =>
    usdKrw.value ? fmtKRWEquiv(usd, usdKrw.value) : null;

  // 원화 환산. 환율이 없으면 0을 곱하지 않고 null을 돌려준다
  // (0으로 계산하면 미국 주식이 0원으로 합계·비중에서 조용히 빠진다).
  function toKRW(currency: "KRW" | "USD", amount: number): number | null {
    if (currency === "KRW") return amount;
    return usdKrw.value != null ? amount * usdKrw.value : null;
  }

  // 환율이 없을 때 화면에 보여 줄 이유. 환율이 있으면 null.
  const rateMissingReason = computed(() => {
    if (usdKrw.value != null) return null;
    return status.value === "failed" ? "환율 조회 실패" : "환율 조회 중";
  });

  return { usdKrw, krwEquiv, toKRW, rateMissingReason };
}
