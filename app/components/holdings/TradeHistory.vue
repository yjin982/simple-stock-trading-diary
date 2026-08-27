<template>
  <div>
    <template
      v-for="(group, groupIdx) in displayedAccountGroups"
      :key="group.accountId"
    >
      <!-- 계좌 헤더 (복수 계좌일 때만) -->
      <div
        v-if="accountGroups.length > 1"
        class="flex items-center gap-2 px-5 py-2 border-b bg-muted/30"
      >
        <span class="text-xs font-medium text-muted-foreground">
          {{ group.accountName ?? group.accountId }}
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full table-fixed min-w-[768px] text-sm">
          <thead>
            <tr class="border-b">
              <th
                class="w-20 px-5 pt-3 pb-2 font-medium text-left text-muted-foreground"
              >
                날짜
              </th>
              <th
                class="w-16 px-3.5 pt-3 pb-2 font-medium text-center text-muted-foreground"
              >
                유형
              </th>
              <th
                class="w-40 px-2 pt-3 pb-2 font-medium text-left text-muted-foreground"
              >
                메모
              </th>
              <th
                class="w-16 px-2 pt-3 pb-2 font-medium text-right w-18 text-muted-foreground"
              >
                수량
              </th>
              <th
                class="px-5 pt-3 pb-2 font-medium text-right w-28 text-muted-foreground"
              >
                단가
              </th>
              <th
                class="px-5 pt-3 pb-2 font-medium text-right w-28 text-muted-foreground"
              >
                금액
              </th>
              <th
                class="w-32 px-5 pt-3 pb-2 font-medium text-right text-muted-foreground"
              >
                평균보유일수
              </th>
              <th
                class="w-24 px-5 pt-3 pb-2 font-medium text-right text-muted-foreground"
              >
                수익률
              </th>
              <th
                class="w-32 px-5 pt-3 pb-2 font-medium text-right text-muted-foreground"
              >
                실현손익
              </th>
              <th
                v-if="showActions"
                class="w-20 px-5 pt-3 pb-2 font-medium text-right text-muted-foreground"
              />
            </tr>
          </thead>
          <tbody>
            <template v-if="group.displayRows.length">
              <tr
                v-for="(row, i) in group.displayRows"
                :key="i"
                class="border-b last:border-0"
              >
                <td class="px-5 py-2.5 align-center whitespace-nowrap">
                  {{ fmtYYMMDD(row.date) }}
                </td>
                <td class="px-2 py-2.5 align-center justify-center text-center">
                  <span
                    class="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold"
                    :class="
                      row.type === 'BUY'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    "
                  >
                    {{ row.type === "BUY" ? "매수" : "매도" }}
                  </span>
                  <span
                    v-if="row.oversold"
                    class="ml-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                    title="보유수량을 초과하는 매도로 실현손익이 정확하지 않을 수 있습니다."
                  >
                    잔고초과
                  </span>
                </td>
                <td class="px-2 py-2.5 align-center">
                  <div v-if="row.memo" class="relative group">
                    <div class="text-xs text-muted-foreground">
                      {{ row.memo }}
                    </div>
                  </div>
                  <span v-else class="text-muted-foreground">—</span>
                </td>
                <td class="px-2 py-2.5 align-center text-right">
                  {{ row.quantity.toLocaleString() }}
                </td>
                <td class="px-5 py-2.5 align-center text-right">
                  <div>{{ fmtCurrency(row.price, currency) }}</div>
                  <div v-if="krwEquiv(row.price)" class="text-xs text-muted-foreground">{{ krwEquiv(row.price) }}</div>
                </td>
                <td class="px-5 py-2.5 align-center text-right">
                  <div>{{ fmtCurrency(row.total, currency) }}</div>
                  <div v-if="krwEquiv(row.total)" class="text-xs text-muted-foreground">{{ krwEquiv(row.total) }}</div>
                </td>
                <td
                  class="px-5 py-2.5 align-center text-right text-muted-foreground whitespace-nowrap"
                >
                  <template v-if="row.avgHoldingDays != null">
                    <div class="relative inline-block group">
                      <span class="underline cursor-default decoration-dotted"
                        >{{ row.avgHoldingDays }}일</span
                      >
                      <div
                        class="absolute right-0 bottom-full mb-1 hidden group-hover:block z-50 whitespace-nowrap rounded bg-slate-900/50 px-2 py-1 text-[10px] font-medium text-slate-50 shadow-md dark:bg-slate-100/50 dark:text-slate-900"
                      >
                        {{ row.holdingRange }}
                      </div>
                    </div>
                  </template>
                  <span v-else>—</span>
                </td>
                <td
                  class="px-5 py-2.5 align-center text-right"
                  :class="
                    row.pnlRate != null
                      ? pnlColor(row.pnlRate)
                      : 'text-muted-foreground'
                  "
                >
                  {{ row.pnlRate != null ? fmtPnlRate(row.pnlRate) : "—" }}
                </td>
                <td
                  class="px-5 py-2.5 align-center text-right font-medium"
                  :class="
                    row.realizedPnl != null
                      ? pnlColor(row.realizedPnl)
                      : 'text-muted-foreground'
                  "
                >
                  {{
                    row.realizedPnl != null
                      ? fmtPnl(row.realizedPnl, currency)
                      : "—"
                  }}
                  <div v-if="row.realizedPnl != null && krwEquiv(row.realizedPnl)" class="text-xs text-muted-foreground">
                    {{ krwEquiv(row.realizedPnl) }}
                  </div>
                </td>
                <td
                  v-if="showActions"
                  class="px-5 py-2.5 align-center text-right whitespace-nowrap"
                >
                  <UiRowActions
                    :confirming="deletingId === row.id"
                    @edit="emit('edit-trade', row.id!)"
                    @request-delete="deletingId = row.id ?? null"
                    @confirm-delete="confirmDelete(row.id!)"
                    @cancel-delete="deletingId = null"
                  />
                </td>
              </tr>
            </template>
            <tr v-else>
              <td
                :colspan="showActions ? 10 : 9"
                class="py-3 text-center text-muted-foreground"
              >
                거래 내역이 없습니다
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 계좌별 페이지네이션 -->
      <div
        v-if="getTotalPages(group.rows.length) > 1"
        class="flex items-center justify-center gap-0.5 py-3 px-5"
        :class="{
          'border-b':
            displayedAccountGroups.length > 1 &&
            groupIdx !== displayedAccountGroups.length - 1,
        }"
      >
        <button
          class="flex h-6 min-w-[2.5rem] items-center justify-center rounded px-4 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
          :disabled="getCurrentPage(group.accountId) === 1"
          @click="
            setCurrentPage(group.accountId, getCurrentPage(group.accountId) - 1)
          "
        >
          이전
        </button>
        <button
          v-for="n in getPageNumbers(group.rows.length, group.accountId)"
          :key="n"
          class="flex items-center justify-center w-6 h-6 transition-colors rounded"
          :class="
            n === getCurrentPage(group.accountId)
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'text-muted-foreground hover:bg-accent'
          "
          @click="setCurrentPage(group.accountId, n)"
        >
          {{ n }}
        </button>
        <button
          class="flex h-6 min-w-[2.5rem] items-center justify-center rounded px-4 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
          :disabled="
            getCurrentPage(group.accountId) === getTotalPages(group.rows.length)
          "
          @click="
            setCurrentPage(group.accountId, getCurrentPage(group.accountId) + 1)
          "
        >
          다음
        </button>
      </div>

      <!-- 계좌 사이 구분선 (마지막 제외, 페이지네이션 없을 때) -->
      <div
        v-if="
          displayedAccountGroups.length > 1 &&
          getTotalPages(group.rows.length) <= 1 &&
          groupIdx !== displayedAccountGroups.length - 1
        "
        class="border-b"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Trade, TradeRow } from "~/types";

type AccountGroup = {
  accountId: string;
  accountName?: string;
  rows: TradeRow[];
};

const props = defineProps<{
  stockCode: string;
  market: "KR" | "US";
  currency: "KRW" | "USD";
  showActions?: boolean;
  accountId?: string;
}>();

const emit = defineEmits<{
  "edit-trade": [id: string];
  "delete-trade": [id: string];
}>();

const deletingId = ref<string | null>(null);

function confirmDelete(id: string) {
  emit("delete-trade", id);
  deletingId.value = null;
}

const tradesStore = useTradesStore();

const { krwEquiv: baseKrwEquiv } = useExchangeRate()
const isUSD = computed(() => props.currency === 'USD')
const krwEquiv = (usd: number) => isUSD.value ? baseKrwEquiv(usd) : null

const accountGroups = computed<AccountGroup[]>(() => {
  const byAccount = new Map<
    string,
    { accountId: string; accountName?: string; rawTrades: Trade[] }
  >();

  const sorted = sortTradesAsc(
    tradesStore.items.filter(
      (t) =>
        t.stockCode === props.stockCode &&
        t.market === props.market &&
        (!props.accountId || t.accountId === props.accountId),
    ),
  );

  for (const trade of sorted) {
    if (!byAccount.has(trade.accountId)) {
      byAccount.set(trade.accountId, {
        accountId: trade.accountId,
        accountName: trade.accountName,
        rawTrades: [],
      });
    }
    byAccount.get(trade.accountId)!.rawTrades.push(trade);
  }

  return [...byAccount.values()].map(
    ({ accountId, accountName, rawTrades }) => ({
      accountId,
      accountName,
      rows: buildTradeRows(rawTrades),
    }),
  );
});

const {
  resetAll,
  getCurrentPage,
  setCurrentPage,
  getTotalPages,
  getDisplayItems,
  getPageNumbers,
} = useAccountPagination();

// group.rows를 v-if/v-for에서 각각 다시 slice하지 않도록 페이지네이션 결과를 미리 계산해둔다.
const displayedAccountGroups = computed(() =>
  accountGroups.value.map((group) => ({
    ...group,
    displayRows: getDisplayItems(group.rows, group.accountId),
  })),
);

watch(
  () => props.stockCode,
  () => resetAll(),
);
</script>
