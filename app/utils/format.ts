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
