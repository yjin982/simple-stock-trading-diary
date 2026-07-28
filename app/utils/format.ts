export function fmtKRW(n: number): string {
  return "₩" + Math.round(Math.abs(n)).toLocaleString("ko-KR");
}

export function fmtUSD(n: number): string {
  return (
    "$" +
    Math.abs(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function fmtCurrency(n: number, currency: "KRW" | "USD"): string {
  return currency === "KRW" ? fmtKRW(n) : fmtUSD(n);
}

export function fmtKRWEquiv(usd: number, rate: number): string {
  const krw = Math.round(usd * rate)
  return `≈ ${krw < 0 ? "-" : ""}₩${Math.abs(krw).toLocaleString("ko-KR")}`
}

export function fmtPnl(n: number, currency: "KRW" | "USD"): string {
  const prefix = n >= 0 ? "+" : "-";
  return prefix + fmtCurrency(n, currency);
}

export function fmtPnlRate(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export function pnlColor(n: number): string {
  return n >= 0 ? "text-red-500" : "text-blue-500";
}

export function pnlTrend(n: number): "positive" | "negative" {
  return n >= 0 ? "positive" : "negative";
}

export function currencyClass(currency: string): string {
  if (currency === "KRW") return "border-blue-200 bg-blue-50 text-blue-700";
  if (currency === "USD") return "border-green-200 bg-green-50 text-green-700";
  return "border-purple-200 bg-purple-50 text-purple-700";
}

export function marketBadgeClass(market: "KR" | "US"): string {
  return market === "KR"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
}
