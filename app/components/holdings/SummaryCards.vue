<template>
  <div :class="compact ? 'grid grid-cols-3 gap-2 sm:grid-cols-6' : 'grid grid-cols-2 gap-3 sm:grid-cols-3'">
    <UiCard
      :compact="compact"
      :title="isAggregate ? '총 보유수량' : '보유수량'"
      :value="`${data.quantity.toLocaleString()}주`"
    />
    <UiCard
      :compact="compact"
      title="평균단가"
      :value="fmtCurrency(data.avgPrice, data.currency)"
      :sub-value="krwEquiv(data.avgPrice)"
    />
    <UiCard
      :compact="compact"
      title="현재가"
      :value="priceAvailable ? fmtCurrency(data.currentPrice, data.currency) : '—'"
      :sub-value="priceAvailable ? krwEquiv(data.currentPrice) : '가격 조회 실패'"
    />
    <UiCard
      :compact="compact"
      :title="isAggregate ? '총 평가금액' : '평가금액'"
      :value="priceAvailable ? fmtCurrency(data.currentPrice * data.quantity, data.currency) : '—'"
      :sub-value="priceAvailable ? krwEquiv(data.currentPrice * data.quantity) : undefined"
    />
    <UiCard
      :compact="compact"
      :title="isAggregate ? '총 평가손익' : '평가손익'"
      :value="priceAvailable ? fmtPnl(data.pnl, data.currency) : '—'"
      :sub-value="priceAvailable ? krwEquiv(data.pnl) : undefined"
      :trend="priceAvailable ? pnlTrend(data.pnl) : 'neutral'"
    />
    <UiCard
      :compact="compact"
      title="수익률"
      :value="priceAvailable ? fmtPnlRate(data.pnlRate) : '—'"
      :trend="priceAvailable ? pnlTrend(data.pnlRate) : 'neutral'"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: {
    currency: 'KRW' | 'USD'
    currentPrice: number
    quantity: number
    avgPrice: number
    pnl: number
    pnlRate: number
    priceAvailable?: boolean
  }
  compact?: boolean
  isAggregate?: boolean
}>()

const { krwEquiv: baseKrwEquiv } = useExchangeRate()
const isUSD = computed(() => props.data.currency === 'USD')
const krwEquiv = (usd: number) => isUSD.value ? (baseKrwEquiv(usd) ?? undefined) : undefined
const priceAvailable = computed(() => props.data.priceAvailable ?? true)
</script>
