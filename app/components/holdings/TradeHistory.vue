<template>
  <div class="space-y-5">
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
              class="px-2 pt-3 pb-2 font-medium text-left text-muted-foreground"
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
          <template v-if="displayRows.length">
            <tr
              v-for="(row, i) in displayRows"
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
                {{ fmtCurrency(row.price, currency) }}
              </td>
              <td class="px-5 py-2.5 align-center text-right">
                {{ fmtCurrency(row.total, currency) }}
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
              </td>
              <td
                v-if="showActions"
                class="px-5 py-2.5 align-center text-right whitespace-nowrap"
              >
                <template v-if="deletingId === row.id">
                  <button
                    class="mr-1 rounded px-1.5 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    @click="confirmDelete(row.id!)"
                  >
                    삭제
                  </button>
                  <button
                    class="rounded px-1.5 py-0.5 text-xs font-medium border border-input bg-background hover:bg-accent"
                    @click="deletingId = null"
                  >
                    취소
                  </button>
                </template>
                <template v-else>
                  <button
                    class="mr-0.5 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    @click="emit('edit-trade', row.id!)"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button
                    class="p-1 rounded text-muted-foreground hover:bg-accent hover:text-destructive"
                    @click="deletingId = row.id ?? null"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </template>
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

    <!-- 페이지네이션 -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-center gap-0.5 py-3 px-5"
    >
      <button
        class="flex h-6 min-w-[2.5rem] items-center justify-center rounded px-4 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        이전
      </button>
      <button
        v-for="n in pageNumbers"
        :key="n"
        class="flex items-center justify-center w-6 h-6 transition-colors rounded"
        :class="
          n === currentPage
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'text-muted-foreground hover:bg-accent'
        "
        @click="currentPage = n"
      >
        {{ n }}
      </button>
      <button
        class="flex h-6 min-w-[2.5rem] items-center justify-center rounded px-4 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil, Trash2 } from "@lucide/vue";

interface TradeRow {
  id?: string;
  date: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  memo?: string;
  avgHoldingDays?: number;
  holdingRange?: string;
  pnlRate?: number;
  realizedPnl?: number;
}

const PAGE_SIZE = 5;

const props = defineProps<{
  stockCode: string;
  currency: "KRW" | "USD";
  showActions?: boolean;
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

const rows = computed<TradeRow[]>(() => {
  const raw = tradesStore.items
    .filter((t) => t.stockCode === props.stockCode)
    .sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));

  const buyQueue: Array<{ date: string; remainingQty: number; price: number }> =
    [];
  const result: TradeRow[] = [];

  for (const trade of raw) {
    if (trade.type === "BUY") {
      buyQueue.push({
        date: trade.tradeDate,
        remainingQty: trade.quantity,
        price: trade.price,
      });
      result.push({
        id: trade.id,
        date: trade.tradeDate,
        type: "BUY",
        quantity: trade.quantity,
        price: trade.price,
        total: trade.price * trade.quantity,
        memo: trade.memo,
      });
    } else {
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

      let avgHoldingDays: number | undefined;
      let holdingRange: string | undefined;
      let pnlRate: number | undefined;
      let realizedPnl: number | undefined;

      if (matchedLots.length > 0) {
        const totalQty = matchedLots.reduce((s, l) => s + l.qty, 0);
        const avgBuyPrice =
          matchedLots.reduce((s, l) => s + l.qty * l.price, 0) / totalQty;

        // FIFO 매칭 lot별 단순평균 보유일수
        avgHoldingDays = Math.round(
          matchedLots.reduce(
            (s, l) => s + daysBetween(l.date, trade.tradeDate),
            0,
          ) / matchedLots.length,
        );
        holdingRange = `${fmtYYMMDD(matchedLots[0]!.date)}~${fmtYYMMDD(trade.tradeDate)}`;

        realizedPnl = calcRealizedPnl(trade.price, avgBuyPrice, totalQty);
        pnlRate = calcRealizedPnlRate(realizedPnl, avgBuyPrice, totalQty);
      }

      result.push({
        id: trade.id,
        date: trade.tradeDate,
        type: "SELL",
        quantity: trade.quantity,
        price: trade.price,
        total: trade.price * trade.quantity,
        memo: trade.memo,
        avgHoldingDays,
        holdingRange,
        pnlRate,
        realizedPnl,
      });
    }
  }

  return result.reverse();
});

const currentPage = ref(1);

watch(
  () => props.stockCode,
  () => {
    currentPage.value = 1;
  },
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(rows.value.length / PAGE_SIZE)),
);

const displayRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return rows.value.slice(start, start + PAGE_SIZE);
});

const groupStart = computed(() => {
  if (totalPages.value <= 5) return 1;
  return Math.max(1, Math.min(currentPage.value - 2, totalPages.value - 4));
});

const groupEnd = computed(() =>
  Math.min(totalPages.value, groupStart.value + 4),
);

const pageNumbers = computed(() =>
  Array.from(
    { length: groupEnd.value - groupStart.value + 1 },
    (_, i) => groupStart.value + i,
  ),
);
</script>
