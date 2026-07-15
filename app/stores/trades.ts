import type { Trade, TradeItem } from '~/types'

type TradeRow = {
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
  accounts?: { alias: string; broker_name: string } | null
}

function mapTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id,
    type: row.type,
    stockCode: row.stock_code,
    stockName: row.stock_name,
    market: row.market,
    exchange: row.exchange ?? undefined,
    currency: row.currency,
    price: Number(row.price),
    quantity: Number(row.quantity),
    tradeDate: row.trade_date.slice(0, 10),
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    accountName: row.accounts
      ? `${row.accounts.alias} (${row.accounts.broker_name})`
      : undefined,
  }
}

export const useTradesStore = defineStore('trades', () => {
  const client = useSupabaseClient()

  const items = ref<Trade[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const tradesByDate = computed<Record<string, TradeItem[]>>(() => {
    const groups: Record<string, TradeItem[]> = {}
    for (const trade of items.value) {
      const date = trade.tradeDate
      if (!groups[date]) groups[date] = []
      groups[date].push({
        id: trade.id,
        type: trade.type,
        currency: trade.currency,
        stockName: trade.stockName,
        stockCode: trade.stockCode,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.price * trade.quantity,
        accountName: trade.accountName,
        memo: trade.memo,
        date: trade.tradeDate,
      })
    }
    return groups
  })

  async function fetchAll() {
    loading.value = true
    error.value = null

    const { data, error: err } = await client
      .from('trades')
      .select('*, accounts(alias, broker_name)')
      .order('trade_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (err) error.value = err.message
    else items.value = (data as TradeRow[]).map(mapTrade)

    loading.value = false
  }

  async function add(payload: {
    accountId: string
    type: 'BUY' | 'SELL'
    stockCode: string
    stockName: string
    market: 'KR' | 'US'
    exchange?: 'KOSPI' | 'KOSDAQ'
    currency: 'KRW' | 'USD'
    price: number
    quantity: number
    tradeDate: string
    memo?: string
  }): Promise<Trade | null> {
    error.value = null

    const { data: { session } } = await client.auth.getSession()
    if (!session) { error.value = '로그인이 필요합니다.'; return null }

    const { data, error: err } = await client
      .from('trades')
      .insert({
        user_id: session.user.id,
        account_id: payload.accountId,
        type: payload.type,
        stock_code: payload.stockCode,
        stock_name: payload.stockName,
        market: payload.market,
        exchange: payload.exchange ?? null,
        currency: payload.currency,
        price: payload.price,
        quantity: payload.quantity,
        trade_date: payload.tradeDate,
        memo: payload.memo || null,
      })
      .select('*, accounts(alias, broker_name)')
      .single()

    if (err) { error.value = err.message; return null }

    const trade = mapTrade(data as TradeRow)
    items.value.unshift(trade)

    // 최초 거래 종목이면 stock_settings 레코드 자동 생성
    const stockSettingsStore = useStockSettingsStore()
    await stockSettingsStore.upsertMeta(payload.stockCode, payload.stockName, payload.market)

    return trade
  }

  async function update(id: string, payload: {
    accountId: string
    type: 'BUY' | 'SELL'
    stockCode: string
    stockName: string
    market: 'KR' | 'US'
    exchange?: 'KOSPI' | 'KOSDAQ'
    currency: 'KRW' | 'USD'
    price: number
    quantity: number
    tradeDate: string
    memo?: string
  }): Promise<Trade | null> {
    error.value = null

    const { data, error: err } = await client
      .from('trades')
      .update({
        account_id: payload.accountId,
        type: payload.type,
        stock_code: payload.stockCode,
        stock_name: payload.stockName,
        market: payload.market,
        exchange: payload.exchange ?? null,
        currency: payload.currency,
        price: payload.price,
        quantity: payload.quantity,
        trade_date: payload.tradeDate,
        memo: payload.memo || null,
      })
      .eq('id', id)
      .select('*, accounts(alias, broker_name)')
      .single()

    if (err) { error.value = err.message; return null }

    const trade = mapTrade(data as TradeRow)
    const idx = items.value.findIndex(t => t.id === id)
    if (idx >= 0) items.value[idx] = trade
    return trade
  }

  async function remove(id: string) {
    error.value = null

    const { error: err } = await client
      .from('trades')
      .delete()
      .eq('id', id)

    if (err) error.value = err.message
    else items.value = items.value.filter(t => t.id !== id)
  }

  function clearError() { error.value = null }

  return { items, loading, error, tradesByDate, fetchAll, add, update, remove, clearError }
})
