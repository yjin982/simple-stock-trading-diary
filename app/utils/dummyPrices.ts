// yahoo-finance 연동 전 임시 현재가 더미 데이터
export const DUMMY_PRICES: Record<string, number> = {
  // 국내 (KRW)
  '005930': 74800,   // 삼성전자
  '000660': 193500,  // SK하이닉스
  '035420': 195000,  // NAVER
  '035720': 46450,   // 카카오
  '005380': 243000,  // 현대차
  '000270': 98500,   // 기아
  '068270': 790000,  // 셀트리온
  '051910': 345000,  // LG화학
  '373220': 380000,  // LG에너지솔루션
  '003550': 71000,   // LG
  '012330': 273000,  // 현대모비스
  '028260': 157000,  // 삼성물산
  '066570': 92500,   // LG전자
  // 해외 (USD)
  'AAPL': 218.50,
  'MSFT': 421.30,
  'NVDA': 131.20,
  'TSLA': 248.70,
  'AMZN': 198.40,
  'GOOGL': 175.60,
  'META': 527.80,
  'NFLX': 695.00,
  'AMD': 162.30,
}

export function getDummyPrice(stockCode: string, fallback: number): number {
  return DUMMY_PRICES[stockCode] ?? fallback
}
