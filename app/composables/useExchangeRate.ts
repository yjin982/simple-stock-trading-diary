export function useExchangeRate() {
  const { priceMap } = usePriceMap(computed(() => ['USDKRW=X']))
  const usdKrw = computed(() => priceMap.value['USDKRW=X'] ?? null)
  return { usdKrw }
}
