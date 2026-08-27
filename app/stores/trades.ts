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
  sequence: number
  memo: string | null
  created_at: string
  accounts?: { alias: string; broker_name: string } | null
}

type TradePayload = {
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
  sequence?: number
  memo?: string
}

function toTradeRow(payload: TradePayload) {
  return {
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
    sequence: payload.sequence ?? 0,
    memo: payload.memo || null,
  }
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
    sequence: row.sequence ?? 0,
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
        market: trade.market,
        stockName: trade.stockName,
        stockCode: trade.stockCode,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.price * trade.quantity,
        accountId: trade.accountId,
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
      .order('sequence', { ascending: false })
      .order('created_at', { ascending: false })

    if (err) error.value = err.message
    else items.value = (data as TradeRow[]).map(mapTrade)

    loading.value = false
  }

  async function add(payload: TradePayload): Promise<Trade | null> {
    error.value = null
    loading.value = true
    try {
      const { data: { session } } = await client.auth.getSession()
      if (!session) { error.value = '로그인이 필요합니다.'; return null }

      const { data, error: err } = await client
        .from('trades')
        .insert({ user_id: session.user.id, ...toTradeRow(payload) })
        .select('*, accounts(alias, broker_name)')
        .single()

      if (err) { error.value = err.message; return null }

      const trade = mapTrade(data as TradeRow)
      items.value.unshift(trade)

      // 최초 거래 종목이면 stock_settings 레코드 자동 생성
      const stockSettingsStore = useStockSettingsStore()
      await stockSettingsStore.upsertMeta(payload.stockCode, payload.stockName, payload.market)

      return trade
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: TradePayload): Promise<Trade | null> {
    error.value = null

    // 매수 거래를 수정해 물량·시점이 바뀌면, 그 물량에 의존하던 다른(이후) 매도가
    // 새로 초과매도가 될 수 있다. 원래 매수였던 거래에 한해 저장 전 미리 확인한다.
    const target = items.value.find(t => t.id === id)
    if (target?.type === 'BUY') {
      const candidate = items.value.map(t =>
        t.id === id ? { ...t, ...payload, sequence: payload.sequence ?? 0 } : t,
      )
      if (wouldIntroduceOversell(items.value, candidate)) {
        error.value = '이 매수 내용을 수정하면 이후 매도 내역이 보유수량을 초과하게 됩니다. 관련 매도 내역을 먼저 확인해주세요.'
        return null
      }
    }

    loading.value = true
    try {
      const { data, error: err } = await client
        .from('trades')
        .update(toTradeRow(payload))
        .eq('id', id)
        .select('*, accounts(alias, broker_name)')
        .single()

      if (err) { error.value = err.message; return null }

      const trade = mapTrade(data as TradeRow)
      const idx = items.value.findIndex(t => t.id === id)
      if (idx >= 0) items.value[idx] = trade
      return trade
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    error.value = null

    // 매수 거래를 삭제해 물량이 사라지면, 그 물량에 의존하던 다른(이후) 매도가
    // 새로 초과매도가 될 수 있다. 매수 거래 삭제에 한해 저장 전 미리 확인한다.
    const target = items.value.find(t => t.id === id)
    if (target?.type === 'BUY') {
      const candidate = items.value.filter(t => t.id !== id)
      if (wouldIntroduceOversell(items.value, candidate)) {
        error.value = '이 매수를 삭제하면 이후 매도 내역이 보유수량을 초과하게 됩니다. 관련 매도 내역을 먼저 확인해주세요.'
        return
      }
    }

    loading.value = true
    try {
      const { error: err } = await client
        .from('trades')
        .delete()
        .eq('id', id)

      if (err) error.value = err.message
      else items.value = items.value.filter(t => t.id !== id)
    } finally {
      loading.value = false
    }
  }

  function clearError() { error.value = null }

  return { items, loading, error, tradesByDate, fetchAll, add, update, remove, clearError }
})
