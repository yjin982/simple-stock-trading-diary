export interface TradeItem {
  type: 'BUY' | 'SELL'
  currency: 'KRW' | 'USD'
  stockName: string
  stockCode: string
  quantity: number
  price: number
  total: number
  accountName?: string
  reason?: string
  date?: string
  pnl?: number
}

export interface Trade {
  id: string
  userId: string
  accountId: string
  type: 'BUY' | 'SELL'
  stockCode: string
  stockName: string
  market: 'KR' | 'US'
  exchange?: 'KOSPI' | 'KOSDAQ'
  currency: 'KRW' | 'USD'
  price: number
  quantity: number
  fee: number
  tradeDate: string
  memo?: string
  createdAt: string
  accountName?: string
}

export interface Holding {
  stockCode: string
  stockName: string
  market: 'KR' | 'US'
  currency: 'KRW' | 'USD'
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlRate: number
}

export interface Stock {
  code: string
  name: string
  market: 'KR' | 'US'
  exchange?: 'KOSPI' | 'KOSDAQ'
  currency: 'KRW' | 'USD'
  price: number
}

export type QuotePriceMap = Record<string, { price: number; time: string | null }>

export interface Account {
  id: string
  userId: string
  brokerName: string
  alias: string
  accountNumber?: string
  currency: 'KRW' | 'USD' | 'BOTH'
  createdAt: string
}
