export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          user_id: string
          account_id: string
          type: 'BUY' | 'SELL'
          stock_code: string
          stock_name: string
          market: 'KR' | 'US'
          exchange: 'KOSPI' | 'KOSDAQ' | null
          currency: 'KRW' | 'USD'
          price: number
          quantity: number
          trade_date: string
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          type: 'BUY' | 'SELL'
          stock_code: string
          stock_name: string
          market: 'KR' | 'US'
          exchange?: 'KOSPI' | 'KOSDAQ' | null
          currency: 'KRW' | 'USD'
          price: number
          quantity: number
          trade_date: string
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          type?: 'BUY' | 'SELL'
          stock_code?: string
          stock_name?: string
          market?: 'KR' | 'US'
          exchange?: 'KOSPI' | 'KOSDAQ' | null
          currency?: 'KRW' | 'USD'
          price?: number
          quantity?: number
          trade_date?: string
          memo?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trades_account_id_fkey'
            columns: ['account_id']
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
        ]
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          broker_name: string
          alias: string
          account_number: string | null
          currency: 'KRW' | 'USD' | 'BOTH'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          broker_name: string
          alias: string
          account_number?: string | null
          currency: 'KRW' | 'USD' | 'BOTH'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          broker_name?: string
          alias?: string
          account_number?: string | null
          currency?: 'KRW' | 'USD' | 'BOTH'
          created_at?: string
        }
        Relationships: []
      }
      stock_settings: {
        Row: {
          id: string
          user_id: string
          stock_code: string
          stock_name: string
          market: 'KR' | 'US'
          memo: string | null
          target_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stock_code: string
          stock_name: string
          market: 'KR' | 'US'
          memo?: string | null
          target_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stock_code?: string
          stock_name?: string
          market?: 'KR' | 'US'
          memo?: string | null
          target_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
