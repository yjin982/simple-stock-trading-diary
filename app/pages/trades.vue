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
import type { TradeItem } from '~/components/trade/HistoryGroup.vue'

const DUMMY_TODAY = '2026-07-02'
const PAGE_SIZE = 30

const PERIODS = [
  { label: '전체', value: 'all' as const },
  { label: '1주일', value: '1w' as const },
  { label: '1개월', value: '1m' as const },
  { label: '3개월', value: '3m' as const },
  { label: '직접 지정', value: 'custom' as const },
]

// --- 더미 데이터 ---
const allTradeData: Record<string, TradeItem[]> = {
  '2026-07-01': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: '10', price: '₩75,000', total: '₩750,000', reason: '분할 매수 3차' },
    { type: 'SELL', accountName: '한국투자 해외주식', stockName: 'Apple Inc.', stockCode: 'AAPL', quantity: '2', price: '$185.50', total: '$371.00', reason: '목표가 달성', pnl: 27 },
  ],
  '2026-06-30': [
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'Microsoft Corp.', stockCode: 'MSFT', quantity: '3', price: '$425.00', total: '$1,275.00' },
    { type: 'SELL', accountName: '한국투자 국내주식', stockName: 'POSCO홀딩스', stockCode: '005490', quantity: '2', price: '₩435,000', total: '₩870,000', reason: '단기 수익 실현', pnl: 30000 },
  ],
  '2026-06-28': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: 'LG에너지솔루션', stockCode: '373220', quantity: '2', price: '₩390,000', total: '₩780,000', reason: '2차전지 반등 기대' },
  ],
  '2026-06-25': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: 'SK하이닉스', stockCode: '000660', quantity: '5', price: '₩180,000', total: '₩900,000', reason: 'HBM 수요 증가 전망' },
  ],
  '2026-06-22': [
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'Tesla Inc.', stockCode: 'TSLA', quantity: '5', price: '$245.00', total: '$1,225.00' },
    { type: 'SELL', accountName: '한국투자 해외주식', stockName: 'Microsoft Corp.', stockCode: 'MSFT', quantity: '2', price: '$418.00', total: '$836.00', reason: '실적 발표 전 차익 실현', pnl: -4 },
  ],
  '2026-06-20': [
    { type: 'SELL', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: '5', price: '₩73,500', total: '₩367,500', reason: '리밸런싱', pnl: 17500 },
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: '3', price: '$890.00', total: '$2,670.00', reason: 'AI 수요 강세' },
  ],
  '2026-06-18': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: '현대차', stockCode: '005380', quantity: '3', price: '₩245,000', total: '₩735,000' },
  ],
  '2026-06-15': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: '5', price: '₩71,000', total: '₩355,000', reason: '분할 매수 2차' },
    { type: 'SELL', accountName: '한국투자 국내주식', stockName: 'LG에너지솔루션', stockCode: '373220', quantity: '1', price: '₩385,000', total: '₩385,000', pnl: -5000 },
  ],
  '2026-06-12': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: 'POSCO홀딩스', stockCode: '005490', quantity: '3', price: '₩420,000', total: '₩1,260,000', reason: '철강 업황 개선 기대' },
  ],
  '2026-06-10': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: '삼성전자', stockCode: '005930', quantity: '20', price: '₩70,000', total: '₩1,400,000', reason: '분할 매수 1차' },
  ],
  '2026-06-08': [
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'Amazon.com Inc.', stockCode: 'AMZN', quantity: '4', price: '$192.00', total: '$768.00' },
  ],
  '2026-06-03': [
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'Apple Inc.', stockCode: 'AAPL', quantity: '5', price: '$172.00', total: '$860.00', reason: '조정 후 추가 매수' },
  ],
  '2026-05-30': [
    { type: 'SELL', accountName: '한국투자 국내주식', stockName: '현대차', stockCode: '005380', quantity: '2', price: '₩250,000', total: '₩500,000', reason: '단기 목표가 달성', pnl: 10000 },
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: '2', price: '$870.00', total: '$1,740.00' },
  ],
  '2026-05-28': [
    { type: 'SELL', accountName: '한국투자 국내주식', stockName: 'SK하이닉스', stockCode: '000660', quantity: '10', price: '₩175,000', total: '₩1,750,000', reason: '반도체 업황 불확실성', pnl: 70000 },
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'Microsoft Corp.', stockCode: 'MSFT', quantity: '2', price: '$420.00', total: '$840.00', reason: 'AI 클라우드 성장성' },
  ],
  '2026-05-22': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: 'LG에너지솔루션', stockCode: '373220', quantity: '3', price: '₩380,000', total: '₩1,140,000' },
  ],
  '2026-05-15': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: 'SK하이닉스', stockCode: '000660', quantity: '15', price: '₩168,000', total: '₩2,520,000', reason: 'RSI 과매도 구간' },
  ],
  '2026-05-10': [
    { type: 'SELL', accountName: '한국투자 해외주식', stockName: 'Amazon.com Inc.', stockCode: 'AMZN', quantity: '3', price: '$198.00', total: '$594.00', reason: '3% 수익 실현', pnl: 39 },
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: '현대차', stockCode: '005380', quantity: '5', price: '₩238,000', total: '₩1,190,000', reason: '실적 개선 기대' },
  ],
  '2026-05-01': [
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'Tesla Inc.', stockCode: 'TSLA', quantity: '3', price: '$220.00', total: '$660.00' },
  ],
  '2026-04-30': [
    { type: 'SELL', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: '1', price: '$950.00', total: '$950.00', reason: '10% 수익 목표 달성', pnl: 130 },
  ],
  '2026-04-25': [
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: '삼성SDI', stockCode: '006400', quantity: '2', price: '₩320,000', total: '₩640,000' },
    { type: 'SELL', accountName: '한국투자 해외주식', stockName: 'Tesla Inc.', stockCode: 'TSLA', quantity: '2', price: '$230.00', total: '$460.00', reason: '손실 제한', pnl: -30 },
  ],
  '2026-04-20': [
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'Amazon.com Inc.', stockCode: 'AMZN', quantity: '5', price: '$185.00', total: '$925.00', reason: '어닝 시즌 기대' },
  ],
  '2026-04-15': [
    { type: 'BUY', accountName: '한국투자 해외주식', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: '4', price: '$820.00', total: '$3,280.00', reason: 'AI GPU 수요 강세' },
    { type: 'BUY', accountName: '한국투자 국내주식', stockName: '카카오', stockCode: '035720', quantity: '20', price: '₩52,000', total: '₩1,040,000' },
  ],
  '2026-04-10': [
    { type: 'SELL', accountName: '한국투자 국내주식', stockName: '삼성SDI', stockCode: '006400', quantity: '3', price: '₩330,000', total: '₩990,000', reason: '단기 반등 이후 매도', pnl: 30000 },
  ],
  '2026-04-01': [
    { type: 'SELL', accountName: '한국투자 국내주식', stockName: '카카오', stockCode: '035720', quantity: '30', price: '₩58,000', total: '₩1,740,000', reason: '목표 수익률 달성', pnl: 180000 },
  ],
}

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

// --- 날짜 유틸 ---
function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

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
  Object.entries(allTradeData)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, trades]) => ({ date, trades })),
)

const filteredDateGroups = computed(() => {
  const start = startDate.value
  const end = endDate.value
  return allDateGroups.value.filter(g => g.date >= start && g.date <= end)
})

const paginatedDateGroups = computed(() => {
  let count = 0
  const result: typeof filteredDateGroups.value = []
  for (const group of filteredDateGroups.value) {
    if (count >= loadedCount.value) break
    result.push(group)
    count += group.trades.length
  }
  return result
})

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

const paginatedStockGroups = computed((): StockGroup[] => {
  let count = 0
  const result: StockGroup[] = []
  for (const group of filteredStockGroups.value) {
    if (count >= loadedCount.value) break
    result.push(group)
    count += group.trades.length
  }
  return result
})

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

const paginatedTypeGroups = computed((): TypeGroup[] => {
  let count = 0
  const result: TypeGroup[] = []
  for (const group of filteredTypeGroups.value) {
    if (count >= loadedCount.value) break
    result.push(group)
    count += group.trades.length
  }
  return result
})

// --- 기간 요약 ---
function parseAmount(total: string): number {
  return parseFloat(total.replace(/[₩$,]/g, ''))
}

function getCurrency(total: string): 'KRW' | 'USD' {
  return total.startsWith('₩') ? 'KRW' : 'USD'
}

const periodSummary = computed(() => {
  const stats = {
    buyKRW: 0, buyUSD: 0,
    sellKRW: 0, sellUSD: 0,
    pnlKRW: 0, pnlUSD: 0,
    hasPnlKRW: false, hasPnlUSD: false,
  }

  filteredDateGroups.value.forEach(({ trades }) => {
    trades.forEach(trade => {
      const amount = parseAmount(trade.total)
      const currency = getCurrency(trade.total)

      if (trade.type === 'BUY') {
        if (currency === 'KRW') stats.buyKRW += amount
        else stats.buyUSD += amount
      }
      else {
        if (currency === 'KRW') stats.sellKRW += amount
        else stats.sellUSD += amount
        if (trade.pnl !== undefined) {
          if (currency === 'KRW') { stats.pnlKRW += trade.pnl; stats.hasPnlKRW = true }
          else { stats.pnlUSD += trade.pnl; stats.hasPnlUSD = true }
        }
      }
    })
  })

  return stats
})

function fmtKRW(n: number): string {
  return '₩' + Math.round(Math.abs(n)).toLocaleString('ko-KR')
}

function fmtUSD(n: number): string {
  return '$' + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtPnl(n: number, currency: 'KRW' | 'USD'): string {
  const prefix = n >= 0 ? '+' : '-'
  return currency === 'KRW' ? prefix + fmtKRW(n) : prefix + fmtUSD(n)
}

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
