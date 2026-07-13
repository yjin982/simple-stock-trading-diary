// KOSPI → .KS / KOSDAQ → .KQ / exchange 없으면 KOSPI 기본값
export function toYahooSymbol(
  stockCode: string,
  market: 'KR' | 'US',
  exchange?: 'KOSPI' | 'KOSDAQ',
): string {
  if (market === 'US') return stockCode
  return `${stockCode}${exchange === 'KOSDAQ' ? '.KQ' : '.KS'}`
}
