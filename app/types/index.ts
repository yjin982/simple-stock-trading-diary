export interface TradeItem {
  id?: string;
  type: "BUY" | "SELL";
  currency: "KRW" | "USD";
  stockName: string;
  stockCode: string;
  quantity: number;
  price: number;
  total: number;
  accountName?: string;
  memo?: string;
  date?: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  type: "BUY" | "SELL";
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  exchange?: "KOSPI" | "KOSDAQ";
  currency: "KRW" | "USD";
  price: number;
  quantity: number;
  tradeDate: string;
  memo?: string;
  createdAt: string;
  accountName?: string;
}

export interface Holding {
  accountId: string;
  accountName?: string;
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  currency: "KRW" | "USD";
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlRate: number;
}

export interface Stock {
  code: string;
  name: string;
  market: "KR" | "US";
  exchange?: "KOSPI" | "KOSDAQ";
  currency: "KRW" | "USD";
  price: number;
  stockType?: string;
}

export interface StockSetting {
  id: string;
  userId: string;
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  memo: string | null;
  targetRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRow {
  id?: string;
  date: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  memo?: string;
  avgHoldingDays?: number;
  holdingRange?: string;
  pnlRate?: number;
  realizedPnl?: number;
}

export type QuotePriceMap = Record<
  string,
  { price: number; time: string | null }
>;

export interface Account {
  id: string;
  userId: string;
  brokerName: string;
  alias: string;
  accountNumber?: string;
  currency: "KRW" | "USD" | "BOTH";
  createdAt: string;
}
