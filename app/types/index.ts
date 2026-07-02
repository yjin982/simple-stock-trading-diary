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

export interface Stock {
  code: string
  name: string
  market: 'KR' | 'US'
  currency: 'KRW' | 'USD'
  price: number
}

export interface Account {
  id: string
  displayName: string
}

export interface NewAccount extends Account {
  broker: string
  alias: string
  accountNumber: string
}
