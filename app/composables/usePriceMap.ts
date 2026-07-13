import type { ComputedRef } from 'vue'
import type { QuotePriceMap } from '~/types'

export function usePriceMap(yahooSymbols: ComputedRef<string[]>) {
  const priceMap = ref<Record<string, number>>({})
  const loading = ref(false)
  const priceTime = ref<string | null>(null)

  async function fetchPrices() {
    const syms = yahooSymbols.value.filter(Boolean)
    if (!syms.length) return
    loading.value = true
    try {
      const data = await $fetch<QuotePriceMap>('/api/stock/quote', {
        query: { symbols: syms.join(',') },
      })
      const newMap: Record<string, number> = {}
      for (const [sym, info] of Object.entries(data)) {
        newMap[sym] = info.price
        if (info.time && !priceTime.value) priceTime.value = info.time
      }
      priceMap.value = newMap
    } catch {
      // 조회 실패 시 avgPrice fallback 유지
    } finally {
      loading.value = false
    }
  }

  watch(yahooSymbols, (syms) => {
    if (syms.length) fetchPrices()
  }, { immediate: true })

  return { priceMap, loading, priceTime, refresh: fetchPrices }
}
