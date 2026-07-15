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
            v-if="holding"
            class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
            :class="marketBadgeClass(holding.market)"
          >
            {{ holding.market }}
          </span>
          <h1 class="text-base font-semibold">
            {{ holding?.stockName ?? stockCode }}
          </h1>
          <span class="text-xs text-muted-foreground">{{ stockCode }}</span>
        </div>
        <UiPriceDelayNotice :time="priceTime" />
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmptyState
      v-if="!holding"
      :icon="Briefcase"
      title="보유 종목 없음"
      description="해당 종목의 보유 내역이 없습니다."
      card
    />

    <template v-else>
      <!-- 요약 카드 -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <UiCard
          title="보유수량"
          :value="`${holding.quantity.toLocaleString()}주`"
        />
        <UiCard
          title="평균단가"
          :value="fmtCurrency(holding.avgPrice, holding.currency)"
        />
        <UiCard
          title="현재가"
          :value="fmtCurrency(holding.currentPrice, holding.currency)"
        />
        <UiCard
          title="평가금액"
          :value="
            fmtCurrency(
              holding.currentPrice * holding.quantity,
              holding.currency,
            )
          "
        />
        <UiCard
          title="평가손익"
          :value="fmtPnl(holding.pnl, holding.currency)"
          :trend="pnlTrend(holding.pnl)"
        />
        <UiCard
          title="수익률"
          :value="fmtPnlRate(holding.pnlRate)"
          :trend="pnlTrend(holding.pnlRate)"
        />
      </div>

      <!-- 종목 설정 -->
      <section
        class="p-5 border rounded-lg shadow-sm bg-card text-card-foreground"
      >
        <h2 class="mb-4 text-sm font-semibold">종목 설정</h2>
        <div class="space-y-4">
          <!-- 목표 수익률 -->
          <div>
            <label
              class="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              목표 수익률
            </label>
            <div class="flex items-center gap-2.5">
              <div class="flex items-center gap-1.5">
                <input
                  v-model="settingsForm.targetRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="9999"
                  placeholder="예: 20.0"
                  class="px-3 text-sm border rounded-md shadow-sm h-9 w-28 border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <span class="text-sm text-muted-foreground">%</span>
              </div>
              <span
                v-if="isTargetReached"
                class="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
              >
                🎯 목표 달성!
              </span>
            </div>
          </div>

          <!-- 메모 -->
          <div>
            <label
              class="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              종목 메모
            </label>
            <textarea
              v-model="settingsForm.memo"
              rows="3"
              maxlength="500"
              placeholder="이 종목에 대한 메모를 입력하세요."
              class="w-full px-3 py-2 text-sm border rounded-md shadow-sm resize-none border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p class="mt-0.5 text-right text-[10px] text-muted-foreground">
              {{ (settingsForm.memo ?? "").length }}/500
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              :disabled="settingsSaving"
              @click="saveSettings"
            >
              {{ settingsSaving ? "저장 중..." : "저장" }}
            </button>
            <span v-if="settingsSaved" class="text-xs text-muted-foreground">
              저장되었습니다.
            </span>
          </div>
        </div>
      </section>

      <!-- 매매 이력 -->
      <section class="border rounded-lg shadow-sm bg-card text-card-foreground">
        <div class="flex items-center gap-2 px-5 py-3 border-b">
          <span class="font-semibold">매매 이력</span>
        </div>
        <HoldingsTradeHistory
          :stock-code="stockCode"
          :currency="holding.currency"
          show-actions
          @edit-trade="handleEditTrade"
          @delete-trade="handleDeleteTrade"
        />
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

import { Briefcase, ChevronLeft } from "@lucide/vue";
import type { Trade } from "~/types";

const route = useRoute();
const stockCode = route.params.stockCode as string;

const tradesStore = useTradesStore();
const stockSettingsStore = useStockSettingsStore();

onMounted(() => tradesStore.fetchAll());

const { holdings: allHoldings, priceTime } = useHoldings(
  toRef(tradesStore, "items"),
);
const holding = computed(() =>
  allHoldings.value.find((h) => h.stockCode === stockCode),
);

// --- 종목 설정 ---
const settingsForm = reactive({ memo: "" as string, targetRate: "" as string });
const settingsSaving = ref(false);
const settingsSaved = ref(false);

const isTargetReached = computed(() => {
  if (!holding.value || !settingsForm.targetRate) return false;
  return holding.value.pnlRate >= Number(settingsForm.targetRate);
});

watch(
  holding,
  async (h) => {
    if (!h) return;
    const setting = await stockSettingsStore.fetchByCode(h.stockCode, h.market);
    if (setting) {
      settingsForm.memo = setting.memo ?? "";
      settingsForm.targetRate =
        setting.targetRate != null ? String(setting.targetRate) : "";
    }
  },
  { immediate: true },
);

async function saveSettings() {
  if (!holding.value) return;
  settingsSaving.value = true;
  settingsSaved.value = false;
  await stockSettingsStore.updateSettings(
    holding.value.stockCode,
    holding.value.market,
    {
      memo: settingsForm.memo || null,
      targetRate: settingsForm.targetRate
        ? Number(settingsForm.targetRate)
        : null,
    },
  );
  settingsSaving.value = false;
  settingsSaved.value = true;
  setTimeout(() => {
    settingsSaved.value = false;
  }, 2000);
}

// --- 매매 이력 모달 ---
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
