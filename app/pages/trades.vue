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
        <UiTabGroup v-model="selectedPeriod" :options="PERIODS" />

        <template v-if="selectedPeriod === 'custom'">
          <input
            v-model="customStart"
            type="date"
            :max="customEnd || today"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span class="text-sm text-muted-foreground">~</span>
          <input
            v-model="customEnd"
            type="date"
            :min="customStart"
            :max="today"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </template>
      </div>

      <!-- 그룹 토글 -->
      <UiTabGroup v-model="groupBy" :options="GROUP_BY_OPTIONS" />
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
              :class="pnlColor(periodSummary.pnlKRW)"
            >
              {{ fmtPnl(periodSummary.pnlKRW, 'KRW') }}
            </p>
            <p
              v-if="periodSummary.hasPnlUSD"
              class="text-xs"
              :class="pnlColor(periodSummary.pnlUSD)"
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
        show-actions
        @edit-trade="handleEditTrade"
        @delete-trade="handleDeleteTrade"
      />
    </div>

    <!-- 매매 이력 목록 (타입별) -->
    <div v-else-if="groupBy === 'type' && paginatedTypeGroups.length > 0" class="space-y-4">
      <div v-for="group in paginatedTypeGroups" :key="group.type">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="inline-flex rounded px-2 py-0.5 text-sm font-semibold"
            :class="group.type === 'BUY'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
          >
            {{ group.type === 'BUY' ? '매수' : '매도' }}
          </span>
          <span class="text-xs text-muted-foreground">{{ group.trades.length }}건</span>
        </div>
        <TradeHistoryGroup
          :trades="group.trades"
          show-account
          show-date
          show-actions
          @edit-trade="handleEditTrade"
          @delete-trade="handleDeleteTrade"
        />
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmptyState
      v-else-if="!isLoading"
      :icon="ScrollText"
      title="매매 내역이 없습니다"
      description="선택한 기간에 등록된 매매 이력이 없어요."
      card
    />

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

    <!-- 매매이력 입력/수정 팝업 -->
    <TradeFormModal
      v-model:open="modalOpen"
      :default-date="modalDate"
      :edit-trade="editingTrade ?? undefined"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { useIntersectionObserver } from '@vueuse/core'
import { Loader2, Plus, ScrollText } from '@lucide/vue'
import type { Trade, TradeItem } from '~/types'

const PAGE_SIZE = 30

const PERIODS: { label: string; value: Period }[] = [
  { label: '전체', value: 'all' },
  { label: '1주일', value: '1w' },
  { label: '1개월', value: '1m' },
  { label: '3개월', value: '3m' },
  { label: '직접 지정', value: 'custom' },
]

const GROUP_BY_OPTIONS: { label: string; value: GroupBy }[] = [
  { label: '날짜별', value: 'date' },
  { label: '타입별', value: 'type' },
]

// --- 상태 ---
type Period = 'all' | '1w' | '1m' | '3m' | 'custom'
type GroupBy = 'date' | 'type'

const tradesStore = useTradesStore()
const today = new Date().toISOString().slice(0, 10)

onMounted(() => tradesStore.fetchAll())

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
  if (selectedPeriod.value === '1w') return subtractDays(today, 7)
  if (selectedPeriod.value === '1m') return subtractDays(today, 30)
  if (selectedPeriod.value === '3m') return subtractDays(today, 90)
  return '2000-01-01'
})

const endDate = computed(() => {
  if (selectedPeriod.value === 'custom') return customEnd.value || today
  return today
})

// --- 날짜별 그룹 ---
const allDateGroups = computed(() =>
  Object.entries(tradesStore.tradesByDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, trades]) => ({ date, trades })),
)

const filteredDateGroups = computed(() => {
  const start = startDate.value
  const end = endDate.value
  return allDateGroups.value.filter(g => g.date >= start && g.date <= end)
})

const paginatedDateGroups = computed(() => paginateGroups(filteredDateGroups.value, loadedCount.value))

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
  return filteredTypeGroups.value.reduce((s, g) => s + g.trades.length, 0)
})

const paginatedCount = computed(() => {
  if (groupBy.value === 'date') return paginatedDateGroups.value.reduce((s, g) => s + g.trades.length, 0)
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
  if (entry?.isIntersecting) loadMore()
})

// --- 팝업 ---
const modalOpen = ref(false)
const modalDate = ref<string | null>(null)
const editingTrade = ref<Trade | null>(null)

watch(modalOpen, (open) => { if (!open) editingTrade.value = null })

function openModal() {
  editingTrade.value = null
  modalDate.value = null
  modalOpen.value = true
}

function handleEditTrade(id: string) {
  editingTrade.value = tradesStore.items.find(t => t.id === id) ?? null
  if (editingTrade.value) modalOpen.value = true
}

async function handleDeleteTrade(id: string) {
  await tradesStore.remove(id)
}
</script>
