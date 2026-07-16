<template>
  <section class="p-5 border rounded-lg shadow-sm bg-card text-card-foreground">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold">보유 종목</h2>
      <UiPriceDelayNotice :time="priceTime" />
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b">
            <th class="pb-2 text-left text-xs font-medium text-muted-foreground">종목</th>
            <th class="pb-2 text-left text-xs font-medium text-muted-foreground">계좌</th>
            <th class="pb-2 text-right text-xs font-medium text-muted-foreground">수량</th>
            <th class="hidden pb-2 text-right text-xs font-medium text-muted-foreground sm:table-cell">평균단가</th>
            <th class="pb-2 text-right text-xs font-medium text-muted-foreground">현재가</th>
            <th class="pb-2 text-right text-xs font-medium text-muted-foreground">평가손익</th>
            <th class="hidden pb-2 text-right text-xs font-medium text-muted-foreground md:table-cell">손익률</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in holdingGroups" :key="group.stockCode">
            <tr
              v-for="(h, i) in group.rows"
              :key="`${h.stockCode}-${h.accountId}`"
              :class="i < group.rows.length - 1 ? 'border-b border-dashed border-muted' : 'border-b last:border-0'"
            >
              <!-- 종목: 첫 행만 rowspan -->
              <td v-if="i === 0" :rowspan="group.rows.length" class="py-3 align-middle">
                <NuxtLink :to="`/holdings/${group.stockCode}`">
                  <div class="font-medium hover:underline">{{ group.stockName }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ group.stockCode }} · {{ group.market }}
                  </div>
                </NuxtLink>
              </td>
              <!-- 계좌명 -->
              <td class="py-3 text-xs text-muted-foreground whitespace-nowrap">
                {{ h.accountName ?? '-' }}
              </td>
              <!-- 수량 -->
              <td class="py-3 text-right">{{ h.quantity.toLocaleString() }}</td>
              <!-- 평균단가 -->
              <td class="hidden py-3 text-right sm:table-cell">
                {{ fmtCurrency(h.avgPrice, h.currency) }}
              </td>
              <!-- 현재가: 그룹 첫 행만 rowspan -->
              <td v-if="i === 0" :rowspan="group.rows.length" class="py-3 text-right align-middle">
                {{ fmtCurrency(h.currentPrice, h.currency) }}
              </td>
              <!-- 평가손익 -->
              <td class="py-3 text-right font-medium" :class="pnlColor(h.pnl)">
                {{ fmtPnl(h.pnl, h.currency) }}
              </td>
              <!-- 손익률 -->
              <td class="hidden py-3 text-right md:table-cell" :class="pnlColor(h.pnlRate)">
                {{ fmtPnlRate(h.pnlRate) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Holding } from '~/types'

const props = defineProps<{
  holdings: Holding[]
  priceTime?: string | null
}>()

type HoldingGroup = {
  stockCode: string
  stockName: string
  market: 'KR' | 'US'
  rows: Holding[]
}

const holdingGroups = computed<HoldingGroup[]>(() => {
  const map = new Map<string, HoldingGroup>()
  for (const h of props.holdings) {
    if (!map.has(h.stockCode)) {
      map.set(h.stockCode, {
        stockCode: h.stockCode,
        stockName: h.stockName,
        market: h.market,
        rows: [],
      })
    }
    map.get(h.stockCode)!.rows.push(h)
  }
  return [...map.values()]
})
</script>
