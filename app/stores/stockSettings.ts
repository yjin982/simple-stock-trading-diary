import type { StockSetting } from '~/types'

type StockSettingRow = {
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

function mapSetting(row: StockSettingRow): StockSetting {
  return {
    id: row.id,
    userId: row.user_id,
    stockCode: row.stock_code,
    stockName: row.stock_name,
    market: row.market,
    memo: row.memo,
    targetRate: row.target_rate !== null ? Number(row.target_rate) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const useStockSettingsStore = defineStore('stockSettings', () => {
  const client = useSupabaseClient()

  const items = ref<StockSetting[]>([])

  async function fetchAll() {
    const { data } = await client
      .from('stock_settings')
      .select('*')
      .order('stock_code')
    if (data) items.value = (data as StockSettingRow[]).map(mapSetting)
  }

  async function fetchByCode(stockCode: string, market: 'KR' | 'US') {
    const { data } = await client
      .from('stock_settings')
      .select('*')
      .eq('stock_code', stockCode)
      .eq('market', market)
      .maybeSingle()
    if (!data) return null
    const setting = mapSetting(data as StockSettingRow)
    const idx = items.value.findIndex(s => s.stockCode === stockCode && s.market === market)
    if (idx >= 0) items.value[idx] = setting
    else items.value.push(setting)
    return setting
  }

  function getByCode(stockCode: string, market: 'KR' | 'US'): StockSetting | null {
    return items.value.find(s => s.stockCode === stockCode && s.market === market) ?? null
  }

  // 매매이력 추가 시 호출 — 이미 존재하면 무시
  async function upsertMeta(stockCode: string, stockName: string, market: 'KR' | 'US') {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return

    await client.from('stock_settings').upsert(
      { user_id: session.user.id, stock_code: stockCode, stock_name: stockName, market },
      { onConflict: 'user_id,stock_code,market', ignoreDuplicates: true },
    )
  }

  async function updateSettings(
    stockCode: string,
    market: 'KR' | 'US',
    patch: { memo: string | null; targetRate: number | null },
  ): Promise<StockSetting | null> {
    const { data, error } = await client
      .from('stock_settings')
      .update({
        memo: patch.memo,
        target_rate: patch.targetRate,
        updated_at: new Date().toISOString(),
      })
      .eq('stock_code', stockCode)
      .eq('market', market)
      .select()
      .single()

    if (error || !data) return null
    const setting = mapSetting(data as StockSettingRow)
    const idx = items.value.findIndex(s => s.stockCode === stockCode && s.market === market)
    if (idx >= 0) items.value[idx] = setting
    else items.value.push(setting)
    return setting
  }

  return { items, fetchAll, fetchByCode, getByCode, upsertMeta, updateSettings }
})
