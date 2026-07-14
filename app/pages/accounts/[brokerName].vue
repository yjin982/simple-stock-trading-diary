<template>
  <div class="space-y-5">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/accounts"
          class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft class="h-4 w-4" />
        </NuxtLink>
        <div class="flex items-center gap-2">
          <Building2 class="h-4 w-4 text-muted-foreground" />
          <h1 class="text-base font-semibold">{{ brokerName }}</h1>
        </div>
      </div>
      <UiPriceDelayNotice :time="priceTime" />
    </div>

    <!-- 빈 상태 -->
    <UiEmptyState
      v-if="brokerAccounts.length === 0"
      :icon="Wallet"
      title="계좌가 없습니다"
      description="해당 증권사에 등록된 계좌가 없습니다."
      card
    />

    <!-- 계좌별 보유 현황 -->
    <section
      v-for="{ account, holdings, summary } in accountsWithHoldings"
      :key="account.id"
      class="rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <!-- 계좌 헤더 -->
      <div class="flex items-center gap-2 border-b px-5 py-3">
        <span class="font-semibold">{{ account.alias }}</span>
        <span
          class="rounded border px-1.5 py-0.5 text-[11px] font-medium"
          :class="currencyClass(account.currency)"
        >
          {{ account.currency }}
        </span>
        <span
          v-if="account.accountNumber"
          class="text-xs text-muted-foreground"
        >
          {{ account.accountNumber }}
        </span>
        <span class="ml-auto text-xs text-muted-foreground"
          >{{ holdings.length }}종목</span
        >
      </div>

      <!-- 계좌 요약 -->
      <div class="grid grid-cols-2 divide-x divide-y border-b sm:grid-cols-4 sm:divide-y-0">
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">평가금액</p>
          <p class="mt-1 text-sm font-semibold">
            {{ summary.hasKRW ? fmtKRW(summary.evalKRW) : fmtUSD(summary.evalUSD) }}
          </p>
          <p v-if="summary.hasKRW && summary.hasUSD" class="text-xs text-muted-foreground">{{ fmtUSD(summary.evalUSD) }}</p>
        </div>
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">미실현손익</p>
          <p class="mt-1 text-sm font-semibold" :class="pnlColor(summary.hasKRW ? summary.unrealizedKRW : summary.unrealizedUSD)">
            {{ summary.hasKRW ? fmtPnl(summary.unrealizedKRW, 'KRW') : fmtPnl(summary.unrealizedUSD, 'USD') }}
          </p>
          <p v-if="summary.hasKRW && summary.hasUSD" class="text-xs" :class="pnlColor(summary.unrealizedUSD)">{{ fmtPnl(summary.unrealizedUSD, 'USD') }}</p>
        </div>
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">실현손익</p>
          <p class="mt-1 text-sm font-semibold" :class="pnlColor(summary.hasKRW ? summary.realizedKRW : summary.realizedUSD)">
            {{ summary.hasKRW ? fmtPnl(summary.realizedKRW, 'KRW') : fmtPnl(summary.realizedUSD, 'USD') }}
          </p>
          <p v-if="summary.hasKRW && summary.hasUSD" class="text-xs" :class="pnlColor(summary.realizedUSD)">{{ fmtPnl(summary.realizedUSD, 'USD') }}</p>
        </div>
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">수익률</p>
          <p class="mt-1 text-sm font-semibold" :class="pnlColor(summary.hasKRW ? summary.returnKRW : summary.returnUSD)">
            {{ summary.hasKRW ? fmtPnlRate(summary.returnKRW) : fmtPnlRate(summary.returnUSD) }}
          </p>
          <p v-if="summary.hasKRW && summary.hasUSD" class="text-xs" :class="pnlColor(summary.returnUSD)">{{ fmtPnlRate(summary.returnUSD) }}</p>
        </div>
      </div>

      <!-- 보유 없음 -->
      <p
        v-if="holdings.length === 0"
        class="px-5 py-4 text-sm text-muted-foreground"
      >
        보유 종목 없음
      </p>

      <!-- 보유 종목 테이블 -->
      <div v-else class="overflow-x-auto">
        <table class="w-full table-fixed min-w-[480px] text-sm">
          <thead>
            <tr class="border-b">
              <th
                class="px-5 pb-2 pt-3 text-left text-xs font-medium text-muted-foreground"
              >
                종목
              </th>
              <th
                class="px-5 pb-2 pt-3 text-right text-xs font-medium text-muted-foreground"
              >
                수량
              </th>
              <th
                class="hidden px-5 pb-2 pt-3 text-right text-xs font-medium text-muted-foreground sm:table-cell"
              >
                평균단가
              </th>
              <th
                class="hidden px-5 pb-2 pt-3 text-right text-xs font-medium text-muted-foreground sm:table-cell"
              >
                현재가
              </th>
              <th
                class="px-5 pb-2 pt-3 text-right text-xs font-medium text-muted-foreground"
              >
                평가금액
              </th>
              <th
                class="px-5 pb-2 pt-3 text-right text-xs font-medium text-muted-foreground"
              >
                투자손익
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in holdings"
              :key="h.stockCode"
              class="border-b last:border-0"
            >
              <td class="px-5 py-2.5 align-top">
                <NuxtLink
                  :to="`/holdings/${h.stockCode}`"
                  class="flex items-center gap-1.5"
                >
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
                    <div class="font-medium hover:underline">
                      {{ h.stockName }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ h.stockCode }}
                    </div>
                  </div>
                </NuxtLink>
              </td>
              <td class="px-5 py-2.5 align-top text-right">
                {{ h.quantity.toLocaleString() }}주
              </td>
              <td class="hidden px-5 py-2.5 align-top text-right sm:table-cell">
                {{ fmtCurrency(h.avgPrice, h.currency) }}
              </td>
              <td class="hidden px-5 py-2.5 align-top text-right sm:table-cell">
                {{ fmtCurrency(h.currentPrice, h.currency) }}
              </td>
              <td class="px-5 py-2.5 align-top text-right font-medium">
                {{ fmtCurrency(h.evalAmount, h.currency) }}
              </td>
              <td
                class="px-5 py-2.5 align-top text-right"
                :class="pnlColor(h.pnl)"
              >
                <div class="font-medium">{{ fmtPnl(h.pnl, h.currency) }}</div>
                <div class="text-xs">{{ fmtPnlRate(h.pnlRate) }}</div>
              </td>
            </tr>
          </tbody>
          <!-- 계좌 합계 -->
          <tfoot>
            <tr class="border-t bg-muted/30">
              <td
                class="px-5 py-2 text-xs font-medium text-muted-foreground"
                colspan="4"
              >
                합계
              </td>
              <td class="px-5 py-2 text-right text-sm font-semibold">
                {{
                  fmtCurrency(
                    holdings.reduce((s, h) => s + h.evalAmount, 0),
                    holdings[0]!.currency,
                  )
                }}
              </td>
              <td
                class="px-5 py-2 text-right text-sm font-semibold"
                :class="pnlColor(holdings.reduce((s, h) => s + h.pnl, 0))"
              >
                {{
                  fmtPnl(
                    holdings.reduce((s, h) => s + h.pnl, 0),
                    holdings[0]!.currency,
                  )
                }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { Building2, ChevronLeft, Wallet } from "@lucide/vue";

const route = useRoute();
const brokerName = decodeURIComponent(route.params.brokerName as string);

const accountsStore = useAccountsStore();
const tradesStore = useTradesStore();

onMounted(() => {
  accountsStore.fetchAll();
  tradesStore.fetchAll();
});

const brokerAccounts = computed(() =>
  accountsStore.items.filter((a) => (a.brokerName || "기타") === brokerName),
);

const brokerTrades = computed(() =>
  tradesStore.items.filter((t) => brokerAccounts.value.some((a) => a.id === t.accountId)),
);

const brokerPositions = computed(() => buildFifoPositions(brokerTrades.value));

const yahooSymbols = computed(() =>
  [...brokerPositions.value.values()]
    .filter((pos) => lotsQty(pos.lots) > 0)
    .map((pos) => toYahooSymbol(pos.stockCode, pos.market, pos.exchange)),
);

const { priceMap, priceTime } = usePriceMap(yahooSymbols);

type AccountHolding = {
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  currency: "KRW" | "USD";
  quantity: number;
  avgPrice: number;
  totalCost: number;
  currentPrice: number;
  evalAmount: number;
  pnl: number;
  pnlRate: number;
};

function computeHoldings(accountId: string): AccountHolding[] {
  const trades = tradesStore.items.filter((t) => t.accountId === accountId);
  const positions = buildFifoPositions(trades);
  const result: AccountHolding[] = [];

  for (const pos of positions.values()) {
    const quantity = lotsQty(pos.lots);
    if (quantity <= 0) continue;
    const totalCost = lotsCost(pos.lots);
    const avgPrice = lotsAvgPrice(pos.lots);
    const sym = toYahooSymbol(pos.stockCode, pos.market, pos.exchange);
    const currentPrice = priceMap.value[sym] ?? avgPrice;
    const evalAmount = currentPrice * quantity;
    const pnl = calcPnl(evalAmount, totalCost);

    result.push({
      stockCode: pos.stockCode,
      stockName: pos.stockName,
      market: pos.market,
      currency: pos.currency,
      quantity,
      avgPrice,
      totalCost,
      currentPrice,
      evalAmount,
      pnl,
      pnlRate: calcPnlRate(pnl, totalCost),
    });
  }
  return result;
}

function computeAccountSummary(accountId: string, holdings: AccountHolding[]) {
  const trades = tradesStore.items.filter((t) => t.accountId === accountId)
  const realized = computeRealizedPnl(trades)

  const krw = holdings.filter((h) => h.currency === 'KRW')
  const usd = holdings.filter((h) => h.currency === 'USD')

  const evalKRW = krw.reduce((s, h) => s + h.evalAmount, 0)
  const evalUSD = usd.reduce((s, h) => s + h.evalAmount, 0)
  const unrealizedKRW = krw.reduce((s, h) => s + h.pnl, 0)
  const unrealizedUSD = usd.reduce((s, h) => s + h.pnl, 0)
  const costKRW = krw.reduce((s, h) => s + h.totalCost, 0)
  const costUSD = usd.reduce((s, h) => s + h.totalCost, 0)
  const hasKRW = trades.some((t) => t.currency === 'KRW')
  const hasUSD = trades.some((t) => t.currency === 'USD')

  return {
    evalKRW, evalUSD,
    unrealizedKRW, unrealizedUSD,
    realizedKRW: realized.KRW, realizedUSD: realized.USD,
    returnKRW: costKRW > 0 ? ((unrealizedKRW + realized.KRW) / costKRW) * 100 : 0,
    returnUSD: costUSD > 0 ? ((unrealizedUSD + realized.USD) / costUSD) * 100 : 0,
    hasKRW, hasUSD,
  }
}

const accountsWithHoldings = computed(() =>
  brokerAccounts.value.map((account) => {
    const holdings = computeHoldings(account.id)
    return { account, holdings, summary: computeAccountSummary(account.id, holdings) }
  }),
);

function currencyClass(currency: string) {
  if (currency === "KRW") return "border-blue-200 bg-blue-50 text-blue-700";
  if (currency === "USD") return "border-green-200 bg-green-50 text-green-700";
  return "border-purple-200 bg-purple-50 text-purple-700";
}
</script>
