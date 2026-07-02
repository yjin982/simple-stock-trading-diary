import type { TradeItem } from '~/types'

export const DUMMY_TODAY = '2026-07-02'

export const dummyTradeData: Record<string, TradeItem[]> = {
  '2026-07-01': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: 10, price: 75000, total: 750000, reason: '분할 매수 3차' },
    { type: 'SELL', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Apple Inc.', stockCode: 'AAPL', quantity: 2, price: 185.50, total: 371.00, reason: '목표가 달성', pnl: 27 },
  ],
  '2026-06-30': [
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Microsoft Corp.', stockCode: 'MSFT', quantity: 3, price: 425.00, total: 1275.00 },
    { type: 'SELL', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'POSCO홀딩스', stockCode: '005490', quantity: 2, price: 435000, total: 870000, reason: '단기 수익 실현', pnl: 30000 },
  ],
  '2026-06-28': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'LG에너지솔루션', stockCode: '373220', quantity: 2, price: 390000, total: 780000, reason: '2차전지 반등 기대' },
  ],
  '2026-06-25': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'SK하이닉스', stockCode: '000660', quantity: 5, price: 180000, total: 900000, reason: 'HBM 수요 증가 전망' },
  ],
  '2026-06-22': [
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Tesla Inc.', stockCode: 'TSLA', quantity: 5, price: 245.00, total: 1225.00 },
    { type: 'SELL', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Microsoft Corp.', stockCode: 'MSFT', quantity: 2, price: 418.00, total: 836.00, reason: '실적 발표 전 차익 실현', pnl: -4 },
  ],
  '2026-06-20': [
    { type: 'SELL', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: 5, price: 73500, total: 367500, reason: '리밸런싱', pnl: 17500 },
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: 3, price: 890.00, total: 2670.00, reason: 'AI 수요 강세' },
  ],
  '2026-06-18': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '현대차', stockCode: '005380', quantity: 3, price: 245000, total: 735000 },
  ],
  '2026-06-15': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: 5, price: 71000, total: 355000, reason: '분할 매수 2차' },
    { type: 'SELL', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'LG에너지솔루션', stockCode: '373220', quantity: 1, price: 385000, total: 385000, pnl: -5000 },
  ],
  '2026-06-12': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'POSCO홀딩스', stockCode: '005490', quantity: 3, price: 420000, total: 1260000, reason: '철강 업황 개선 기대' },
  ],
  '2026-06-10': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: 20, price: 70000, total: 1400000, reason: '분할 매수 1차' },
  ],
  '2026-06-08': [
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Amazon.com Inc.', stockCode: 'AMZN', quantity: 4, price: 192.00, total: 768.00 },
  ],
  '2026-06-03': [
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Apple Inc.', stockCode: 'AAPL', quantity: 5, price: 172.00, total: 860.00, reason: '조정 후 추가 매수' },
  ],
  '2026-05-30': [
    { type: 'SELL', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '현대차', stockCode: '005380', quantity: 2, price: 250000, total: 500000, reason: '단기 목표가 달성', pnl: 10000 },
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: 2, price: 870.00, total: 1740.00 },
  ],
  '2026-05-28': [
    { type: 'SELL', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'SK하이닉스', stockCode: '000660', quantity: 10, price: 175000, total: 1750000, reason: '반도체 업황 불확실성', pnl: 70000 },
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Microsoft Corp.', stockCode: 'MSFT', quantity: 2, price: 420.00, total: 840.00, reason: 'AI 클라우드 성장성' },
  ],
  '2026-05-22': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'LG에너지솔루션', stockCode: '373220', quantity: 3, price: 380000, total: 1140000 },
  ],
  '2026-05-15': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: 'SK하이닉스', stockCode: '000660', quantity: 15, price: 168000, total: 2520000, reason: 'RSI 과매도 구간' },
  ],
  '2026-05-10': [
    { type: 'SELL', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Amazon.com Inc.', stockCode: 'AMZN', quantity: 3, price: 198.00, total: 594.00, reason: '3% 수익 실현', pnl: 39 },
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '현대차', stockCode: '005380', quantity: 5, price: 238000, total: 1190000, reason: '실적 개선 기대' },
  ],
  '2026-05-01': [
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Tesla Inc.', stockCode: 'TSLA', quantity: 3, price: 220.00, total: 660.00 },
  ],
  '2026-04-30': [
    { type: 'SELL', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: 1, price: 950.00, total: 950.00, reason: '10% 수익 목표 달성', pnl: 130 },
  ],
  '2026-04-25': [
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '삼성SDI', stockCode: '006400', quantity: 2, price: 320000, total: 640000 },
    { type: 'SELL', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Tesla Inc.', stockCode: 'TSLA', quantity: 2, price: 230.00, total: 460.00, reason: '손실 제한', pnl: -30 },
  ],
  '2026-04-20': [
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'Amazon.com Inc.', stockCode: 'AMZN', quantity: 5, price: 185.00, total: 925.00, reason: '어닝 시즌 기대' },
  ],
  '2026-04-15': [
    { type: 'BUY', currency: 'USD', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: 4, price: 820.00, total: 3280.00, reason: 'AI GPU 수요 강세' },
    { type: 'BUY', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '카카오', stockCode: '035720', quantity: 20, price: 52000, total: 1040000 },
  ],
  '2026-04-10': [
    { type: 'SELL', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '삼성SDI', stockCode: '006400', quantity: 3, price: 330000, total: 990000, reason: '단기 반등 이후 매도', pnl: 30000 },
  ],
  '2026-04-01': [
    { type: 'SELL', currency: 'KRW', accountName: '한국투자 국내주식', stockName: '카카오', stockCode: '035720', quantity: 30, price: 58000, total: 1740000, reason: '목표 수익률 달성', pnl: 180000 },
  ],
}

export const dummyHoldings = [
  { stockName: '삼성전자', stockCode: '005930', market: 'KR', currency: 'KRW' as const, quantity: 25, avgPrice: 71000, currentPrice: 75000, pnl: 100000, pnlRate: 5.63 },
  { stockName: 'Apple Inc.', stockCode: 'AAPL', market: 'US', currency: 'USD' as const, quantity: 3, avgPrice: 172.00, currentPrice: 185.50, pnl: 40.50, pnlRate: 7.85 },
  { stockName: 'SK하이닉스', stockCode: '000660', market: 'KR', currency: 'KRW' as const, quantity: 5, avgPrice: 180000, currentPrice: 183000, pnl: 15000, pnlRate: 1.67 },
  { stockName: 'NVIDIA Corp.', stockCode: 'NVDA', market: 'US', currency: 'USD' as const, quantity: 3, avgPrice: 890.00, currentPrice: 920.00, pnl: 90.00, pnlRate: 3.37 },
]

export const dummyStocks: Array<{ code: string; name: string; market: 'KR' | 'US'; currency: 'KRW' | 'USD'; price: number }> = [
  { code: '005930', name: '삼성전자', market: 'KR', currency: 'KRW', price: 75000 },
  { code: '000660', name: 'SK하이닉스', market: 'KR', currency: 'KRW', price: 183000 },
  { code: '035420', name: 'NAVER', market: 'KR', currency: 'KRW', price: 215000 },
  { code: '035720', name: '카카오', market: 'KR', currency: 'KRW', price: 42000 },
  { code: '207940', name: '삼성바이오로직스', market: 'KR', currency: 'KRW', price: 895000 },
  { code: '068270', name: '셀트리온', market: 'KR', currency: 'KRW', price: 178000 },
  { code: 'AAPL', name: 'Apple Inc.', market: 'US', currency: 'USD', price: 185.50 },
  { code: 'NVDA', name: 'NVIDIA Corp.', market: 'US', currency: 'USD', price: 920.00 },
  { code: 'TSLA', name: 'Tesla Inc.', market: 'US', currency: 'USD', price: 245.00 },
  { code: 'MSFT', name: 'Microsoft Corp.', market: 'US', currency: 'USD', price: 415.00 },
  { code: 'GOOGL', name: 'Alphabet Inc.', market: 'US', currency: 'USD', price: 178.50 },
  { code: 'META', name: 'Meta Platforms', market: 'US', currency: 'USD', price: 560.00 },
]

export const dummyAccounts: Array<{ id: string; displayName: string }> = [
  { id: '1', displayName: 'ISA계좌 (한국투자증권)' },
  { id: '2', displayName: '일반위탁 (키움증권)' },
  { id: '3', displayName: '1234-5678 (토스증권)' },
]
