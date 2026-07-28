<template>
  <div>
    <div v-if="showDateHeader && date" class="mb-2 flex items-center gap-1.5">
      <span class="text-sm font-semibold">{{ formattedDate }}</span>
      <span class="text-xs font-medium text-muted-foreground"
        >({{ dayOfWeek }})</span
      >
    </div>
    <div
      :class="
        card
          ? 'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm'
          : ''
      "
    >
      <div v-if="trades.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm table-fixed min-w-[768px]">
          <thead>
            <tr class="border-b">
              <!-- 날짜 컬럼 (종목별 그룹 뷰) -->
              <th
                v-if="showDate"
                :class="[
                  'pb-2 text-left text-xs w-16 font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              >
                날짜
              </th>
              <!-- 유형 컬럼 -->
              <th
                :class="[
                  'pb-2 text-left text-xs font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              >
                유형
              </th>
              <!-- 종목 컬럼 (날짜별 그룹 뷰) -->
              <th
                v-if="showStock"
                :class="[
                  'pb-2 text-left text-xs font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              >
                종목
              </th>
              <!-- 계좌 컬럼 -->
              <th
                v-if="showAccount"
                :class="[
                  'pb-2 text-left text-xs font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              >
                계좌
              </th>
              <th
                :class="[
                  'pb-2 text-right text-xs w-16 font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              >
                수량
              </th>
              <th
                :class="[
                  'pb-2 text-right text-xs w-32 font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              >
                단가
              </th>
              <th
                :class="[
                  'pb-2 text-right text-xs w-32 font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              >
                거래금액
              </th>
              <th
                v-if="showActions"
                :class="[
                  'pb-2 text-right text-xs w-20 font-medium text-muted-foreground',
                  card ? 'px-4 pt-3' : '',
                ]"
              />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(trade, i) in trades"
              :key="i"
              class="border-b last:border-0"
            >
              <!-- 날짜 셀 -->
              <td
                v-if="showDate"
                :class="['py-2.5 align-top', card ? 'px-4' : '']"
              >
                <div class="font-medium whitespace-nowrap">
                  {{ formatTradeDate(trade.date) }}
                </div>
              </td>
              <!-- 유형 + 이유 셀 -->
              <td :class="['py-2.5 align-top', card ? 'px-4' : '']">
                <span
                  class="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold"
                  :class="
                    trade.type === 'BUY'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  "
                >
                  {{ trade.type === "BUY" ? "매수" : "매도" }}
                </span>
                <div
                  v-if="trade.memo"
                  class="relative group mt-0.5 max-w-[10rem]"
                >
                  <div class="text-xs truncate text-muted-foreground">
                    {{ trade.memo }}
                  </div>

                  <div
                    class="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50 max-w-xs whitespace-normal rounded bg-slate-900/50 px-2 py-1 text-[10px] font-medium text-slate-50 shadow-md dark:bg-slate-100/50 dark:text-slate-900"
                  >
                    {{ trade.memo }}
                  </div>
                </div>
              </td>
              <!-- 종목 셀 -->
              <td
                v-if="showStock"
                :class="['py-2.5 align-top', card ? 'px-4' : '']"
              >
                <NuxtLink :to="`/holdings/${trade.stockCode}`">
                  <div class="font-medium hover:underline">
                    {{ trade.stockName }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ trade.stockCode }}
                  </div>
                </NuxtLink>
              </td>
              <!-- 계좌 셀 -->
              <td
                v-if="showAccount"
                :class="[
                  'hidden py-2.5 align-top text-sm text-muted-foreground sm:table-cell',
                  card ? 'px-4' : '',
                ]"
              >
                <NuxtLink
                  v-if="trade.accountId"
                  :to="getBrokerUrl(trade.accountId)"
                  class="transition-colors hover:text-foreground hover:underline"
                >
                  {{ trade.accountName ?? "—" }}
                </NuxtLink>
                <span v-else>{{ trade.accountName ?? "—" }}</span>
              </td>
              <td :class="['py-2.5 text-right align-top', card ? 'px-4' : '']">
                {{ trade.quantity.toLocaleString() }}
              </td>
              <td :class="['py-2.5 text-right align-top', card ? 'px-4' : '']">
                {{ fmtCurrency(trade.price, trade.currency) }}
              </td>
              <td
                :class="[
                  'py-2.5 text-right font-medium align-top',
                  card ? 'px-4' : '',
                ]"
              >
                {{ fmtCurrency(trade.total, trade.currency) }}
              </td>
              <td
                v-if="showActions"
                :class="[
                  'py-2.5 text-right align-top whitespace-nowrap',
                  card ? 'px-4' : '',
                ]"
              >
                <template v-if="deletingId === trade.id">
                  <button
                    class="mr-1 rounded px-1.5 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    @click="confirmDelete(trade.id!)"
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
                    @click="emit('edit-trade', trade.id!)"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button
                    class="p-1 rounded text-muted-foreground hover:bg-accent hover:text-destructive"
                    @click="deletingId = trade.id ?? null"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <UiEmptyState
        v-else
        :icon="FileX"
        title="거래 내역이 없습니다"
        description="이 날짜에 등록된 매매 이력이 없어요."
        :py="card ? 'py-8' : 'py-6'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileX, Pencil, Trash2 } from "@lucide/vue";
import type { TradeItem } from "~/types";

interface Props {
  trades: TradeItem[];
  date?: string;
  showDateHeader?: boolean;
  showAccount?: boolean;
  showDate?: boolean;
  showStock?: boolean;
  showActions?: boolean;
  card?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDateHeader: false,
  showAccount: false,
  showDate: false,
  showStock: true,
  showActions: false,
  card: true,
});

const emit = defineEmits<{
  "edit-trade": [id: string];
  "delete-trade": [id: string];
}>();

const deletingId = ref<string | null>(null);

function confirmDelete(id: string) {
  emit("delete-trade", id);
  deletingId.value = null;
}

const accountsStore = useAccountsStore()

function getBrokerUrl(accountId: string): string {
  const account = accountsStore.items.find(a => a.id === accountId)
  return account?.brokerName
    ? `/accounts/${encodeURIComponent(account.brokerName)}`
    : '/accounts'
}

const formattedDate = computed(() =>
  props.date ? formatDateKo(props.date) : "",
);
const dayOfWeek = computed(() => (props.date ? getDayOfWeek(props.date) : ""));
</script>
