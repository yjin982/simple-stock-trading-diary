<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold">계좌 관리</h1>
        <button
        class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        @click="openAddModal"
      >
        <Plus class="h-4 w-4" />
        계좌 추가
      </button>
      </div>
      <UiPriceDelayNotice :time="priceTime" />
    </div>

    <!-- 로딩: 계좌 add/update/remove 중에도 loading이 true가 되므로,
         이미 목록이 있는 상태에서 저장 작업을 할 때는 전체 목록을 스피너로
         가리지 않도록 최초 조회(목록이 비어 있을 때)에만 표시한다. -->
    <div
      v-if="accountsStore.loading && accountsStore.items.length === 0"
      class="flex justify-center py-16"
    >
      <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="accountsStore.items.length === 0"
      class="flex flex-col items-center gap-3 py-20 text-center"
    >
      <Wallet class="h-10 w-10 text-muted-foreground/40" />
      <p class="text-sm text-muted-foreground">등록된 계좌가 없습니다.</p>
      <button
        class="mt-1 rounded-md border border-input px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        @click="openAddModal"
      >
        첫 계좌 추가하기
      </button>
    </div>

    <!-- 계좌 목록 (증권사별 그룹) -->
    <template v-else>
      <section
        v-for="broker in brokersWithAccounts"
        :key="broker.name"
        class="rounded-lg border bg-card text-card-foreground shadow-sm"
      >
        <!-- 증권사 헤더 (클릭 → 상세) -->
        <NuxtLink
          :to="`/accounts/${encodeURIComponent(broker.name)}`"
          class="flex items-center gap-2 border-b px-5 py-3 transition-colors hover:bg-muted/30"
        >
          <Building2 class="h-4 w-4 text-muted-foreground" />
          <span class="font-semibold hover:underline">{{ broker.name }}</span>
          <span
            class="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {{ broker.accounts.length }}개
          </span>
          <ChevronRight class="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </NuxtLink>

        <!-- 계좌 목록 -->
        <ul class="divide-y">
          <li
            v-for="account in broker.accounts"
            :key="account.id"
            class="px-5 py-4"
          >
            <div class="flex flex-row items-center gap-3">
              <div class="basis-1/6 flex min-w-0 flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ account.alias }}</span>
                  <span
                    class="rounded border px-1.5 py-0.5 text-[11px] font-medium"
                    :class="currencyClass(account.currency)"
                  >
                    {{ account.currency }}
                  </span>
                </div>
                <span
                  v-if="account.accountNumber"
                  class="text-xs text-muted-foreground"
                >
                  {{ account.accountNumber }}
                </span>
                <span class="text-xs text-muted-foreground">
                  보유
                  {{
                    accountSummaryById.get(account.id)?.holdingCount ?? 0
                  }}종목
                </span>
              </div>

              <div class="basis-4/6 justify-start flex flex-col gap-1">
                <!-- 보유 요약 -->
                <template
                  v-for="s in [accountSummaryById.get(account.id)]"
                  :key="account.id + '-s'"
                >
                  <template v-if="s?.krw">
                    <span class="text-md font-semibold">
                      {{ fmtKRW(s.krw.totalEval) }}
                    </span>
                    <span class="text-xs" :class="pnlColor(s.krw.pnl)">
                      {{ fmtPnl(s.krw.pnl, "KRW") }} ({{
                        fmtPnlRate(s.krw.pnlRate)
                      }})
                    </span>
                  </template>
                  <template v-if="s?.usd">
                    <span class="text-md font-semibold">
                      {{ fmtUSD(s.usd.totalEval) }}
                    </span>
                    <span class="text-xs" :class="pnlColor(s.usd.pnl)">
                      {{ fmtPnl(s.usd.pnl, "USD") }} ({{
                        fmtPnlRate(s.usd.pnlRate)
                      }})
                    </span>
                  </template>
                </template>
              </div>

              <div class="basis-1/6 justify-end flex gap-1.5">
                <button
                  class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="수정"
                  @click="openEditModal(account)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
                <button
                  class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="삭제"
                  @click="confirmDelete(account)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <!-- 계좌 추가/수정 모달 -->
    <AccountAddModal
      v-model:open="modalOpen"
      :edit-account="editTarget ?? undefined"
    />

    <!-- 삭제 확인 다이얼로그 -->
    <UiDialog v-model:open="deleteDialogOpen" title="계좌 삭제">
      <div class="p-5 pb-6 space-y-4">
        <p class="text-sm text-muted-foreground">
          <span class="font-medium text-foreground">{{
            deleteTarget?.alias
          }}</span>
          계좌를 삭제하시겠습니까?<br />
          연결된 거래 내역이 있으면 삭제할 수 없습니다.
        </p>
        <p v-if="accountsStore.error" class="text-xs text-destructive">
          {{ accountsStore.error }}
        </p>
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="deleteDialogOpen = false">
            취소
          </UiButton>
          <UiButton
            variant="destructive"
            :disabled="accountsStore.loading"
            @click="handleDelete"
          >
            {{ accountsStore.loading ? "삭제 중..." : "삭제" }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import {
  Building2,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "@lucide/vue";
import type { Account } from "~/types";
import type { PositionHolding } from "~/utils/calc";

const accountsStore = useAccountsStore();
const tradesStore = useTradesStore();


type AccountSummary = {
  holdingCount: number;
  krw: { totalEval: number; pnl: number; pnlRate: number } | null;
  usd: { totalEval: number; pnl: number; pnlRate: number } | null;
};

const allPositions = computed(() => buildFifoPositions(tradesStore.items));

const yahooSymbols = computed(() =>
  [...allPositions.value.values()]
    .filter(pos => lotsQty(pos.lots) > 0)
    .map(pos => toYahooSymbol(pos.stockCode, pos.market, pos.exchange)),
);

const { priceMap, priceTime } = usePriceMap(yahooSymbols);

const accountSummaryById = computed(() => {
  const holdings = computeHoldingsFromPositions(allPositions.value.values(), priceMap.value);

  const byAccount = new Map<string, PositionHolding[]>();
  for (const h of holdings) {
    if (!byAccount.has(h.accountId)) byAccount.set(h.accountId, []);
    byAccount.get(h.accountId)!.push(h);
  }

  const result = new Map<string, AccountSummary>();
  for (const [accountId, accountHoldings] of byAccount) {
    const agg = aggregateByCurrency(accountHoldings);
    result.set(accountId, {
      holdingCount: accountHoldings.length,
      krw: agg.costKRW > 0 ? { totalEval: agg.evalKRW, pnl: agg.unrealizedKRW, pnlRate: agg.returnRateKRW } : null,
      usd: agg.costUSD > 0 ? { totalEval: agg.evalUSD, pnl: agg.unrealizedUSD, pnlRate: agg.returnRateUSD } : null,
    });
  }
  return result;
});

const brokersWithAccounts = computed(() => {
  const groups = new Map<string, typeof accountsStore.items>();
  for (const account of accountsStore.items) {
    const name = account.brokerName || "기타";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(account);
  }
  return Array.from(groups.entries()).map(([name, accounts]) => ({
    name,
    accounts,
  }));
});

// --- 추가/수정 모달 ---
const modalOpen = ref(false);
const editTarget = ref<Account | null>(null);

function openAddModal() {
  editTarget.value = null;
  modalOpen.value = true;
}

function openEditModal(account: Account) {
  editTarget.value = account;
  modalOpen.value = true;
}

// --- 삭제 ---
const deleteDialogOpen = ref(false);
const deleteTarget = ref<Account | null>(null);

function confirmDelete(account: Account) {
  deleteTarget.value = account;
  accountsStore.clearError();
  deleteDialogOpen.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  await accountsStore.remove(deleteTarget.value.id);
  if (!accountsStore.error) deleteDialogOpen.value = false;
}
</script>
