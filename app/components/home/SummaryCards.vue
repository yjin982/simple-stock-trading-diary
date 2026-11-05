<template>
  <section>
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-base font-semibold">포트폴리오 요약</h1>
    </div>

    <p
      v-if="summary.hasDataIssue"
      class="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
    >
      일부 종목에서 보유수량을 초과하는 매도 이력이 발견되어 실현손익 계산이 정확하지 않을 수 있습니다. 매매내역을 확인해주세요.
    </p>
    <UiEstimatedPriceNotice :holdings="holdings" :loading="pricesLoading" class="mb-3" />

    <!-- 합산 요약 카드 -->
    <div
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      :class="{ 'opacity-60': pricesLoading }"
    >
      <UiCard
        title="총 평가금액"
        :value="evalDisp.value"
        :sub-value="combinedSubValue"
      />
      <UiCard
        title="평가손익"
        :value="unrealizedDisp.value"
        :sub-value="rateMissingSub"
        :trend="unrealizedDisp.trend"
      />
      <UiCard
        title="실현손익"
        :value="realizedDisp.value"
        :sub-value="rateMissingSub"
        :trend="realizedDisp.trend"
      />
      <UiCard
        title="총 매수금액"
        :value="costDisp.value"
        :sub-value="rateMissingSub"
      />
      <UiCard
        title="총 수익률"
        :value="returnDisp.value"
        :sub-value="rateMissingSub"
        :trend="returnDisp.trend"
        class="col-span-2 sm:col-span-1"
      />
    </div>

    <!-- 통화별 세부 카드 (KRW/USD 모두 있을 때만) -->
    <div
      v-if="summary.hasKRW && summary.hasUSD"
      class="grid grid-cols-2 gap-3 mt-3"
      :class="{ 'opacity-60': pricesLoading }"
    >
      <!-- 국내 KRW -->
      <div class="rounded-lg border bg-card shadow-sm p-4 space-y-2.5">
        <div class="flex items-center gap-1.5">
          <span
            class="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            KRW
          </span>
          <span class="text-[10px] text-muted-foreground">국내</span>
        </div>
        <dl class="space-y-1.5 text-sm border-t py-1.5">
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">평가금액</dt>
            <dd class="font-medium">{{ fmtKRW(summary.evalKRW) }}</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">평가손익</dt>
            <dd class="font-medium" :class="pnlColor(summary.unrealizedKRW)">
              {{ fmtPnl(summary.unrealizedKRW, "KRW") }}
            </dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">실현손익</dt>
            <dd class="font-medium" :class="pnlColor(summary.realizedKRW)">
              {{ fmtPnl(summary.realizedKRW, "KRW") }}
            </dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">매수금액</dt>
            <dd class="font-medium">{{ fmtKRW(summary.costKRW) }}</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">수익률</dt>
            <dd class="font-semibold" :class="pnlColor(summary.returnRateKRW)">
              {{ fmtPnlRate(summary.returnRateKRW) }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- 해외 USD -->
      <div class="rounded-lg border bg-card shadow-sm p-4 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span
              class="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >USD</span
            >
            <span class="text-[10px] text-muted-foreground">해외</span>
          </div>
          <span v-if="usdKrw" class="text-[10px] text-muted-foreground">
            ₩{{ Math.round(usdKrw).toLocaleString("ko-KR") }}
          </span>
        </div>
        <dl class="space-y-1.5 text-sm border-t py-1.5">
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">평가금액</dt>
            <dd class="font-medium">{{ fmtUSD(summary.evalUSD) }}</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">평가손익</dt>
            <dd class="font-medium" :class="pnlColor(summary.unrealizedUSD)">
              {{ fmtPnl(summary.unrealizedUSD, "USD") }}
            </dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">실현손익</dt>
            <dd class="font-medium" :class="pnlColor(summary.realizedUSD)">
              {{ fmtPnl(summary.realizedUSD, "USD") }}
            </dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">매수금액</dt>
            <dd class="font-medium">{{ fmtUSD(summary.costUSD) }}</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-xs text-muted-foreground">수익률</dt>
            <dd class="font-semibold" :class="pnlColor(summary.returnRateUSD)">
              {{ fmtPnlRate(summary.returnRateUSD) }}
            </dd>
          </div>
        </dl>
      </div>
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

const { usdKrw, rateMissingReason } = useExchangeRate();

// KRW + USD 환산 합산 가능 여부
const canCombine = computed(
  () => summary.value.hasKRW && summary.value.hasUSD && !!usdKrw.value,
);

// KRW·USD가 모두 있는데 환율이 없는 경우. 원화 금액만 보여 주면 USD가 빠진 값이
// 합계처럼 보이므로 합산 카드는 "계산 불가"로 두고 아래 통화별 카드를 보게 한다.
const rateMissing = computed(
  () => summary.value.hasKRW && summary.value.hasUSD && !usdKrw.value,
);
const RATE_MISSING_DISP = { value: "계산 불가", trend: "neutral" as const };

const rateMissingSub = computed(() =>
  rateMissing.value ? (rateMissingReason.value ?? undefined) : undefined,
);

const combinedSubValue = computed(() => {
  if (canCombine.value) return "USD 환산 포함";
  if (rateMissing.value) return `${rateMissingReason.value} · 아래 통화별 금액 참고`;
  return undefined;
});

function combined(krw: number, usd: number): number {
  return krw + usd * usdKrw.value!;
}

// 합산 평가금액
const evalDisp = computed(() => {
  const s = summary.value;
  if (!s.hasKRW && !s.hasUSD) return { value: "—" };
  if (canCombine.value)
    return { value: fmtKRW(combined(s.evalKRW, s.evalUSD)) };
  if (s.hasKRW && !s.hasUSD) return { value: fmtKRW(s.evalKRW) };
  if (!s.hasKRW && s.hasUSD) return { value: fmtUSD(s.evalUSD) };
  return RATE_MISSING_DISP;
});

// 합산 평가손익
const unrealizedDisp = computed(() => {
  const s = summary.value;
  if (!s.hasKRW && !s.hasUSD) return { value: "—", trend: "neutral" as const };
  if (canCombine.value) {
    const val = combined(s.unrealizedKRW, s.unrealizedUSD);
    return { value: fmtPnl(val, "KRW"), trend: pnlTrend(val) };
  }
  if (s.hasKRW && !s.hasUSD)
    return {
      value: fmtPnl(s.unrealizedKRW, "KRW"),
      trend: pnlTrend(s.unrealizedKRW),
    };
  if (!s.hasKRW && s.hasUSD)
    return {
      value: fmtPnl(s.unrealizedUSD, "USD"),
      trend: pnlTrend(s.unrealizedUSD),
    };
  return RATE_MISSING_DISP;
});

// 합산 실현손익
const realizedDisp = computed(() => {
  const s = summary.value;
  if (!s.hasKRW && !s.hasUSD) return { value: "—", trend: "neutral" as const };
  if (canCombine.value) {
    const val = combined(s.realizedKRW, s.realizedUSD);
    return { value: fmtPnl(val, "KRW"), trend: pnlTrend(val) };
  }
  if (s.hasKRW && !s.hasUSD)
    return {
      value: fmtPnl(s.realizedKRW, "KRW"),
      trend: pnlTrend(s.realizedKRW),
    };
  if (!s.hasKRW && s.hasUSD)
    return {
      value: fmtPnl(s.realizedUSD, "USD"),
      trend: pnlTrend(s.realizedUSD),
    };
  return RATE_MISSING_DISP;
});

// 합산 매수금액
const costDisp = computed(() => {
  const s = summary.value;
  if (!s.hasKRW && !s.hasUSD) return { value: "—" };
  if (canCombine.value)
    return { value: fmtKRW(combined(s.costKRW, s.costUSD)) };
  if (s.hasKRW && !s.hasUSD) return { value: fmtKRW(s.costKRW) };
  if (!s.hasKRW && s.hasUSD) return { value: fmtUSD(s.costUSD) };
  return RATE_MISSING_DISP;
});

// 합산 수익률 (미실현 / 총매수금액)
const returnDisp = computed(() => {
  const s = summary.value;
  if (!s.hasKRW && !s.hasUSD) return { value: "—", trend: "neutral" as const };
  if (canCombine.value) {
    const cost = combined(s.costKRW, s.costUSD);
    const unrealized = combined(s.unrealizedKRW, s.unrealizedUSD);
    const rate = cost > 0 ? (unrealized / cost) * 100 : 0;
    return { value: fmtPnlRate(rate), trend: pnlTrend(rate) };
  }
  if (s.hasKRW && !s.hasUSD)
    return {
      value: fmtPnlRate(s.returnRateKRW),
      trend: pnlTrend(s.returnRateKRW),
    };
  if (!s.hasKRW && s.hasUSD)
    return {
      value: fmtPnlRate(s.returnRateUSD),
      trend: pnlTrend(s.returnRateUSD),
    };
  return RATE_MISSING_DISP;
});
</script>
