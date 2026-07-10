<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/holdings"
        class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft class="h-4 w-4" />
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
      <section class="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div class="flex items-center gap-2 border-b px-5 py-3">
          <span class="font-semibold">매매 이력</span>
        </div>
        <HoldingsTradeHistory
          :stock-code="stockCode"
          :currency="holding.currency"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Briefcase, ChevronLeft } from "@lucide/vue";

const route = useRoute();
const stockCode = route.params.stockCode as string;

const tradesStore = useTradesStore();
onMounted(() => tradesStore.fetchAll());

const allHoldings = useHoldings(toRef(tradesStore, "items"));
const holding = computed(() =>
  allHoldings.value.find((h) => h.stockCode === stockCode),
);
</script>
