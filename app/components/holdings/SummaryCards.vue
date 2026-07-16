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
    />
    <UiCard
      :compact="compact"
      title="현재가"
      :value="fmtCurrency(data.currentPrice, data.currency)"
    />
    <UiCard
      :compact="compact"
      :title="isAggregate ? '총 평가금액' : '평가금액'"
      :value="fmtCurrency(data.currentPrice * data.quantity, data.currency)"
    />
    <UiCard
      :compact="compact"
      :title="isAggregate ? '총 평가손익' : '평가손익'"
      :value="fmtPnl(data.pnl, data.currency)"
      :trend="pnlTrend(data.pnl)"
    />
    <UiCard
      :compact="compact"
      title="수익률"
      :value="fmtPnlRate(data.pnlRate)"
      :trend="pnlTrend(data.pnlRate)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    currency: 'KRW' | 'USD'
    currentPrice: number
    quantity: number
    avgPrice: number
    pnl: number
    pnlRate: number
  }
  compact?: boolean
  isAggregate?: boolean
}>()
</script>
