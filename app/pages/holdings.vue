<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <h1 class="text-base font-semibold">보유 종목</h1>
    </div>

    <!-- 요약 카드 -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <UiCard title="보유 종목" :value="`${dummyHoldings.length}개`" />
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
                class="px-4 py-3 text-right text-xs font-medium text-muted-foreground"
              >
                수량
              </th>
              <th
                class="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell"
              >
                평균단가
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-muted-foreground"
              >
                현재가
              </th>
              <th
                class="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell"
              >
                평가금액
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-muted-foreground"
              >
                평가손익
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-muted-foreground"
              >
                수익률
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="h in sortedHoldings" :key="h.stockCode">
              <!-- 메인 행 (현재 보유 수량 기준) -->
              <tr
                class="border-b transition-colors hover:bg-muted/30"
                :class="{ 'border-b-0 bg-muted/10': expanded[h.stockCode] }"
              >
                <td
                  class="cursor-pointer px-4 py-3"
                  @click="toggleExpand(h.stockCode)"
                >
                  <div class="flex items-center gap-2">
                    <ChevronDown
                      class="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200"
                      :class="{ 'rotate-180': expanded[h.stockCode] }"
                    />
                    <span
                      class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                      :class="
                        h.market === 'KR'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      "
                    >
                      {{ h.market }}
                    </span>
                    <div>
                      <div class="font-medium">{{ h.stockName }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ h.stockCode }}
                      </div>
                    </div>
                  </div>
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
                  {{ fmtPnlRate(h.pnlRate) }}
                </td>
              </tr>

              <!-- 아코디언 상세: 매수-매도 이력 테이블 -->
              <tr v-if="expanded[h.stockCode]" class="border-b bg-muted">
                <td colspan="7" class="bg-muted/20 px-6 pb-4 pt-3">
                  <HoldingsTradeHistory :stock-code="h.stockCode" :currency="h.currency" />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Briefcase, ChevronDown } from "@lucide/vue";
import { dummyHoldings } from "~/lib/dummy-data";

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

// --- 아코디언 ---
const expanded = ref<Record<string, boolean>>({});

function toggleExpand(code: string) {
  expanded.value[code] = !expanded.value[code];
}

// --- 필터 + 정렬 ---
const filteredHoldings = computed(() =>
  selectedMarket.value === "all"
    ? dummyHoldings
    : dummyHoldings.filter((h) => h.market === selectedMarket.value),
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
  const krw = dummyHoldings.filter((h) => h.currency === "KRW");
  const usd = dummyHoldings.filter((h) => h.currency === "USD");
  return {
    krwTotal: krw.reduce((s, h) => s + h.currentPrice * h.quantity, 0),
    krwPnl: krw.reduce((s, h) => s + h.pnl, 0),
    usdTotal: usd.reduce((s, h) => s + h.currentPrice * h.quantity, 0),
    usdPnl: usd.reduce((s, h) => s + h.pnl, 0),
    avgRate: dummyHoldings.length
      ? dummyHoldings.reduce((s, h) => s + h.pnlRate, 0) / dummyHoldings.length
      : 0,
  };
});
</script>
