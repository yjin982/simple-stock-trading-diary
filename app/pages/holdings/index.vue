<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <h1 class="text-base font-semibold">보유 종목</h1>
      <UiPriceDelayNotice :time="priceTime" />
    </div>

    <!-- 요약 카드 -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <UiCard title="보유 종목" :value="`${uniqueStockCount}개`" />
      <UiCard
        title="국내 평가금액/평가손익"
        :value="fmtKRW(summary.krwTotal)"
        :sub-value="fmtPnl(summary.krwPnl, 'KRW')"
        :trend="pnlTrend(summary.krwPnl)"
      />
      <UiCard
        title="해외 평가금액/평가손익"
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
          <component :is="sortDesc ? ArrowDown : ArrowUp" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmptyState
      v-if="sortedGroups.length === 0"
      :icon="Briefcase"
      title="보유 종목이 없습니다"
      description="선택한 시장에 보유 중인 종목이 없어요."
      card
    />

    <!-- 보유 종목 테이블 -->
    <section
      v-else
      class="border rounded-lg shadow-sm bg-card text-card-foreground"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-sm">
          <thead>
            <tr class="border-b">
              <th
                class="px-4 py-3 text-xs font-medium text-left text-muted-foreground"
              >
                종목
              </th>
              <th
                class="px-4 py-3 text-xs font-medium text-left text-muted-foreground"
              >
                계좌
              </th>
              <th
                class="w-16 px-4 py-3 text-xs font-medium text-right text-muted-foreground"
              >
                수량
              </th>
              <th
                class="hidden px-4 py-3 text-xs font-medium text-right w-28 text-muted-foreground sm:table-cell"
              >
                평균단가
              </th>
              <th
                class="px-4 py-3 text-xs font-medium text-right w-28 text-muted-foreground"
              >
                현재가
              </th>
              <th
                class="hidden w-32 px-4 py-3 text-xs font-medium text-right text-muted-foreground md:table-cell"
              >
                평가금액
              </th>
              <th
                class="w-32 px-4 py-3 text-xs font-medium text-right text-muted-foreground"
              >
                평가손익
              </th>
              <th
                class="w-32 px-4 py-3 text-xs font-medium text-right text-muted-foreground"
              >
                수익률
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in sortedGroups" :key="group.stockCode">
              <tr
                v-for="(h, i) in group.rows"
                :key="`${h.stockCode}-${h.accountId}`"
                class="transition-colors hover:bg-muted/30"
                :class="
                  i < group.rows.length - 1
                    ? 'border-b border-dashed border-muted'
                    : 'border-b last:border-0'
                "
              >
                <!-- 종목: 첫 행만 렌더, rowspan -->
                <td
                  v-if="i === 0"
                  :rowspan="group.rows.length"
                  class="px-4 py-3 align-middle"
                >
                  <NuxtLink
                    :to="`/holdings/${group.market}/${group.stockCode}`"
                    class="flex items-center gap-2"
                  >
                    <span
                      class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                      :class="marketBadgeClass(group.market)"
                    >
                      {{ group.market }}
                    </span>
                    <div>
                      <div class="font-medium hover:underline">
                        {{ group.stockName }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ group.stockCode }}
                      </div>
                    </div>
                  </NuxtLink>
                </td>
                <!-- 계좌명 -->
                <td
                  class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap"
                >
                  <NuxtLink
                    :to="accountsStore.getBrokerUrl(h.accountId)"
                    class="transition-colors hover:text-foreground hover:underline"
                  >
                    {{ h.accountName ?? "-" }}
                  </NuxtLink>
                </td>
                <!-- 수량 -->
                <td class="px-4 py-3 text-right">
                  {{ h.quantity.toLocaleString() }}
                </td>
                <!-- 평균단가 -->
                <td class="hidden px-4 py-3 text-right sm:table-cell">
                  <div>{{ fmtCurrency(h.avgPrice, h.currency) }}</div>
                  <div
                    v-if="h.currency === 'USD'"
                    class="text-xs text-muted-foreground"
                  >
                    {{ krwEquiv(h.avgPrice) }}
                  </div>
                </td>
                <!-- 현재가: 그룹 첫 행만 rowspan -->
                <td
                  v-if="i === 0"
                  :rowspan="group.rows.length"
                  class="px-4 py-3 text-right align-middle"
                >
                  <div>{{ fmtCurrency(h.currentPrice, h.currency) }}</div>
                  <div
                    v-if="h.currency === 'USD'"
                    class="text-xs text-muted-foreground"
                  >
                    {{ krwEquiv(h.currentPrice) }}
                  </div>
                </td>
                <!-- 평가금액 -->
                <td class="hidden px-4 py-3 text-right md:table-cell">
                  <div>
                    {{ fmtCurrency(h.currentPrice * h.quantity, h.currency) }}
                  </div>
                  <div
                    v-if="h.currency === 'USD'"
                    class="text-xs text-muted-foreground"
                  >
                    {{ krwEquiv(h.currentPrice * h.quantity) }}
                  </div>
                </td>
                <!-- 평가손익 -->
                <td class="px-4 py-3 font-medium text-right">
                  <div :class="pnlColor(h.pnl)">
                    {{ fmtPnl(h.pnl, h.currency) }}
                  </div>
                  <div
                    v-if="h.currency === 'USD'"
                    class="text-xs text-muted-foreground"
                  >
                    {{ krwEquiv(h.pnl) }}
                  </div>
                </td>
                <!-- 수익률 -->
                <td
                  class="px-4 py-3 font-medium text-right"
                  :class="pnlColor(h.pnlRate)"
                >
                  <div class="flex items-center justify-end gap-1">
                    <span
                      v-if="i === 0 && isTargetReached(h)"
                      title="목표 수익률 달성"
                      class="text-amber-500"
                      >🎯</span
                    >
                    {{ fmtPnlRate(h.pnlRate) }}
                  </div>
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
definePageMeta({ middleware: "auth" });

import { ArrowDown, ArrowUp, Briefcase } from "@lucide/vue";

type Market = "all" | "KR" | "US";
type SortKey = "pnlRate" | "pnl" | "total" | "quantity" | "name";

const MARKET_FILTERS: { label: string; value: Market }[] = [
  { label: "전체", value: "all" },
  { label: "국내", value: "KR" },
  { label: "해외", value: "US" },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "수익률", value: "pnlRate" },
  { label: "손익금액", value: "pnl" },
  { label: "평가금액", value: "total" },
  { label: "보유수량", value: "quantity" },
  { label: "종목명", value: "name" },
];

const tradesStore = useTradesStore();
const accountsStore = useAccountsStore();
const stockSettingsStore = useStockSettingsStore();
import type { Holding } from "~/types";

const { usdKrw, krwEquiv } = useExchangeRate();

function toKRW(currency: "KRW" | "USD", amount: number): number {
  return currency === "USD" ? amount * (usdKrw.value ?? 0) : amount;
}

const { holdings: allHoldings, priceTime } = useHoldings(
  toRef(tradesStore, "items"),
);
const uniqueStockCount = computed(
  () => new Set(allHoldings.value.map((h) => stockKey(h.market, h.stockCode))).size,
);

onMounted(() => {
  stockSettingsStore.fetchAll();
});

function isTargetReached(h: {
  stockCode: string;
  market: "KR" | "US";
  pnlRate: number;
}): boolean {
  const setting = stockSettingsStore.getByCode(h.stockCode, h.market);
  if (!setting?.targetRate) return false;
  return h.pnlRate >= setting.targetRate;
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

// --- 필터 ---
const filteredHoldings = computed(() =>
  selectedMarket.value === "all"
    ? allHoldings.value
    : allHoldings.value.filter((h) => h.market === selectedMarket.value),
);

// --- 종목별 그룹핑 ---
type HoldingGroup = {
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  currency: "KRW" | "USD";
  rows: Holding[];
  totalEval: number;
  totalPnl: number;
  totalQuantity: number;
  groupRate: number;
};

const groupedHoldings = computed<HoldingGroup[]>(() => {
  const map = new Map<string, HoldingGroup>();
  for (const h of filteredHoldings.value) {
    const key = stockKey(h.market, h.stockCode);
    if (!map.has(key)) {
      map.set(key, {
        stockCode: h.stockCode,
        stockName: h.stockName,
        market: h.market,
        currency: h.currency,
        rows: [],
        totalEval: 0,
        totalPnl: 0,
        totalQuantity: 0,
        groupRate: 0,
      });
    }
    const g = map.get(key)!;
    g.rows.push(h);
    g.totalEval += h.currentPrice * h.quantity;
    g.totalPnl += h.pnl;
    g.totalQuantity += h.quantity;
  }
  for (const g of map.values()) {
    const totalCost = g.totalEval - g.totalPnl;
    g.groupRate = totalCost > 0 ? (g.totalPnl / totalCost) * 100 : 0;
  }
  return [...map.values()];
});

// --- 그룹 정렬 ---
const sortedGroups = computed<HoldingGroup[]>(() => {
  return [...groupedHoldings.value].sort((a, b) => {
    let diff = 0;
    switch (sortBy.value) {
      case "pnlRate":
        diff = a.groupRate - b.groupRate;
        break;
      case "pnl":
        diff = toKRW(a.currency, a.totalPnl) - toKRW(b.currency, b.totalPnl);
        break;
      case "total":
        diff = toKRW(a.currency, a.totalEval) - toKRW(b.currency, b.totalEval);
        break;
      case "quantity":
        diff = a.totalQuantity - b.totalQuantity;
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
  // KRW/USD 혼합 가중평균은 환율 환산 후 합산해야 함 (원화-달러 원가를 그대로 더하면 왜곡됨)
  const totalPnl = allHoldings.value.reduce(
    (s, h) => s + toKRW(h.currency, h.pnl),
    0,
  );
  const totalCost = allHoldings.value.reduce(
    (s, h) => s + toKRW(h.currency, h.currentPrice * h.quantity - h.pnl),
    0,
  );
  const avgRate = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  return {
    krwTotal: krw.reduce((s, h) => s + h.currentPrice * h.quantity, 0),
    krwPnl: krw.reduce((s, h) => s + h.pnl, 0),
    usdTotal: usd.reduce((s, h) => s + h.currentPrice * h.quantity, 0),
    usdPnl: usd.reduce((s, h) => s + h.pnl, 0),
    avgRate,
  };
});
</script>
