<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <h1 class="text-base font-semibold">보유 종목</h1>
      <UiPriceDelayNotice :time="priceTime" />
    </div>

    <!-- 요약 카드 -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <UiCard title="보유 종목" :value="`${allHoldings.length}개`" />
      <UiCard
        title="국내 평가금액"
        :value="fmtKRW(summary.krwTotal)"
        :sub-value="fmtPnl(summary.krwPnl, 'KRW')"
        :trend="pnlTrend(summary.krwPnl)"
      />
      <UiCard
        title="해외 평가금액"
        :value="fmtUSD(summary.usdTotal)"
        :sub-value="fmtPnl(summary.usdPnl, 'USD')"
        :trend="pnlTrend(summary.usdPnl)"
      />
      <UiCard
        title="평균 수익률"
        :value="fmtPnlRate(summary.avgRate)"
        :trend="pnlTrend(summary.avgRate)"
      />
    </div>

    <!-- 필터 + 정렬 -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <UiTabGroup v-model="selectedMarket" :options="MARKET_FILTERS" />

      <div class="flex items-center gap-1.5">
        <span class="text-xs text-muted-foreground">정렬</span>
        <UiTabGroup
          :model-value="sortBy"
          :options="SORT_OPTIONS"
          @update:model-value="setSortBy"
        />
        <button
          class="rounded-md border p-1.5 transition-colors hover:bg-accent"
          :title="sortDesc ? '내림차순' : '오름차순'"
          @click="sortDesc = !sortDesc"
        >
          <component :is="sortDesc ? ArrowDown : ArrowUp" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmptyState
      v-if="sortedHoldings.length === 0"
      :icon="Briefcase"
      title="보유 종목이 없습니다"
      description="선택한 시장에 보유 중인 종목이 없어요."
      card
    />

    <!-- 보유 종목 테이블 -->
    <section
      v-else
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[600px] text-sm">
          <thead>
            <tr class="border-b">
              <th
                class="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
              >
                종목
              </th>
              <th
                class="px-4 py-3 text-right w-16 text-xs font-medium text-muted-foreground"
              >
                수량
              </th>
              <th
                class="hidden px-4 py-3 text-right w-28 text-xs font-medium text-muted-foreground sm:table-cell"
              >
                평균단가
              </th>
              <th
                class="px-4 py-3 text-right text-xs w-28 font-medium text-muted-foreground"
              >
                현재가
              </th>
              <th
                class="hidden px-4 py-3 text-right w-32 text-xs font-medium text-muted-foreground md:table-cell"
              >
                평가금액
              </th>
              <th
                class="px-4 py-3 text-right w-32 text-xs font-medium text-muted-foreground"
              >
                평가손익
              </th>
              <th
                class="px-4 py-3 text-right w-32 text-xs font-medium text-muted-foreground"
              >
                수익률
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in sortedHoldings"
              :key="h.stockCode"
              class="border-b last:border-0 transition-colors hover:bg-muted/30"
            >
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/holdings/${h.stockCode}`"
                  class="flex items-center gap-2"
                >
                  <span
                    class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                    :class="marketBadgeClass(h.market)"
                  >
                    {{ h.market }}
                  </span>
                  <div>
                    <div class="font-medium hover:underline">
                      {{ h.stockName }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ h.stockCode }}
                    </div>
                  </div>
                </NuxtLink>
              </td>
              <td class="px-4 py-3 text-right">
                {{ h.quantity.toLocaleString() }}
              </td>
              <td class="hidden px-4 py-3 text-right sm:table-cell">
                {{ fmtCurrency(h.avgPrice, h.currency) }}
              </td>
              <td class="px-4 py-3 text-right">
                <div>{{ fmtCurrency(h.currentPrice, h.currency) }}</div>
                <div
                  class="text-xs"
                  :class="pnlColor(h.currentPrice - h.avgPrice)"
                >
                  {{ h.currentPrice >= h.avgPrice ? "▲" : "▼" }}
                  {{
                    Math.abs(
                      ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100,
                    ).toFixed(2)
                  }}%
                </div>
              </td>
              <td class="hidden px-4 py-3 text-right md:table-cell">
                {{ fmtCurrency(h.currentPrice * h.quantity, h.currency) }}
              </td>
              <td
                class="px-4 py-3 text-right font-medium"
                :class="pnlColor(h.pnl)"
              >
                {{ fmtPnl(h.pnl, h.currency) }}
              </td>
              <td
                class="px-4 py-3 text-right font-medium"
                :class="pnlColor(h.pnlRate)"
              >
                <div class="flex items-center justify-end gap-1">
                  <span
                    v-if="isTargetReached(h)"
                    title="목표 수익률 달성"
                    class="text-amber-500"
                  >🎯</span>
                  {{ fmtPnlRate(h.pnlRate) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { ArrowDown, ArrowUp, Briefcase } from "@lucide/vue";

type Market = "all" | "KR" | "US";
type SortKey = "pnlRate" | "pnl" | "total" | "name";

const MARKET_FILTERS: { label: string; value: Market }[] = [
  { label: "전체", value: "all" },
  { label: "국내", value: "KR" },
  { label: "해외", value: "US" },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "수익률", value: "pnlRate" },
  { label: "손익금액", value: "pnl" },
  { label: "평가금액", value: "total" },
  { label: "종목명", value: "name" },
];

const tradesStore = useTradesStore();
const stockSettingsStore = useStockSettingsStore();
const { holdings: allHoldings, pricesLoading, priceTime } = useHoldings(toRef(tradesStore, "items"));

onMounted(() => {
  tradesStore.fetchAll()
  stockSettingsStore.fetchAll()
})

function isTargetReached(h: { stockCode: string; market: 'KR' | 'US'; pnlRate: number }): boolean {
  const setting = stockSettingsStore.getByCode(h.stockCode, h.market)
  if (!setting?.targetRate) return false
  return h.pnlRate >= setting.targetRate
}

const selectedMarket = ref<Market>("all");
const sortBy = ref<SortKey>("pnlRate");
const sortDesc = ref(true);

function setSortBy(key: SortKey) {
  if (sortBy.value === key) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortBy.value = key;
    sortDesc.value = true;
  }
}

// --- 필터 + 정렬 ---
const filteredHoldings = computed(() =>
  selectedMarket.value === "all"
    ? allHoldings.value
    : allHoldings.value.filter((h) => h.market === selectedMarket.value),
);

const sortedHoldings = computed(() => {
  return [...filteredHoldings.value].sort((a, b) => {
    let diff = 0;
    switch (sortBy.value) {
      case "pnlRate":
        diff = a.pnlRate - b.pnlRate;
        break;
      case "pnl":
        diff = a.pnl - b.pnl;
        break;
      case "total":
        diff = a.currentPrice * a.quantity - b.currentPrice * b.quantity;
        break;
      case "name":
        diff = a.stockName.localeCompare(b.stockName, "ko");
        break;
    }
    return sortDesc.value ? -diff : diff;
  });
});

// --- 요약 ---
const summary = computed(() => {
  const krw = allHoldings.value.filter((h) => h.currency === "KRW");
  const usd = allHoldings.value.filter((h) => h.currency === "USD");
  return {
    krwTotal: krw.reduce((s, h) => s + h.currentPrice * h.quantity, 0),
    krwPnl: krw.reduce((s, h) => s + h.pnl, 0),
    usdTotal: usd.reduce((s, h) => s + h.currentPrice * h.quantity, 0),
    usdPnl: usd.reduce((s, h) => s + h.pnl, 0),
    avgRate: allHoldings.value.length
      ? allHoldings.value.reduce((s, h) => s + h.pnlRate, 0) /
        allHoldings.value.length
      : 0,
  };
});
</script>
