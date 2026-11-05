<template>
  <div class="space-y-5">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/accounts"
          class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft class="w-4 h-4" />
        </NuxtLink>
        <div class="flex items-center gap-2">
          <Building2 class="w-4 h-4 text-muted-foreground" />
          <h1 class="text-base font-semibold">{{ brokerName }}</h1>
        </div>
      </div>
      <UiPriceDelayNotice :time="priceTime" />
    </div>

    <UiEstimatedPriceNotice
      :holdings="accountsWithHoldings.flatMap((a) => a.holdings)"
      :loading="pricesLoading"
    />

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
      class="border rounded-lg shadow-sm bg-card text-card-foreground"
    >
      <!-- 계좌 헤더 -->
      <div class="flex items-center gap-2 px-5 py-3 border-b">
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
      <div
        class="grid grid-cols-2 border-b divide-x divide-y sm:grid-cols-4 sm:divide-y-0"
      >
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">평가금액</p>
          <p class="mt-1 text-sm font-semibold">
            {{
              summary.hasKRW ? fmtKRW(summary.evalKRW) : fmtUSD(summary.evalUSD)
            }}
          </p>
          <p
            v-if="summary.hasKRW && summary.hasUSD"
            class="text-xs text-muted-foreground"
          >
            {{ fmtUSD(summary.evalUSD) }}
          </p>
        </div>
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">미실현손익</p>
          <p
            class="mt-1 text-sm font-semibold"
            :class="
              pnlColor(
                summary.hasKRW ? summary.unrealizedKRW : summary.unrealizedUSD,
              )
            "
          >
            {{
              summary.hasKRW
                ? fmtPnl(summary.unrealizedKRW, "KRW")
                : fmtPnl(summary.unrealizedUSD, "USD")
            }}
          </p>
          <p
            v-if="summary.hasKRW && summary.hasUSD"
            class="text-xs"
            :class="pnlColor(summary.unrealizedUSD)"
          >
            {{ fmtPnl(summary.unrealizedUSD, "USD") }}
          </p>
        </div>
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">실현손익</p>
          <p
            class="mt-1 text-sm font-semibold"
            :class="
              pnlColor(
                summary.hasKRW ? summary.realizedKRW : summary.realizedUSD,
              )
            "
          >
            {{
              summary.hasKRW
                ? fmtPnl(summary.realizedKRW, "KRW")
                : fmtPnl(summary.realizedUSD, "USD")
            }}
          </p>
          <p
            v-if="summary.hasKRW && summary.hasUSD"
            class="text-xs"
            :class="pnlColor(summary.realizedUSD)"
          >
            {{ fmtPnl(summary.realizedUSD, "USD") }}
          </p>
        </div>
        <div class="px-5 py-3">
          <p class="text-xs text-muted-foreground">수익률</p>
          <p
            class="mt-1 text-sm font-semibold"
            :class="
              pnlColor(summary.hasKRW ? summary.returnKRW : summary.returnUSD)
            "
          >
            {{
              summary.hasKRW
                ? fmtPnlRate(summary.returnKRW)
                : fmtPnlRate(summary.returnUSD)
            }}
          </p>
          <p
            v-if="summary.hasKRW && summary.hasUSD"
            class="text-xs"
            :class="pnlColor(summary.returnUSD)"
          >
            {{ fmtPnlRate(summary.returnUSD) }}
          </p>
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
                class="px-5 pt-3 pb-2 text-xs font-medium text-left text-muted-foreground"
              >
                종목
              </th>
              <th
                class="px-5 pt-3 pb-2 text-xs font-medium text-right text-muted-foreground"
              >
                수량
              </th>
              <th
                class="hidden px-5 pt-3 pb-2 text-xs font-medium text-right text-muted-foreground sm:table-cell"
              >
                평균단가
              </th>
              <th
                class="hidden px-5 pt-3 pb-2 text-xs font-medium text-right text-muted-foreground sm:table-cell"
              >
                현재가
              </th>
              <th
                class="px-5 pt-3 pb-2 text-xs font-medium text-right text-muted-foreground"
              >
                평가금액
              </th>
              <th
                class="px-5 pt-3 pb-2 text-xs font-medium text-right text-muted-foreground"
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
                  :to="`/holdings/${h.market}/${h.stockCode}`"
                  class="flex items-center gap-1.5"
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
              <td class="px-5 py-2.5 align-top text-right">
                {{ h.quantity.toLocaleString() }}주
              </td>
              <td class="hidden px-5 py-2.5 align-top text-right sm:table-cell">
                <div>{{ fmtCurrency(h.avgPrice, h.currency) }}</div>
                <div
                  v-if="h.currency === 'USD'"
                  class="text-xs text-muted-foreground"
                >
                  {{ krwEquiv(h.avgPrice) }}
                </div>
              </td>
              <td class="hidden px-5 py-2.5 align-top text-right sm:table-cell">
                <template v-if="h.priceAvailable">
                  <div>{{ fmtCurrency(h.currentPrice, h.currency) }}</div>
                  <div
                    v-if="h.currency === 'USD'"
                    class="text-xs text-muted-foreground"
                  >
                    {{ krwEquiv(h.currentPrice) }}
                  </div>
                </template>
                <span v-else class="text-xs text-muted-foreground" title="가격 조회 실패">—</span>
              </td>
              <td class="px-5 py-2.5 align-top text-right font-medium">
                <template v-if="h.priceAvailable">
                  <div>{{ fmtCurrency(h.evalAmount, h.currency) }}</div>
                  <div
                    v-if="h.currency === 'USD'"
                    class="text-xs font-normal text-muted-foreground"
                  >
                    {{ krwEquiv(h.evalAmount) }}
                  </div>
                </template>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </td>
              <td
                class="px-5 py-2.5 align-top text-right"
                :class="h.priceAvailable ? pnlColor(h.pnl) : ''"
              >
                <template v-if="h.priceAvailable">
                  <div class="font-medium">{{ fmtPnl(h.pnl, h.currency) }}</div>
                  <div class="text-xs">{{ fmtPnlRate(h.pnlRate) }}</div>
                  <div
                    v-if="h.currency === 'USD'"
                    class="text-xs text-muted-foreground"
                  >
                    {{ krwEquiv(h.pnl) }}
                  </div>
                </template>
                <span v-else class="text-xs text-muted-foreground">가격 조회 실패</span>
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
              <td class="px-5 py-2 text-sm font-semibold text-right">
                {{
                  fmtCurrency(
                    holdings.reduce((s, h) => s + h.evalAmount, 0),
                    holdings[0]!.currency,
                  )
                }}
              </td>
              <td
                class="px-5 py-2 text-sm font-semibold text-right"
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

    <UiPnlDisclaimer v-if="brokerAccounts.length > 0" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

import { Building2, ChevronLeft, Wallet } from "@lucide/vue";
import type { PositionHolding } from "~/utils/calc";
import type { Trade } from "~/types";

const route = useRoute();
const brokerName = decodeURIComponent(route.params.brokerName as string);

const accountsStore = useAccountsStore();
const tradesStore = useTradesStore();

const brokerAccounts = computed(() =>
  accountsStore.items.filter((a) => (a.brokerName || "기타") === brokerName),
);

const brokerTrades = computed(() =>
  tradesStore.items.filter((t) =>
    brokerAccounts.value.some((a) => a.id === t.accountId),
  ),
);

const brokerPositions = computed(() => buildFifoPositions(brokerTrades.value));

const yahooSymbols = computed(() =>
  [...brokerPositions.value.values()]
    .filter((pos) => lotsQty(pos.lots) > QTY_EPSILON)
    .map((pos) => toYahooSymbol(pos.stockCode, pos.market, pos.exchange)),
);

const { priceMap, priceTime, loading: pricesLoading } = usePriceMap(yahooSymbols);

const { krwEquiv } = useExchangeRate();

function computeAccountSummary(trades: Trade[], holdings: PositionHolding[]) {
  const realized = computeRealizedPnl(trades);
  const agg = aggregateByCurrency(holdings);
  const hasKRW = trades.some((t) => t.currency === "KRW");
  const hasUSD = trades.some((t) => t.currency === "USD");

  return {
    evalKRW: agg.evalKRW,
    evalUSD: agg.evalUSD,
    unrealizedKRW: agg.unrealizedKRW,
    unrealizedUSD: agg.unrealizedUSD,
    realizedKRW: realized.KRW,
    realizedUSD: realized.USD,
    returnKRW: agg.returnRateKRW,
    returnUSD: agg.returnRateUSD,
    hasKRW,
    hasUSD,
  };
}

const accountsWithHoldings = computed(() =>
  brokerAccounts.value.map((account) => {
    const trades = tradesStore.items.filter((t) => t.accountId === account.id);
    const positions = [...brokerPositions.value.values()].filter(
      (pos) => pos.accountId === account.id,
    );
    const holdings = computeHoldingsFromPositions(positions, priceMap.value);
    return {
      account,
      holdings,
      summary: computeAccountSummary(trades, holdings),
    };
  }),
);
</script>
