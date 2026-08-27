// KR/US 시장에 같은 종목코드가 존재할 수 있어, 종목을 식별할 때는
// stockCode 단독이 아니라 market까지 포함해 키를 구성해야 한다.
export function stockKey(market: "KR" | "US", stockCode: string): string {
  return `${market}|${stockCode}`;
}
