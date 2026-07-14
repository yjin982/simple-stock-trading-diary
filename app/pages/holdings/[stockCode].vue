<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/holdings"
          class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft class="w-4 h-4" />
        </NuxtLink>
        <div class="flex items-center gap-2">
          <span
            v-if="holding"
            class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
            :class="
              holding.market === 'KR'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            "
          >
            {{ holding.market }}
          </span>
          <h1 class="text-base font-semibold">
            {{ holding?.stockName ?? stockCode }}
          </h1>
          <span class="text-xs text-muted-foreground">{{ stockCode }}</span>
        </div>
        <UiPriceDelayNotice :time="priceTime" />
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmptyState
      v-if="!holding"
      :icon="Briefcase"
      title="보유 종목 없음"
      description="해당 종목의 보유 내역이 없습니다."
      card
    />

    <template v-else>
      <!-- 요약 카드 -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <UiCard
          title="보유수량"
          :value="`${holding.quantity.toLocaleString()}주`"
        />
        <UiCard
          title="평균단가"
          :value="fmtCurrency(holding.avgPrice, holding.currency)"
        />
        <UiCard
          title="현재가"
          :value="fmtCurrency(holding.currentPrice, holding.currency)"
        />
        <UiCard
          title="평가금액"
          :value="
            fmtCurrency(
              holding.currentPrice * holding.quantity,
              holding.currency,
            )
          "
        />
        <UiCard
          title="평가손익"
          :value="fmtPnl(holding.pnl, holding.currency)"
          :trend="pnlTrend(holding.pnl)"
        />
        <UiCard
          title="수익률"
          :value="fmtPnlRate(holding.pnlRate)"
          :trend="pnlTrend(holding.pnlRate)"
        />
      </div>

      <!-- 매매 이력 -->
      <section class="border rounded-lg shadow-sm bg-card text-card-foreground">
        <div class="flex items-center gap-2 px-5 py-3 border-b">
          <span class="font-semibold">매매 이력</span>
        </div>
        <HoldingsTradeHistory
          :stock-code="stockCode"
          :currency="holding.currency"
          show-actions
          @edit-trade="handleEditTrade"
          @delete-trade="handleDeleteTrade"
        />
      </section>
    </template>

    <TradeFormModal
      v-model:open="modalOpen"
      :edit-trade="editingTrade ?? undefined"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { Briefcase, ChevronLeft } from "@lucide/vue";
import type { Trade } from '~/types'

const route = useRoute();
const stockCode = route.params.stockCode as string;

const tradesStore = useTradesStore();
onMounted(() => tradesStore.fetchAll());

const { holdings: allHoldings, priceTime } = useHoldings(toRef(tradesStore, "items"));
const holding = computed(() =>
  allHoldings.value.find((h) => h.stockCode === stockCode),
);

const modalOpen = ref(false)
const editingTrade = ref<Trade | null>(null)

watch(modalOpen, (open) => { if (!open) editingTrade.value = null })

function handleEditTrade(id: string) {
  editingTrade.value = tradesStore.items.find(t => t.id === id) ?? null
  if (editingTrade.value) modalOpen.value = true
}

async function handleDeleteTrade(id: string) {
  await tradesStore.remove(id)
}
</script>
