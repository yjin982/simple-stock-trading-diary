<template>
  <section>
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-base font-semibold">포트폴리오 요약</h1>
    </div>
    <div
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      :class="{ 'opacity-60': pricesLoading }"
    >
      <UiCard
        title="총 평가금액"
        :value="evalDisp.value"
        :sub-value="evalDisp.sub"
      />
      <UiCard
        title="평가손익"
        :value="unrealizedDisp.value"
        :sub-value="unrealizedDisp.sub"
        :trend="unrealizedDisp.trend"
      />
      <UiCard
        title="실현손익"
        :value="realizedDisp.value"
        :sub-value="realizedDisp.sub"
        :trend="realizedDisp.trend"
      />
      <UiCard
        title="총 매수금액"
        :value="costDisp.value"
        :sub-value="costDisp.sub"
      />
      <UiCard
        title="총 수익률"
        :value="returnDisp.value"
        :sub-value="returnDisp.sub"
        :trend="returnDisp.trend"
        class="col-span-2 sm:col-span-1"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Holding, Trade } from "~/types";

const props = defineProps<{
  holdings: Holding[];
  trades: Trade[];
  priceTime?: string | null;
  pricesLoading?: boolean;
}>();

const emit = defineEmits<{ "open-modal": [] }>();

const summary = useSummary(
  computed(() => props.holdings),
  toRef(props, "trades"),
);

function amountDisplay(
  krw: number,
  usd: number,
  hasKRW: boolean,
  hasUSD: boolean,
) {
  if (!hasKRW && !hasUSD) return { value: "—", sub: undefined };
  if (hasKRW && !hasUSD) return { value: fmtKRW(krw), sub: undefined };
  if (!hasKRW && hasUSD) return { value: fmtUSD(usd), sub: undefined };
  return { value: fmtKRW(krw), sub: fmtUSD(usd) };
}

function pnlDisplay(
  krw: number,
  usd: number,
  hasKRW: boolean,
  hasUSD: boolean,
) {
  if (!hasKRW && !hasUSD)
    return { value: "—", sub: undefined, trend: "neutral" as const };
  if (hasKRW && !hasUSD)
    return { value: fmtPnl(krw, "KRW"), sub: undefined, trend: pnlTrend(krw) };
  if (!hasKRW && hasUSD)
    return { value: fmtPnl(usd, "USD"), sub: undefined, trend: pnlTrend(usd) };
  return {
    value: fmtPnl(krw, "KRW"),
    sub: fmtPnl(usd, "USD"),
    trend: pnlTrend(krw),
  };
}

function rateDisplay(
  krw: number,
  usd: number,
  hasKRW: boolean,
  hasUSD: boolean,
) {
  if (!hasKRW && !hasUSD)
    return { value: "—", sub: undefined, trend: "neutral" as const };
  if (hasKRW && !hasUSD)
    return { value: fmtPnlRate(krw), sub: undefined, trend: pnlTrend(krw) };
  if (!hasKRW && hasUSD)
    return { value: fmtPnlRate(usd), sub: undefined, trend: pnlTrend(usd) };
  return { value: fmtPnlRate(krw), sub: fmtPnlRate(usd), trend: pnlTrend(krw) };
}

const evalDisp = computed(() =>
  amountDisplay(
    summary.value.evalKRW,
    summary.value.evalUSD,
    summary.value.hasKRW,
    summary.value.hasUSD,
  ),
);
const unrealizedDisp = computed(() =>
  pnlDisplay(
    summary.value.unrealizedKRW,
    summary.value.unrealizedUSD,
    summary.value.hasKRW,
    summary.value.hasUSD,
  ),
);
const realizedDisp = computed(() =>
  pnlDisplay(
    summary.value.realizedKRW,
    summary.value.realizedUSD,
    summary.value.hasKRW,
    summary.value.hasUSD,
  ),
);
const costDisp = computed(() =>
  amountDisplay(
    summary.value.costKRW,
    summary.value.costUSD,
    summary.value.hasKRW,
    summary.value.hasUSD,
  ),
);
const returnDisp = computed(() =>
  rateDisplay(
    summary.value.returnRateKRW,
    summary.value.returnRateUSD,
    summary.value.hasKRW,
    summary.value.hasUSD,
  ),
);
</script>
