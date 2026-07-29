<template>
  <section
    v-if="holdings.length > 0"
    class="p-5 border rounded-lg shadow-sm bg-card text-card-foreground"
  >
    <h2 class="mb-5 text-sm font-semibold">포트폴리오 비중</h2>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1px_1fr]">
      <!-- Chart 1: 국내/해외 -->
      <div>
        <div class="mb-3 text-center md:text-left">
          <p class="text-xs font-medium">시장별 비중</p>
          <p class="text-[11px] text-muted-foreground">종목 수 기준</p>
        </div>

        <div
          class="flex flex-col items-center justify-center gap-4 md:flex-row md:items-center md:gap-5"
        >
          <!-- 도넛 -->
          <div class="relative flex-shrink-0 h-36 w-36">
            <Doughnut :data="marketChartData" :options="marketChartOptions" />
            <div
              class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <span class="text-base font-bold">{{ holdings.length }}</span>
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
                >{{ d.pct }}%</span
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
          <div class="relative flex-shrink-0 h-36 w-36">
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

const props = defineProps<{ holdings: Holding[] }>();

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

// --- Chart 1: 국내/해외 ---

const marketLegend = computed(() => {
  const kr = props.holdings.filter((h) => h.market === "KR").length;
  const us = props.holdings.filter((h) => h.market === "US").length;
  const total = kr + us;
  if (total === 0) return [];
  const result = [];
  if (kr > 0)
    result.push({
      market: "KR" as const,
      label: "국내",
      count: kr,
      pct: ((kr / total) * 100).toFixed(0),
      color: MARKET_COLORS.KR,
    });
  if (us > 0)
    result.push({
      market: "US" as const,
      label: "해외",
      count: us,
      pct: ((us / total) * 100).toFixed(0),
      color: MARKET_COLORS.US,
    });
  return result;
});

const marketChartData = computed<ChartData<"doughnut">>(() => ({
  labels: marketLegend.value.map((d) => d.label),
  datasets: [
    {
      data: marketLegend.value.map((d) => d.count),
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
          return ` ${ctx.label}: ${ctx.raw}종목 (${pct}%)`;
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

const stockItems = computed(() => {
  const filtered = selectedMarket.value
    ? props.holdings.filter((h) => h.market === selectedMarket.value)
    : props.holdings;
  if (filtered.length === 0) return [];

  const byEval = !!selectedMarket.value;
  const withValue = filtered.map((h) => ({
    stockCode: h.stockCode,
    stockName: h.stockName,
    value: byEval ? h.currentPrice * h.quantity : 1,
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

const stockChartBasis = computed(() =>
  selectedMarket.value ? "평가금액 기준" : "종목 수 기준",
);
</script>
