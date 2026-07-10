<template>
  <div class="space-y-3">
    <div class="overflow-x-auto">
      <table class="w-full table-fixed min-w-[768px] text-xs">
        <thead>
          <tr class="border-b border-muted-foreground/50">
            <th class="pb-2 text-left w-16 font-medium text-muted-foreground">
              날짜
            </th>
            <th class="pb-2 text-left font-medium text-muted-foreground">
              유형
            </th>
            <th class="pb-2 text-right w-16 font-medium text-muted-foreground">
              수량
            </th>
            <th class="pb-2 text-right w-28 font-medium text-muted-foreground">
              단가
            </th>
            <th class="pb-2 text-right w-28 font-medium text-muted-foreground">
              금액
            </th>
            <th class="pb-2 text-right w-32 font-medium text-muted-foreground">
              평균보유일수
            </th>
            <th class="pb-2 text-right w-32 font-medium text-muted-foreground">
              수익률
            </th>
            <th class="pb-2 text-right w-32 font-medium text-muted-foreground">
              실현손익
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="displayRows.length">
            <tr
              v-for="(row, i) in displayRows"
              :key="i"
              class="border-b border-muted/60 last:border-0"
            >
              <td class="py-2 pr-3 whitespace-nowrap">
                {{ fmtYYMMDD(row.date) }}
              </td>
              <td class="py-2 pr-3">
                <span
                  class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  :class="
                    row.type === 'BUY'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  "
                >
                  {{ row.type === "BUY" ? "매수" : "매도" }}
                </span>
                <div
                  v-if="row.memo"
                  class="mt-0.5 max-w-[15rem] truncate text-[10px] text-muted-foreground"
                >
                  {{ row.memo }}
                </div>
              </td>
              <td class="py-2 text-right">
                {{ row.quantity.toLocaleString() }}
              </td>
              <td class="py-2 text-right">
                {{ fmtCurrency(row.price, currency) }}
              </td>
              <td class="py-2 text-right">
                {{ fmtCurrency(row.total, currency) }}
              </td>
              <td
                class="py-2 text-right text-muted-foreground whitespace-nowrap"
              >
                <template v-if="row.avgHoldingDays != null">
                  <span>{{ row.avgHoldingDays }}일</span>
                  <div class="text-[10px] text-muted-foreground/70">
                    ({{ row.holdingRange }})
                  </div>
                </template>
                <span v-else>—</span>
              </td>
              <td
                class="py-2 text-right"
                :class="
                  row.pnlRate != null
                    ? pnlColor(row.pnlRate)
                    : 'text-muted-foreground'
                "
              >
                {{ row.pnlRate != null ? fmtPnlRate(row.pnlRate) : "—" }}
              </td>
              <td
                class="py-2 text-right font-medium"
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
            </tr>
          </template>
          <tr v-else>
            <td colspan="8" class="py-3 text-center text-muted-foreground">
              거래 내역이 없습니다
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-0.5">
      <button
        class="flex h-6 min-w-[2.5rem] items-center justify-center rounded px-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        이전
      </button>
      <button
        v-for="n in pageNumbers"
        :key="n"
        class="flex h-6 w-6 items-center justify-center rounded text-xs transition-colors"
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
        class="flex h-6 min-w-[2.5rem] items-center justify-center rounded px-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TradeRow {
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
}>();

const tradesStore = useTradesStore();

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.floor(
    (new Date(ty!, tm! - 1, td!).getTime() -
      new Date(fy!, fm! - 1, fd!).getTime()) /
      86400000,
  );
}

function fmtYYMMDD(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y!.slice(2)}/${m}/${d}`;
}

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

        realizedPnl = (trade.price - avgBuyPrice) * totalQty;
        pnlRate = (realizedPnl / (avgBuyPrice * totalQty)) * 100;
      }

      result.push({
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
