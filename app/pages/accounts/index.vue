<template>
  <div class="space-y-6">
    <!-- 헤더 -->
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

    <!-- 로딩 -->
    <div v-if="accountsStore.loading" class="flex justify-center py-16">
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
      @added="onAdded"
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
          <button
            class="flex-1 rounded-md border border-input bg-background py-2 text-sm font-medium transition-colors hover:bg-accent"
            @click="deleteDialogOpen = false"
          >
            취소
          </button>
          <button
            :disabled="accountsStore.loading"
            class="flex-1 rounded-md bg-destructive py-2 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            @click="handleDelete"
          >
            {{ accountsStore.loading ? "삭제 중..." : "삭제" }}
          </button>
        </div>
      </div>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
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

const accountsStore = useAccountsStore();
const tradesStore = useTradesStore();

onMounted(() => {
  accountsStore.fetchAll();
  tradesStore.fetchAll();
});

type AccountSummary = {
  holdingCount: number;
  krw: { totalEval: number; pnl: number; pnlRate: number } | null;
  usd: { totalEval: number; pnl: number; pnlRate: number } | null;
};

const accountSummaryById = computed(() => {
  const result = new Map<string, AccountSummary>();

  const byAccount = new Map<string, typeof tradesStore.items>();
  for (const trade of tradesStore.items) {
    if (!byAccount.has(trade.accountId)) byAccount.set(trade.accountId, []);
    byAccount.get(trade.accountId)!.push(trade);
  }

  for (const [accountId, trades] of byAccount) {
    const positions = buildFifoPositions(trades);
    let holdingCount = 0;
    let krwCost = 0, krwEval = 0, usdCost = 0, usdEval = 0;

    for (const pos of positions.values()) {
      const qty = lotsQty(pos.lots);
      if (qty <= 0) continue;
      holdingCount++;
      const cost = lotsCost(pos.lots);
      const evalAmt = getDummyPrice(pos.stockCode, cost / qty) * qty;
      if (pos.currency === "KRW") { krwCost += cost; krwEval += evalAmt; }
      else { usdCost += cost; usdEval += evalAmt; }
    }

    const krwPnl = calcPnl(krwEval, krwCost);
    const usdPnl = calcPnl(usdEval, usdCost);

    result.set(accountId, {
      holdingCount,
      krw: krwCost > 0 ? { totalEval: krwEval, pnl: krwPnl, pnlRate: calcPnlRate(krwPnl, krwCost) } : null,
      usd: usdCost > 0 ? { totalEval: usdEval, pnl: usdPnl, pnlRate: calcPnlRate(usdPnl, usdCost) } : null,
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

function currencyClass(currency: string) {
  if (currency === "KRW") return "border-blue-200 bg-blue-50 text-blue-700";
  if (currency === "USD") return "border-green-200 bg-green-50 text-green-700";
  return "border-purple-200 bg-purple-50 text-purple-700";
}

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

function onAdded(_id: string) {
  // store.add() 가 items를 이미 업데이트함
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
