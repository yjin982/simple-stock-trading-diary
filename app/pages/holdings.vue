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
        :trend="summary.krwPnl >= 0 ? 'positive' : 'negative'"
      />
      <UiCard
        title="해외 평가금액"
        :value="fmtUSD(summary.usdTotal)"
        :sub-value="fmtPnl(summary.usdPnl, 'USD')"
        :trend="summary.usdPnl >= 0 ? 'positive' : 'negative'"
      />
      <UiCard
        title="평균 수익률"
        :value="fmtPnlRate(summary.avgRate)"
        :trend="summary.avgRate >= 0 ? 'positive' : 'negative'"
      />
    </div>

    <!-- 필터 + 정렬 -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex rounded-md border bg-card p-0.5">
        <button
          v-for="f in MARKET_FILTERS"
          :key="f.value"
          class="rounded px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            selectedMarket === f.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="selectedMarket = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-xs text-muted-foreground">정렬</span>
        <div class="flex rounded-md border bg-card p-0.5">
          <button
            v-for="s in SORT_OPTIONS"
            :key="s.value"
            class="rounded px-3 py-1.5 text-sm font-medium transition-colors"
            :class="
              sortBy === s.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="setSortBy(s.value)"
          >
            {{ s.label }}
          </button>
        </div>
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
    <div
      v-if="sortedHoldings.length === 0"
      class="flex flex-col items-center gap-3 rounded-lg border bg-card py-16 text-center shadow-sm"
    >
      <div class="rounded-full bg-muted p-3">
        <Briefcase class="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p class="text-sm font-medium">보유 종목이 없습니다</p>
        <p class="mt-0.5 text-xs text-muted-foreground">
          선택한 시장에 보유 중인 종목이 없어요.
        </p>
      </div>
    </div>

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
                    :class="
                      h.currentPrice >= h.avgPrice
                        ? 'text-emerald-600'
                        : 'text-red-500'
                    "
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
                  :class="h.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'"
                >
                  {{ fmtPnl(h.pnl, h.currency) }}
                </td>
                <td
                  class="px-4 py-3 text-right font-medium"
                  :class="h.pnlRate >= 0 ? 'text-emerald-600' : 'text-red-500'"
                >
                  {{ fmtPnlRate(h.pnlRate) }}
                </td>
              </tr>

              <!-- 아코디언 상세: 매수-매도 이력 테이블 -->
              <tr v-if="expanded[h.stockCode]" class="border-b bg-muted">
                <td colspan="7" class="bg-muted/20 px-6 pb-4 pt-3">
                  <table class="w-full text-xs table-fixed">
                    <thead>
                      <tr class="border-b border-muted-foreground/50">
                        <th
                          class="pb-2 text-left font-medium text-muted-foreground"
                        >
                          매수일
                        </th>
                        <th
                          class="pb-2 text-left font-medium text-muted-foreground"
                        >
                          매도일
                        </th>
                        <th
                          class="pb-2 text-left font-medium text-muted-foreground"
                        >
                          보유기간
                        </th>
                        <th
                          class="pb-2 text-right font-medium text-muted-foreground"
                        >
                          수량
                        </th>
                        <th
                          class="pb-2 text-right font-medium text-muted-foreground"
                        >
                          수익률
                        </th>
                        <th
                          class="pb-2 text-right font-medium text-muted-foreground"
                        >
                          실현손익
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-if="tradeMatches[h.stockCode]?.length">
                        <tr
                          v-for="(match, i) in tradeMatches[h.stockCode]"
                          :key="i"
                          class="border-b border-muted/60 last:border-0"
                        >
                          <td class="py-2">
                            {{ formatTradeDate(match.buyDate) }}
                          </td>
                          <td class="py-2">
                            {{ formatTradeDate(match.sellDate) }}
                          </td>
                          <td class="py-2 text-left">
                            {{ match.holdingDays }}일
                          </td>
                          <td class="py-2 text-right">
                            {{ match.quantity }}주
                          </td>
                          <td
                            class="py-2 text-right"
                            :class="
                              match.pnlRate >= 0
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            "
                          >
                            {{ fmtPnlRate(match.pnlRate) }}
                          </td>
                          <td
                            class="py-2 text-right font-medium"
                            :class="
                              match.realizedPnl >= 0
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            "
                          >
                            {{ fmtPnl(match.realizedPnl, match.currency) }}
                          </td>
                        </tr>
                      </template>
                      <tr v-else>
                        <td
                          colspan="6"
                          class="py-3 text-center text-muted-foreground"
                        >
                          아직 매도 내역이 없습니다
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
import { dummyHoldings, dummyTradeData } from "~/lib/dummy-data";

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

// --- FIFO 매수-매도 매칭 ---
interface TradeMatch {
  buyDate: string;
  sellDate: string;
  holdingDays: number;
  quantity: number;
  pnlRate: number;
  realizedPnl: number;
  currency: "KRW" | "USD";
}

const tradeMatches = computed<Record<string, TradeMatch[]>>(() => {
  const result: Record<string, TradeMatch[]> = {};

  for (const h of dummyHoldings) {
    result[h.stockCode] = [];
  }

  // 종목별 거래 수집 후 날짜 오름차순 정렬
  const tradesByStock: Record<
    string,
    Array<{
      date: string;
      type: "BUY" | "SELL";
      quantity: number;
      price: number;
      pnl?: number;
    }>
  > = {};

  for (const h of dummyHoldings) {
    tradesByStock[h.stockCode] = [];
  }

  for (const [date, trades] of Object.entries(dummyTradeData)) {
    for (const trade of trades) {
      if (tradesByStock[trade.stockCode]) {
        tradesByStock[trade.stockCode]!.push({
          date,
          type: trade.type,
          quantity: trade.quantity,
          price: trade.price,
          pnl: trade.pnl,
        });
      }
    }
  }

  for (const [stockCode, trades] of Object.entries(tradesByStock)) {
    const currency =
      dummyHoldings.find((h) => h.stockCode === stockCode)?.currency ?? "KRW";
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

    // FIFO 큐: 미매도 매수 잔량
    const buyQueue: Array<{
      date: string;
      remainingQty: number;
      price: number;
    }> = [];

    for (const trade of sorted) {
      if (trade.type === "BUY") {
        buyQueue.push({
          date: trade.date,
          remainingQty: trade.quantity,
          price: trade.price,
        });
      } else {
        // SELL: FIFO로 매수 잔량 소진
        let sellQty = trade.quantity;
        const matchedLots: Array<{ date: string; qty: number; price: number }> =
          [];

        while (sellQty > 0 && buyQueue.length > 0) {
          const buy = buyQueue[0]!;
          const matchQty = Math.min(sellQty, buy.remainingQty);
          matchedLots.push({ date: buy.date, qty: matchQty, price: buy.price });
          buy.remainingQty -= matchQty;
          sellQty -= matchQty;
          if (buy.remainingQty === 0) buyQueue.shift();
        }

        if (matchedLots.length === 0) continue;

        const totalBuyCost = matchedLots.reduce(
          (s, l) => s + l.qty * l.price,
          0,
        );
        const totalQty = matchedLots.reduce((s, l) => s + l.qty, 0);
        const avgBuyPrice = totalBuyCost / totalQty;
        const buyDate = matchedLots[0]!.date;

        const [by, bm, bd] = buyDate.split("-").map(Number);
        const [sy, sm, sd] = trade.date.split("-").map(Number);
        const holdingDays = Math.floor(
          (new Date(sy, sm - 1, sd).getTime() -
            new Date(by, bm - 1, bd).getTime()) /
            86400000,
        );

        const realizedPnl = trade.pnl ?? (trade.price - avgBuyPrice) * totalQty;
        const pnlRate = (realizedPnl / (avgBuyPrice * totalQty)) * 100;

        result[stockCode]!.push({
          buyDate,
          sellDate: trade.date,
          holdingDays,
          quantity: totalQty,
          pnlRate,
          realizedPnl,
          currency,
        });
      }
    }
  }

  return result;
});

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
