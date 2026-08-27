import type { ComputedRef } from 'vue'
import type { QuotePriceMap } from '~/types'

export function usePriceMap(yahooSymbols: ComputedRef<string[]>) {
  const priceMap = ref<Record<string, number>>({})
  const loading = ref(false)
  const priceTime = ref<string | null>(null)

  // 늦게 끝난 이전 요청이 최신 응답을 덮어쓰지 않도록 요청마다 증가하는 토큰으로 최신 요청만 반영한다.
  let requestId = 0

  async function fetchPrices() {
    const syms = yahooSymbols.value.filter(Boolean)
    if (!syms.length) return
    const currentRequestId = ++requestId
    loading.value = true
    try {
      const data = await $fetch<QuotePriceMap>('/api/stock/quote', {
        query: { symbols: syms.join(',') },
      })
      if (currentRequestId !== requestId) return // 이후 요청이 이미 시작됨 → 이 결과는 폐기

      const newMap: Record<string, number> = {}
      let latestTime: string | null = null
      for (const [sym, info] of Object.entries(data)) {
        newMap[sym] = info.price
        if (info.time && (!latestTime || info.time > latestTime)) latestTime = info.time
      }
      priceMap.value = newMap
      priceTime.value = latestTime
    } catch {
      // 조회 실패 시 avgPrice fallback 유지
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }

  watch(yahooSymbols, (syms) => {
    if (syms.length) fetchPrices()
  }, { immediate: true })

  return { priceMap, loading, priceTime, refresh: fetchPrices }
}
