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
            <th class="pb-2 text-right text-xs font-medium text-muted-foreground">수량</th>
            <th class="hidden pb-2 text-right text-xs font-medium text-muted-foreground sm:table-cell">평균단가</th>
            <th class="pb-2 text-right text-xs font-medium text-muted-foreground">현재가</th>
            <th class="pb-2 text-right text-xs font-medium text-muted-foreground">평가손익</th>
            <th class="hidden pb-2 text-right text-xs font-medium text-muted-foreground md:table-cell">손익률</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(holding, i) in holdings"
            :key="i"
            class="border-b last:border-0"
          >
            <td class="py-3">
              <NuxtLink :to="`/holdings/${holding.stockCode}`">
                <div class="font-medium hover:underline">{{ holding.stockName }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ holding.stockCode }} · {{ holding.market }}
                </div>
              </NuxtLink>
            </td>
            <td class="py-3 text-right">{{ holding.quantity.toLocaleString() }}</td>
            <td class="hidden py-3 text-right sm:table-cell">
              {{ fmtCurrency(holding.avgPrice, holding.currency) }}
            </td>
            <td class="py-3 text-right">{{ fmtCurrency(holding.currentPrice, holding.currency) }}</td>
            <td class="py-3 text-right font-medium" :class="pnlColor(holding.pnl)">
              {{ fmtPnl(holding.pnl, holding.currency) }}
            </td>
            <td class="hidden py-3 text-right md:table-cell" :class="pnlColor(holding.pnlRate)">
              {{ fmtPnlRate(holding.pnlRate) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
const tradesStore = useTradesStore()
const { holdings, priceTime } = useHoldings(toRef(tradesStore, 'items'))
</script>
