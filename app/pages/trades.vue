<template>
  <div class="space-y-4">
    <!-- 상단 바 -->
    <div class="flex items-center justify-between">
      <h1 class="text-base font-semibold">매매 내역</h1>
      <button
        class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        @click="openModal"
      >
        <Plus class="h-4 w-4" />
        매매이력 추가
      </button>
    </div>

    <!-- 필터 바 -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <!-- 기간 필터 + 직접 지정 날짜 입력 -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex rounded-md border bg-card p-0.5">
          <button
            v-for="p in PERIODS"
            :key="p.value"
            class="rounded px-3 py-1.5 text-sm font-medium transition-colors"
            :class="selectedPeriod === p.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'"
            @click="setPeriod(p.value)"
          >
            {{ p.label }}
          </button>
        </div>

        <template v-if="selectedPeriod === 'custom'">
          <input
            v-model="customStart"
            type="date"
            :max="customEnd || DUMMY_TODAY"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span class="text-sm text-muted-foreground">~</span>
          <input
            v-model="customEnd"
            type="date"
            :min="customStart"
            :max="DUMMY_TODAY"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </template>
      </div>

      <!-- 그룹 토글 -->
      <div class="flex rounded-md border bg-card p-0.5">
        <button
          class="rounded px-3 py-1.5 text-sm font-medium transition-colors"
          :class="groupBy === 'date' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="setGroupBy('date')"
        >
          날짜별
        </button>
        <button
          class="rounded px-3 py-1.5 text-sm font-medium transition-colors"
          :class="groupBy === 'stock' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="setGroupBy('stock')"
        >
          종목별
        </button>
        <button
          class="rounded px-3 py-1.5 text-sm font-medium transition-colors"
          :class="groupBy === 'type' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="setGroupBy('type')"
        >
          타입별
        </button>
      </div>
    </div>

    <!-- 기간 요약 카드 -->
    <section
      v-if="totalFilteredCount > 0"
      class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
    >
      <p class="mb-3 text-xs font-medium text-muted-foreground">기간 요약</p>
      <div class="grid grid-cols-3 divide-x">
        <!-- 매수금액 -->
        <div class="pr-4">
          <p class="text-xs text-muted-foreground">매수금액</p>
          <p v-if="periodSummary.buyKRW" class="mt-1 text-sm font-semibold">{{ fmtKRW(periodSummary.buyKRW) }}</p>
          <p v-if="periodSummary.buyUSD" class="text-xs text-muted-foreground">{{ fmtUSD(periodSummary.buyUSD) }}</p>
          <p v-if="!periodSummary.buyKRW && !periodSummary.buyUSD" class="mt-1 text-sm text-muted-foreground">—</p>
        </div>
        <!-- 매도금액 -->
        <div class="px-4">
          <p class="text-xs text-muted-foreground">매도금액</p>
          <p v-if="periodSummary.sellKRW" class="mt-1 text-sm font-semibold">{{ fmtKRW(periodSummary.sellKRW) }}</p>
          <p v-if="periodSummary.sellUSD" class="text-xs text-muted-foreground">{{ fmtUSD(periodSummary.sellUSD) }}</p>
          <p v-if="!periodSummary.sellKRW && !periodSummary.sellUSD" class="mt-1 text-sm text-muted-foreground">—</p>
        </div>
        <!-- 실현손익 -->
        <div class="pl-4">
          <p class="text-xs text-muted-foreground">실현손익</p>
          <template v-if="periodSummary.hasPnlKRW || periodSummary.hasPnlUSD">
            <p
              v-if="periodSummary.hasPnlKRW"
              class="mt-1 text-sm font-semibold"
              :class="periodSummary.pnlKRW >= 0 ? 'text-emerald-600' : 'text-red-500'"
            >
              {{ fmtPnl(periodSummary.pnlKRW, 'KRW') }}
            </p>
            <p
              v-if="periodSummary.hasPnlUSD"
              class="text-xs"
              :class="periodSummary.pnlUSD >= 0 ? 'text-emerald-600' : 'text-red-500'"
            >
              {{ fmtPnl(periodSummary.pnlUSD, 'USD') }}
            </p>
          </template>
          <p v-else class="mt-1 text-sm text-muted-foreground">—</p>
        </div>
      </div>
    </section>

    <!-- 매매 이력 목록 (날짜별) -->
    <div v-if="groupBy === 'date' && paginatedDateGroups.length > 0" class="space-y-4">
      <TradeHistoryGroup
        v-for="group in paginatedDateGroups"
        :key="group.date"
        :trades="group.trades"
        :date="group.date"
        show-date-header
        show-account
      />
    </div>

    <!-- 매매 이력 목록 (종목별) -->
    <div v-else-if="groupBy === 'stock' && paginatedStockGroups.length > 0" class="space-y-4">
      <div v-for="group in paginatedStockGroups" :key="group.stockCode">
        <div class="mb-2 flex items-center gap-2">
          <span class="text-sm font-semibold">{{ group.stockName }}</span>
          <span class="text-xs text-muted-foreground">{{ group.stockCode }}</span>
          <span class="ml-auto text-xs text-muted-foreground">{{ group.trades.length }}건</span>
        </div>
        <TradeHistoryGroup :trades="group.trades" show-account show-date :show-stock="false" />
      </div>
    </div>

    <!-- 매매 이력 목록 (타입별) -->
    <div v-else-if="groupBy === 'type' && paginatedTypeGroups.length > 0" class="space-y-4">
      <div v-for="group in paginatedTypeGroups" :key="group.type">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="inline-flex rounded px-2 py-0.5 text-sm font-semibold"
            :class="group.type === 'BUY'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
          >
            {{ group.type === 'BUY' ? '매수' : '매도' }}
          </span>
          <span class="text-xs text-muted-foreground">{{ group.trades.length }}건</span>
        </div>
        <TradeHistoryGroup :trades="group.trades" show-account show-date />
      </div>
    </div>

    <!-- 빈 상태 -->
    <div
      v-else-if="!isLoading"
      class="flex flex-col items-center gap-3 rounded-lg border bg-card py-16 text-center shadow-sm"
    >
      <div class="rounded-full bg-muted p-3">
        <ScrollText class="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p class="text-sm font-medium">매매 내역이 없습니다</p>
        <p class="mt-0.5 text-xs text-muted-foreground">선택한 기간에 등록된 매매 이력이 없어요.</p>
      </div>
    </div>

    <!-- 무한 스크롤 센티넬 -->
    <div ref="sentinelRef" class="flex items-center justify-center py-2">
      <div v-if="isLoading" class="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span>불러오는 중...</span>
      </div>
      <p v-else-if="!canLoadMore && paginatedCount > 0" class="text-xs text-muted-foreground">
        전체 {{ totalFilteredCount }}건의 이력을 모두 불러왔습니다
      </p>
    </div>

    <!-- 매매이력 입력 팝업 -->
    <TradeFormModal v-model:open="modalOpen" :default-date="modalDate" />
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { Loader2, Plus, ScrollText } from '@lucide/vue'
import type { TradeItem } from '~/types'
import { DUMMY_TODAY, dummyTradeData } from '~/lib/dummy-data'

const PAGE_SIZE = 30

const PERIODS = [
  { label: '전체', value: 'all' as const },
  { label: '1주일', value: '1w' as const },
  { label: '1개월', value: '1m' as const },
  { label: '3개월', value: '3m' as const },
  { label: '직접 지정', value: 'custom' as const },
]

// --- 상태 ---
type Period = 'all' | '1w' | '1m' | '3m' | 'custom'
type GroupBy = 'date' | 'stock' | 'type'

const selectedPeriod = ref<Period>('all')
const customStart = ref('')
const customEnd = ref('')
const groupBy = ref<GroupBy>('date')
const loadedCount = ref(PAGE_SIZE)
const isLoading = ref(false)

watch([selectedPeriod, customStart, customEnd, groupBy], () => {
  loadedCount.value = PAGE_SIZE
})

const startDate = computed(() => {
  if (selectedPeriod.value === 'custom') return customStart.value || '2000-01-01'
  if (selectedPeriod.value === '1w') return subtractDays(DUMMY_TODAY, 7)
  if (selectedPeriod.value === '1m') return subtractDays(DUMMY_TODAY, 30)
  if (selectedPeriod.value === '3m') return subtractDays(DUMMY_TODAY, 90)
  return '2000-01-01'
})

const endDate = computed(() => {
  if (selectedPeriod.value === 'custom') return customEnd.value || DUMMY_TODAY
  return DUMMY_TODAY
})

// --- 날짜별 그룹 ---
const allDateGroups = computed(() =>
  Object.entries(dummyTradeData)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, trades]) => ({ date, trades })),
)

const filteredDateGroups = computed(() => {
  const start = startDate.value
  const end = endDate.value
  return allDateGroups.value.filter(g => g.date >= start && g.date <= end)
})

const paginatedDateGroups = computed(() => paginateGroups(filteredDateGroups.value, loadedCount.value))

// --- 종목별 그룹 ---
type StockGroup = { stockName: string; stockCode: string; trades: (TradeItem & { date: string })[] }

const allStockGroups = computed((): StockGroup[] => {
  const map = new Map<string, StockGroup>()
  allDateGroups.value.forEach(({ date, trades }) => {
    trades.forEach(trade => {
      if (!map.has(trade.stockCode)) {
        map.set(trade.stockCode, { stockName: trade.stockName, stockCode: trade.stockCode, trades: [] })
      }
      map.get(trade.stockCode)!.trades.push({ ...trade, date })
    })
  })
  return [...map.values()].sort((a, b) => a.stockName.localeCompare(b.stockName, 'ko'))
})

const filteredStockGroups = computed((): StockGroup[] => {
  const start = startDate.value
  const end = endDate.value
  return allStockGroups.value
    .map(g => ({ ...g, trades: g.trades.filter(t => t.date >= start && t.date <= end) }))
    .filter(g => g.trades.length > 0)
})

const paginatedStockGroups = computed(() => paginateGroups(filteredStockGroups.value, loadedCount.value))

// --- 타입별 그룹 ---
type TypeGroup = { type: 'BUY' | 'SELL'; trades: (TradeItem & { date: string })[] }

const filteredTypeGroups = computed((): TypeGroup[] => {
  const start = startDate.value
  const end = endDate.value
  const buyTrades: (TradeItem & { date: string })[] = []
  const sellTrades: (TradeItem & { date: string })[] = []

  allDateGroups.value.forEach(({ date, trades }) => {
    if (date < start || date > end) return
    trades.forEach(trade => {
      const item = { ...trade, date }
      if (trade.type === 'BUY') buyTrades.push(item)
      else sellTrades.push(item)
    })
  })

  const result: TypeGroup[] = []
  if (buyTrades.length > 0) result.push({ type: 'BUY', trades: buyTrades })
  if (sellTrades.length > 0) result.push({ type: 'SELL', trades: sellTrades })
  return result
})

const paginatedTypeGroups = computed(() => paginateGroups(filteredTypeGroups.value, loadedCount.value))

// --- 기간 요약 ---
const periodSummary = computed(() => {
  const stats = {
    buyKRW: 0, buyUSD: 0,
    sellKRW: 0, sellUSD: 0,
    pnlKRW: 0, pnlUSD: 0,
    hasPnlKRW: false, hasPnlUSD: false,
  }

  filteredDateGroups.value.forEach(({ trades }) => {
    trades.forEach(trade => {
      if (trade.type === 'BUY') {
        if (trade.currency === 'KRW') stats.buyKRW += trade.total
        else stats.buyUSD += trade.total
      }
      else {
        if (trade.currency === 'KRW') stats.sellKRW += trade.total
        else stats.sellUSD += trade.total
        if (trade.pnl !== undefined) {
          if (trade.currency === 'KRW') { stats.pnlKRW += trade.pnl; stats.hasPnlKRW = true }
          else { stats.pnlUSD += trade.pnl; stats.hasPnlUSD = true }
        }
      }
    })
  })

  return stats
})

// --- 페이지네이션 ---
const totalFilteredCount = computed(() => {
  if (groupBy.value === 'date') return filteredDateGroups.value.reduce((s, g) => s + g.trades.length, 0)
  if (groupBy.value === 'stock') return filteredStockGroups.value.reduce((s, g) => s + g.trades.length, 0)
  return filteredTypeGroups.value.reduce((s, g) => s + g.trades.length, 0)
})

const paginatedCount = computed(() => {
  if (groupBy.value === 'date') return paginatedDateGroups.value.reduce((s, g) => s + g.trades.length, 0)
  if (groupBy.value === 'stock') return paginatedStockGroups.value.reduce((s, g) => s + g.trades.length, 0)
  return paginatedTypeGroups.value.reduce((s, g) => s + g.trades.length, 0)
})

const canLoadMore = computed(() => paginatedCount.value < totalFilteredCount.value)

async function loadMore() {
  if (isLoading.value || !canLoadMore.value) return
  isLoading.value = true
  await new Promise<void>(resolve => setTimeout(resolve, 400))
  loadedCount.value += PAGE_SIZE
  isLoading.value = false
}

// --- 무한 스크롤 ---
const sentinelRef = ref<HTMLElement | null>(null)

useIntersectionObserver(sentinelRef, ([entry]) => {
  if (entry.isIntersecting) loadMore()
})

// --- UI 액션 ---
function setPeriod(period: Period) {
  selectedPeriod.value = period
}

function setGroupBy(g: GroupBy) {
  groupBy.value = g
}

// --- 팝업 ---
const modalOpen = ref(false)
const modalDate = ref<string | null>(null)

function openModal() {
  modalDate.value = null
  modalOpen.value = true
}
</script>
