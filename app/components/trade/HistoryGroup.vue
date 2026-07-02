<template>
  <div>
    <div v-if="showDateHeader && date" class="mb-2 flex items-center gap-1.5">
      <span class="text-sm font-semibold">{{ formattedDate }}</span>
      <span class="text-xs font-medium text-muted-foreground">({{ dayOfWeek }})</span>
    </div>
    <div :class="card ? 'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm' : ''">
      <div v-if="trades.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <!-- 날짜 컬럼 (종목별 그룹 뷰) -->
              <th v-if="showDate" :class="['pb-2 text-left text-xs font-medium text-muted-foreground', card ? 'px-4 pt-3' : '']">날짜</th>
              <!-- 유형 컬럼 -->
              <th :class="['pb-2 text-left text-xs font-medium text-muted-foreground', card ? 'px-4 pt-3' : '']">유형</th>
              <!-- 종목 컬럼 (날짜별 그룹 뷰) -->
              <th v-if="showStock" :class="['pb-2 text-left text-xs font-medium text-muted-foreground', card ? 'px-4 pt-3' : '']">종목</th>
              <!-- 계좌 컬럼 -->
              <th
                v-if="showAccount"
                :class="['hidden pb-2 text-left text-xs font-medium text-muted-foreground sm:table-cell', card ? 'px-4 pt-3' : '']"
              >계좌</th>
              <th :class="['pb-2 text-right text-xs font-medium text-muted-foreground', card ? 'px-4 pt-3' : '']">수량</th>
              <th :class="['pb-2 text-right text-xs font-medium text-muted-foreground', card ? 'px-4 pt-3' : '']">단가</th>
              <th :class="['pb-2 text-right text-xs font-medium text-muted-foreground', card ? 'px-4 pt-3' : '']">거래금액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(trade, i) in trades" :key="i" class="border-b last:border-0">
              <!-- 날짜 셀 -->
              <td v-if="showDate" :class="['py-2.5 align-top', card ? 'px-4' : '']">
                <div class="whitespace-nowrap font-medium">{{ formatTradeDate(trade.date) }}</div>
              </td>
              <!-- 유형 + 이유 셀 -->
              <td :class="['py-2.5 align-top', card ? 'px-4' : '']">
                <span
                  class="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold"
                  :class="trade.type === 'BUY'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
                >
                  {{ trade.type === 'BUY' ? '매수' : '매도' }}
                </span>
                <div v-if="trade.reason" class="mt-0.5 max-w-[10rem] truncate text-xs text-muted-foreground">
                  {{ trade.reason }}
                </div>
              </td>
              <!-- 종목 셀 -->
              <td v-if="showStock" :class="['py-2.5 align-top', card ? 'px-4' : '']">
                <div class="font-medium">{{ trade.stockName }}</div>
                <div class="text-xs text-muted-foreground">{{ trade.stockCode }}</div>
              </td>
              <!-- 계좌 셀 -->
              <td
                v-if="showAccount"
                :class="['hidden py-2.5 align-top text-sm text-muted-foreground sm:table-cell', card ? 'px-4' : '']"
              >
                {{ trade.accountName ?? '—' }}
              </td>
              <td :class="['py-2.5 text-right align-top', card ? 'px-4' : '']">{{ trade.quantity }}</td>
              <td :class="['py-2.5 text-right align-top', card ? 'px-4' : '']">{{ trade.price }}</td>
              <td :class="['py-2.5 text-right font-medium align-top', card ? 'px-4' : '']">{{ trade.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else :class="['flex flex-col items-center gap-3 text-center', card ? 'py-8' : 'py-6']">
        <div class="rounded-full bg-muted p-3">
          <FileX class="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p class="text-sm font-medium">거래 내역이 없습니다</p>
          <p class="mt-0.5 text-xs text-muted-foreground">이 날짜에 등록된 매매 이력이 없어요.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileX } from '@lucide/vue'

export interface TradeItem {
  type: 'BUY' | 'SELL'
  stockName: string
  stockCode: string
  quantity: string
  price: string
  total: string
  accountName?: string
  reason?: string
  date?: string
  pnl?: number
}

interface Props {
  trades: TradeItem[]
  date?: string
  showDateHeader?: boolean
  showAccount?: boolean
  showDate?: boolean
  showStock?: boolean
  card?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDateHeader: false,
  showAccount: false,
  showDate: false,
  showStock: true,
  card: true,
})

const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

const formattedDate = computed(() => {
  if (!props.date) return ''
  const [y, m, d] = props.date.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
})

const dayOfWeek = computed(() => {
  if (!props.date) return ''
  const [y, m, d] = props.date.split('-').map(Number)
  return DAYS[new Date(y, m - 1, d).getDay()]
})

function formatTradeDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = DAYS[new Date(y, m - 1, d).getDay()]
  return `${m}/${String(d).padStart(2, '0')} (${dow})`
}
</script>
