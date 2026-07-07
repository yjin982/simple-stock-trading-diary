<template>
  <table class="w-full table-fixed text-xs">
    <thead>
      <tr class="border-b border-muted-foreground/50">
        <th class="pb-2 text-left font-medium text-muted-foreground">매수일</th>
        <th class="pb-2 text-left font-medium text-muted-foreground">매도일</th>
        <th class="pb-2 text-left font-medium text-muted-foreground">보유기간</th>
        <th class="pb-2 text-right font-medium text-muted-foreground">수량</th>
        <th class="pb-2 text-right font-medium text-muted-foreground">수익률</th>
        <th class="pb-2 text-right font-medium text-muted-foreground">실현손익</th>
      </tr>
    </thead>
    <tbody>
      <template v-if="matches.length">
        <tr
          v-for="(match, i) in matches"
          :key="i"
          class="border-b border-muted/60 last:border-0"
        >
          <td class="py-2">{{ formatTradeDate(match.buyDate) }}</td>
          <td class="py-2">{{ formatTradeDate(match.sellDate) }}</td>
          <td class="py-2">{{ match.holdingDays }}일</td>
          <td class="py-2 text-right">{{ match.quantity }}주</td>
          <td class="py-2 text-right" :class="pnlColor(match.pnlRate)">
            {{ fmtPnlRate(match.pnlRate) }}
          </td>
          <td class="py-2 text-right font-medium" :class="pnlColor(match.realizedPnl)">
            {{ fmtPnl(match.realizedPnl, currency) }}
          </td>
        </tr>
      </template>
      <tr v-else>
        <td colspan="6" class="py-3 text-center text-muted-foreground">
          아직 매도 내역이 없습니다
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
interface TradeMatch {
  buyDate: string
  sellDate: string
  holdingDays: number
  quantity: number
  pnlRate: number
  realizedPnl: number
}

const props = defineProps<{
  stockCode: string
  currency: 'KRW' | 'USD'
}>()

const tradesStore = useTradesStore()

const matches = computed<TradeMatch[]>(() => {
  const rawTrades = tradesStore.items
    .filter(t => t.stockCode === props.stockCode)
    .map(t => ({ date: t.tradeDate, type: t.type, quantity: t.quantity, price: t.price }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const buyQueue: Array<{ date: string; remainingQty: number; price: number }> = []
  const result: TradeMatch[] = []

  for (const trade of rawTrades) {
    if (trade.type === 'BUY') {
      buyQueue.push({ date: trade.date, remainingQty: trade.quantity, price: trade.price })
      continue
    }

    // SELL: FIFO로 매수 잔량 소진
    let sellQty = trade.quantity
    const matchedLots: Array<{ date: string; qty: number; price: number }> = []

    while (sellQty > 0 && buyQueue.length > 0) {
      const buy = buyQueue[0]!
      const matchQty = Math.min(sellQty, buy.remainingQty)
      matchedLots.push({ date: buy.date, qty: matchQty, price: buy.price })
      buy.remainingQty -= matchQty
      sellQty -= matchQty
      if (buy.remainingQty === 0) buyQueue.shift()
    }

    if (matchedLots.length === 0) continue

    const totalBuyCost = matchedLots.reduce((s, l) => s + l.qty * l.price, 0)
    const totalQty = matchedLots.reduce((s, l) => s + l.qty, 0)
    const avgBuyPrice = totalBuyCost / totalQty
    const buyDate = matchedLots[0]!.date

    const [by, bm, bd] = buyDate.split('-').map(Number)
    const [sy, sm, sd] = trade.date.split('-').map(Number)
    const holdingDays = Math.floor(
      (new Date(sy, sm - 1, sd).getTime() - new Date(by, bm - 1, bd).getTime()) / 86400000,
    )

    const realizedPnl = (trade.price - avgBuyPrice) * totalQty
    const pnlRate = (realizedPnl / (avgBuyPrice * totalQty)) * 100

    result.push({ buyDate, sellDate: trade.date, holdingDays, quantity: totalQty, pnlRate, realizedPnl })
  }

  return result
})
</script>
