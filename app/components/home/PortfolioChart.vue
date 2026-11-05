<template>
  <section
    v-if="holdings.length > 0"
    class="p-5 border rounded-lg shadow-sm bg-card text-card-foreground"
  >
    <h2 class="text-sm font-semibold" :class="hasEstimatedPrice ? 'mb-1' : 'mb-5'">포트폴리오 비중</h2>
    <p v-if="hasEstimatedPrice" class="mb-5 text-[11px] text-muted-foreground">
      현재가를 조회하지 못한 종목은 평균단가 기준으로 반영했습니다.
    </p>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1px_1fr]">
      <!-- Chart 1: 국내/해외 -->
      <div>
        <div class="mb-3 text-center md:text-left">
          <p class="text-xs font-medium">시장별 비중</p>
          <p class="text-[11px] text-muted-foreground">평가금액 기준</p>
        </div>

        <div
          class="flex flex-col items-center justify-center gap-4 md:flex-row md:items-center md:gap-5"
        >
          <!-- 도넛 -->
          <div
            v-if="rateMissing"
            class="flex flex-col items-center justify-center flex-shrink-0 text-center border border-dashed rounded-full h-36 w-36 text-[11px] text-muted-foreground"
          >
            <span>{{ rateMissingReason }}</span>
            <span>비중 계산 불가</span>
          </div>
          <div v-else class="relative flex-shrink-0 h-36 w-36">
            <Doughnut :data="marketChartData" :options="marketChartOptions" />
            <div
              class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <span class="text-base font-bold">{{ aggregatedHoldings.length }}</span>
              <span class="text-[11px] text-muted-foreground">종목</span>
            </div>
          </div>

          <!-- 범례 -->
          <div class="flex w-full flex-col gap-1.5 md:w-auto">
            <button
              v-for="d in marketLegend"
              :key="d.market"
              class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
              :class="
                selectedMarket === d.market
                  ? 'bg-accent font-semibold ring-1 ring-primary/40'
                  : 'text-foreground/80'
              "
              @click="toggleMarket(d.market)"
            >
              <span
                class="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                :style="{ background: d.color }"
              />
              <span>{{ d.label }} {{ d.count }}종목</span>
              <span class="ml-auto tabular-nums text-muted-foreground"
                >{{ d.pct != null ? `${d.pct}%` : "—" }}</span
              >
            </button>
            <p
              v-if="selectedMarket"
              class="text-[10px] text-muted-foreground md:text-left text-center"
            >
              다시 클릭하면 전체 보기
            </p>
          </div>
        </div>
      </div>

      <!-- 구분선 -->
      <div class="hidden bg-border md:block" />

      <!-- Chart 2: 종목별 -->
      <div>
        <div class="mb-3 text-center md:text-left">
          <p class="text-xs font-medium">{{ stockChartTitle }}</p>
          <p class="text-[11px] text-muted-foreground">{{ stockChartBasis }}</p>
        </div>

        <div
          class="flex flex-col items-center justify-center gap-4 md:flex-row md:items-center md:gap-5"
        >
          <!-- 도넛 -->
          <div
            v-if="stockChartUnavailable"
            class="flex flex-col items-center justify-center flex-shrink-0 px-4 text-center border border-dashed rounded-full h-36 w-36 text-[11px] text-muted-foreground"
          >
            <span>{{ rateMissingReason }}</span>
            <span>시장을 선택하면 시장 안의 비중을 볼 수 있습니다</span>
          </div>
          <div v-else class="relative flex-shrink-0 h-36 w-36">
            <Doughnut :data="stockChartData" :options="stockChartOptions" />
          </div>

          <!-- 범례 -->
          <div
            class="w-full max-h-36 overflow-y-auto space-y-1.5 pr-0.5 md:w-auto md:min-w-[140px]"
          >
            <div
              v-for="d in stockItems"
              :key="d.stockCode"
              class="flex items-center gap-2 text-xs"
            >
              <span
                class="flex-shrink-0 w-2 h-2 rounded-sm"
                :style="{ background: d.color }"
              />
              <span class="truncate text-foreground/80">{{ d.stockName }}</span>
              <span
                class="flex-shrink-0 ml-auto tabular-nums text-muted-foreground"
                >{{ d.pct }}%</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  DoughnutController,
  Legend,
  Tooltip,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import type { Holding } from "~/types";

ChartJS.register(ArcElement, DoughnutController, Legend, Tooltip);

const props = defineProps<{ holdings: Holding[]; pricesLoading?: boolean }>();

const MARKET_COLORS = { KR: "#3B82F6", US: "#22C55E" } as const;

const STOCK_COLORS = [
  "#8B5E3C",
  "#3B82F6",
  "#22C55E",
  "#F97316",
  "#8B5CF6",
  "#EF4444",
  "#F59E0B",
  "#06B6D4",
  "#EC4899",
  "#6B7280",
  "#84CC16",
  "#14B8A6",
];

const selectedMarket = ref<"KR" | "US" | null>(null);

function toggleMarket(market: "KR" | "US") {
  selectedMarket.value = selectedMarket.value === market ? null : market;
}

const { toKRW, rateMissingReason } = useExchangeRate();

// 같은 종목(market+stockCode)을 여러 계좌에 나눠 보유해도 하나로 합산해
// "종목 수"·비중 계산이 계좌 수만큼 중복 집계되지 않게 한다.
const aggregatedHoldings = computed(() => {
  const map = new Map<
    string,
    {
      stockCode: string;
      stockName: string;
      market: "KR" | "US";
      currency: "KRW" | "USD";
      evalAmount: number; // 종목 통화 기준
    }
  >();
  for (const h of props.holdings) {
    const key = stockKey(h.market, h.stockCode);
    if (!map.has(key)) {
      map.set(key, {
        stockCode: h.stockCode,
        stockName: h.stockName,
        market: h.market,
        currency: h.currency,
        evalAmount: 0,
      });
    }
    map.get(key)!.evalAmount += h.currentPrice * h.quantity;
  }
  return [...map.values()];
});

const hasEstimatedPrice = computed(
  () => !props.pricesLoading && props.holdings.some((h) => !h.priceAvailable),
);

// 국내·해외를 섞어 비교하려면 원화 환산이 필요하다. 환율이 없으면 비중을 계산하지 않는다.
// (한 시장 안에서는 통화가 같으므로 시장을 선택하면 환율 없이도 종목별 비중을 볼 수 있다.)
const rateMissing = computed(
  () => rateMissingReason.value != null && aggregatedHoldings.value.some((h) => h.currency === "USD"),
);

// --- Chart 1: 국내/해외 (평가금액 기준) ---

const marketLegend = computed(() => {
  const kr = aggregatedHoldings.value.filter((h) => h.market === "KR");
  const us = aggregatedHoldings.value.filter((h) => h.market === "US");
  const sumKRW = (list: typeof kr) =>
    list.reduce((s, h) => s + (toKRW(h.currency, h.evalAmount) ?? 0), 0);
  const krAmount = rateMissing.value ? 0 : sumKRW(kr);
  const usAmount = rateMissing.value ? 0 : sumKRW(us);
  const total = krAmount + usAmount;
  if (!rateMissing.value && total === 0) return [];
  const pct = (amount: number) =>
    rateMissing.value ? null : ((amount / total) * 100).toFixed(0);
  const result = [];
  if (kr.length > 0)
    result.push({
      market: "KR" as const,
      label: "국내",
      count: kr.length,
      amount: krAmount,
      pct: pct(krAmount),
      color: MARKET_COLORS.KR,
    });
  if (us.length > 0)
    result.push({
      market: "US" as const,
      label: "해외",
      count: us.length,
      amount: usAmount,
      pct: pct(usAmount),
      color: MARKET_COLORS.US,
    });
  return result;
});

const marketChartData = computed<ChartData<"doughnut">>(() => ({
  labels: marketLegend.value.map((d) => d.label),
  datasets: [
    {
      data: marketLegend.value.map((d) => d.amount),
      backgroundColor: marketLegend.value.map((d) =>
        !selectedMarket.value || selectedMarket.value === d.market
          ? d.color
          : `${d.color}55`,
      ),
      offset: marketLegend.value.map((d) =>
        selectedMarket.value === d.market ? 10 : 0,
      ),
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}));

const marketChartOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  animation: { duration: 250 },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const total = (ctx.dataset.data as number[]).reduce(
            (a, b) => a + b,
            0,
          );
          const pct = (((ctx.raw as number) / total) * 100).toFixed(0);
          const d = marketLegend.value.find((m) => m.label === ctx.label);
          return ` ${ctx.label}: ${d?.count ?? 0}종목 (${pct}%)`;
        },
      },
    },
  },
  onClick: (_, elements) => {
    if (!elements.length) return;
    const markets: ("KR" | "US")[] = marketLegend.value.map((d) => d.market);
    const clicked = markets[elements[0]!.index];
    if (clicked) toggleMarket(clicked);
  },
};

// --- Chart 2: 종목별 ---

// 전체 보기에서 국내·해외가 섞여 있는데 환율이 없으면 종목별 비중도 계산할 수 없다.
const stockChartUnavailable = computed(() => !selectedMarket.value && rateMissing.value);

const stockItems = computed(() => {
  if (stockChartUnavailable.value) return [];
  const filtered = selectedMarket.value
    ? aggregatedHoldings.value.filter((h) => h.market === selectedMarket.value)
    : aggregatedHoldings.value;
  if (filtered.length === 0) return [];

  const withValue = filtered.map((h) => ({
    stockCode: h.stockCode,
    stockName: h.stockName,
    // 시장을 고르면 통화가 하나이므로 종목 통화 그대로 비교한다.
    value: selectedMarket.value ? h.evalAmount : (toKRW(h.currency, h.evalAmount) ?? 0),
  }));

  const sorted = [...withValue].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, h) => s + h.value, 0);

  return sorted.map((h, i) => ({
    ...h,
    pct:
      total > 0
        ? ((h.value / total) * 100).toFixed(0)
        : (100 / sorted.length).toFixed(0),
    color: STOCK_COLORS[i % STOCK_COLORS.length]!,
  }));
});

const stockChartData = computed<ChartData<"doughnut">>(() => ({
  labels: stockItems.value.map((d) => d.stockName),
  datasets: [
    {
      data: stockItems.value.map((d) => d.value),
      backgroundColor: stockItems.value.map((d) => d.color),
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}));

const stockChartOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  animation: { duration: 250 },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const total = (ctx.dataset.data as number[]).reduce(
            (a, b) => a + b,
            0,
          );
          const pct = (((ctx.raw as number) / total) * 100).toFixed(1);
          return ` ${ctx.label}: ${pct}%`;
        },
      },
    },
  },
};

const stockChartTitle = computed(() => {
  if (selectedMarket.value === "KR") return "국내 종목별 비중";
  if (selectedMarket.value === "US") return "해외 종목별 비중";
  return "전체 종목별 비중";
});

const stockChartBasis = "평가금액 기준";
</script>
