<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/holdings"
          class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft class="w-4 h-4" />
        </NuxtLink>
        <div class="flex items-center gap-2">
          <span
            v-if="holdings.length > 0"
            class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
            :class="marketBadgeClass(holdings[0]!.market)"
          >
            {{ holdings[0]!.market }}
          </span>
          <h1 class="text-base font-semibold">
            {{ holdings[0]?.stockName ?? stockCode }}
          </h1>
          <span class="text-xs text-muted-foreground">{{ stockCode }}</span>
        </div>
        <UiPriceDelayNotice :time="priceTime" />
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmptyState
      v-if="holdings.length === 0"
      :icon="Briefcase"
      title="보유 종목 없음"
      description="해당 종목의 보유 내역이 없습니다."
      card
    />

    <!-- ── 단일 계좌: 기존 구조 유지 ── -->
    <template v-else-if="holdings.length === 1">
      <HoldingsSummaryCards :data="holdings[0]!" />

      <HoldingsStockSettings
        :settings-form="settingsForm"
        :saving="settingsSaving"
        :saved="settingsSaved"
        :is-target-reached="isTargetReached"
        @save="saveSettings"
      />

      <!-- 매매 이력 -->
      <section class="border rounded-lg shadow-sm bg-card text-card-foreground">
        <div class="flex items-center gap-2 px-5 py-3 border-b">
          <span class="font-semibold">매매 이력</span>
        </div>
        <HoldingsTradeHistory
          :stock-code="stockCode"
          :currency="holdings[0]!.currency"
          show-actions
          @edit-trade="handleEditTrade"
          @delete-trade="handleDeleteTrade"
        />
      </section>
    </template>

    <!-- ── 다중 계좌 ── -->
    <template v-else>
      <!-- 전체 합산 요약 카드 -->
      <HoldingsSummaryCards :data="aggregated!" is-aggregate />

      <!-- 종목 설정 -->
      <HoldingsStockSettings
        :settings-form="settingsForm"
        :saving="settingsSaving"
        :saved="settingsSaved"
        :is-target-reached="isTargetReached"
        @save="saveSettings"
      />

      <!-- 계좌별 탭 -->
      <section class="border rounded-lg shadow-sm bg-card text-card-foreground">
        <!-- 탭 헤더 -->
        <div class="flex overflow-x-auto overflow-y-hidden border-b">
          <button
            v-for="h in holdings"
            :key="h.accountId"
            class="px-4 py-2 text-sm font-medium transition-colors shrink-0"
            :class="
              activeAccountId === h.accountId
                ? '-mb-px border-b-2 border-primary bg-card text-foreground'
                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            "
            @click="activeAccountId = h.accountId"
          >
            {{ getAccountInfo(h.accountId)?.alias ?? h.accountName }}
          </button>
        </div>

        <!-- 탭 내용 -->
        <template v-for="h in holdings" :key="h.accountId">
          <div v-if="activeAccountId === h.accountId" class="p-5 space-y-4">
            <!-- 계좌명 → 증권사 페이지 링크 -->
            <NuxtLink
              :to="`/accounts/${encodeURIComponent(getAccountInfo(h.accountId)?.brokerName ?? '')}`"
              class="inline-flex items-center gap-1 text-sm transition-colors text-muted-foreground hover:text-foreground"
            >
              {{ h.accountName }}
              <ExternalLink class="w-3 h-3" />
            </NuxtLink>

            <!-- 계좌별 요약 카드 (compact) -->
            <HoldingsSummaryCards :data="h" compact />

            <!-- 계좌별 매매 이력 -->
            <div class="overflow-hidden border rounded-lg">
              <HoldingsTradeHistory
                :stock-code="stockCode"
                :currency="h.currency"
                :account-id="h.accountId"
                show-actions
                @edit-trade="handleEditTrade"
                @delete-trade="handleDeleteTrade"
              />
            </div>
          </div>
        </template>
      </section>
    </template>

    <TradeFormModal
      v-model:open="modalOpen"
      :edit-trade="editingTrade ?? undefined"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

import { Briefcase, ChevronLeft, ExternalLink } from "@lucide/vue";
import type { Trade } from "~/types";

const route = useRoute();
const stockCode = route.params.stockCode as string;

const tradesStore = useTradesStore();
const accountsStore = useAccountsStore();
const stockSettingsStore = useStockSettingsStore();

onMounted(() => {
  tradesStore.fetchAll();
  accountsStore.fetchAll();
});

const { holdings: allHoldings, priceTime } = useHoldings(
  toRef(tradesStore, "items"),
);
const holdings = computed(() =>
  allHoldings.value.filter((h) => h.stockCode === stockCode),
);

function getAccountInfo(accountId: string) {
  return accountsStore.items.find((a) => a.id === accountId);
}

const aggregated = computed(() => {
  const hs = holdings.value;
  if (hs.length === 0) return null;
  const totalQty = hs.reduce((s, h) => s + h.quantity, 0);
  const totalCost = hs.reduce((s, h) => s + h.avgPrice * h.quantity, 0);
  const totalPnl = hs.reduce((s, h) => s + h.pnl, 0);
  return {
    currency: hs[0]!.currency,
    currentPrice: hs[0]!.currentPrice,
    quantity: totalQty,
    avgPrice: totalQty > 0 ? totalCost / totalQty : 0,
    pnl: totalPnl,
    pnlRate: totalCost > 0 ? (totalPnl / totalCost) * 100 : 0,
  };
});

const activeAccountId = ref("");
watch(
  holdings,
  (hs) => {
    if (hs.length > 0 && !hs.find((h) => h.accountId === activeAccountId.value)) {
      activeAccountId.value = hs[0]!.accountId;
    }
  },
  { immediate: true },
);

const settingsForm = reactive({ memo: "" as string, targetRate: "" as string });
const settingsSaving = ref(false);
const settingsSaved = ref(false);

const isTargetReached = computed(() => {
  if (!settingsForm.targetRate) return false;
  return holdings.value.some((h) => h.pnlRate >= Number(settingsForm.targetRate));
});

watch(
  holdings,
  async (hs) => {
    const h = hs[0];
    if (!h) return;
    const setting = await stockSettingsStore.fetchByCode(h.stockCode, h.market);
    if (setting) {
      settingsForm.memo = setting.memo ?? "";
      settingsForm.targetRate = setting.targetRate != null ? String(setting.targetRate) : "";
    }
  },
  { immediate: true },
);

async function saveSettings() {
  const h = holdings.value[0];
  if (!h) return;
  settingsSaving.value = true;
  settingsSaved.value = false;
  await stockSettingsStore.updateSettings(h.stockCode, h.market, {
    memo: settingsForm.memo || null,
    targetRate: settingsForm.targetRate ? Number(settingsForm.targetRate) : null,
  });
  settingsSaving.value = false;
  settingsSaved.value = true;
  setTimeout(() => { settingsSaved.value = false; }, 2000);
}

const modalOpen = ref(false);
const editingTrade = ref<Trade | null>(null);

watch(modalOpen, (open) => {
  if (!open) editingTrade.value = null;
});

function handleEditTrade(id: string) {
  editingTrade.value = tradesStore.items.find((t) => t.id === id) ?? null;
  if (editingTrade.value) modalOpen.value = true;
}

async function handleDeleteTrade(id: string) {
  await tradesStore.remove(id);
}
</script>
