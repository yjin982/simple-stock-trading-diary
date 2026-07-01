<template>
  <div class="space-y-6">
    <!-- 요약 카드 + 매매이력 입력 버튼 -->
    <section>
      <div class="mb-3 flex items-center justify-between">
        <h1 class="text-base font-semibold">포트폴리오 요약</h1>
        <button
          class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          @click="openModal(null)"
        >
          <Plus class="h-4 w-4" />
          매매이력 입력
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <UiCard title="총 평가금액" value="₩14,821,500" />
        <UiCard title="평가손익" value="+₩821,500" sub-value="+5.87%" trend="positive" />
        <UiCard title="실현손익" value="+₩1,234,000" sub-value="+10.28%" trend="positive" />
        <UiCard title="총 매수금액" value="₩14,000,000" />
        <UiCard
          title="총 수익률"
          value="+14.68%"
          trend="positive"
          class="col-span-2 sm:col-span-1"
        />
      </div>
    </section>

    <!-- 거래 달력 -->
    <section class="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold">거래 이력</h2>
        <div class="flex items-center gap-1">
          <button
            class="rounded-md p-1.5 hover:bg-accent transition-colors"
            aria-label="이전 달"
            @click="prevMonth"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="w-28 text-center text-sm font-medium">{{ currentYearMonth }}</span>
          <button
            class="rounded-md p-1.5 hover:bg-accent transition-colors"
            aria-label="다음 달"
            @click="nextMonth"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- 요일 헤더 -->
      <div class="mb-1 grid grid-cols-7">
        <div
          v-for="(day, i) in ['일', '월', '화', '수', '목', '금', '토']"
          :key="day"
          class="py-1 text-center text-xs text-muted-foreground"
          :class="{ 'text-red-500': i === 0, 'text-blue-500': i === 6 }"
        >
          {{ day }}
        </div>
      </div>

      <!-- 날짜 그리드 -->
      <div class="grid grid-cols-7 gap-y-0.5">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="flex items-center justify-center"
        >
          <button
            v-if="day !== null"
            class="relative flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors"
            :class="dayClass(day)"
            @click="selectDate(day)"
          >
            {{ day }}
            <span
              v-if="hasTradeOnDay(day)"
              class="absolute bottom-1 h-1 w-1 rounded-full"
              :class="isSelectedDay(day) ? 'bg-primary-foreground' : 'bg-primary'"
            />
          </button>
          <div v-else class="h-8 w-8" />
        </div>
      </div>
    </section>

    <!-- 선택일 거래 내역 (날짜 클릭 시 항상 표시) -->
    <section
      v-if="selectedDate"
      class="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold">{{ selectedDate }} 거래 내역</h2>
        <button
          class="flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          @click="openModal(selectedDate)"
        >
          <Plus class="h-3.5 w-3.5" />
          매매이력 입력
        </button>
      </div>

      <!-- 거래 있음 -->
      <div v-if="selectedDateTrades.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="pb-2 text-left text-xs font-medium text-muted-foreground">유형</th>
              <th class="pb-2 text-left text-xs font-medium text-muted-foreground">종목</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground">수량</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground">단가</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground">거래금액</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(trade, i) in selectedDateTrades"
              :key="i"
              class="border-b last:border-0"
            >
              <td class="py-2.5">
                <span
                  class="inline-flex rounded px-1.5 py-0.5 text-xs font-semibold"
                  :class="trade.type === 'BUY'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
                >
                  {{ trade.type === 'BUY' ? '매수' : '매도' }}
                </span>
              </td>
              <td class="py-2.5">
                <div class="font-medium">{{ trade.stockName }}</div>
                <div class="text-xs text-muted-foreground">{{ trade.stockCode }}</div>
              </td>
              <td class="py-2.5 text-right">{{ trade.quantity }}</td>
              <td class="py-2.5 text-right">{{ trade.price }}</td>
              <td class="py-2.5 text-right font-medium">{{ trade.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 거래 없음 (빈 상태) -->
      <div v-else class="flex flex-col items-center gap-3 py-8 text-center">
        <div class="rounded-full bg-muted p-3">
          <FileX class="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p class="text-sm font-medium">거래 내역이 없습니다</p>
          <p class="mt-0.5 text-xs text-muted-foreground">이 날짜에 등록된 매매 이력이 없어요.</p>
        </div>
      </div>
    </section>

    <!-- 보유 종목 -->
    <section class="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <h2 class="mb-3 text-sm font-semibold">보유 종목</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="pb-2 text-left text-xs font-medium text-muted-foreground">종목</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground">수량</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">평균단가</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground">현재가</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground">평가손익</th>
              <th class="pb-2 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">손익률</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(holding, i) in holdings"
              :key="i"
              class="border-b last:border-0"
            >
              <td class="py-3">
                <div class="font-medium">{{ holding.stockName }}</div>
                <div class="text-xs text-muted-foreground">{{ holding.stockCode }} · {{ holding.market }}</div>
              </td>
              <td class="py-3 text-right">{{ holding.quantity }}</td>
              <td class="py-3 text-right hidden sm:table-cell">{{ holding.avgPrice }}</td>
              <td class="py-3 text-right">{{ holding.currentPrice }}</td>
              <td
                class="py-3 text-right font-medium"
                :class="holding.pnl.startsWith('+') ? 'text-emerald-600' : 'text-red-500'"
              >
                {{ holding.pnl }}
              </td>
              <td
                class="py-3 text-right hidden md:table-cell"
                :class="holding.pnlRate.startsWith('+') ? 'text-emerald-600' : 'text-red-500'"
              >
                {{ holding.pnlRate }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 매매이력 입력 팝업 -->
    <TradeFormModal
      v-model:open="modalOpen"
      :default-date="modalDate"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, FileX, Plus } from '@lucide/vue'

// --- 더미 데이터 ---
const tradeData: Record<string, { type: 'BUY' | 'SELL'; stockName: string; stockCode: string; quantity: string; price: string; total: string }[]> = {
  '2026-07-01': [
    { type: 'BUY', stockName: '삼성전자', stockCode: '005930', quantity: '10', price: '₩75,000', total: '₩750,000' },
    { type: 'SELL', stockName: 'Apple Inc.', stockCode: 'AAPL', quantity: '2', price: '$185.50', total: '$371.00' },
  ],
  '2026-06-25': [
    { type: 'BUY', stockName: 'SK하이닉스', stockCode: '000660', quantity: '5', price: '₩180,000', total: '₩900,000' },
  ],
  '2026-06-20': [
    { type: 'SELL', stockName: '삼성전자', stockCode: '005930', quantity: '5', price: '₩73,500', total: '₩367,500' },
    { type: 'BUY', stockName: 'NVIDIA Corp.', stockCode: 'NVDA', quantity: '3', price: '$890.00', total: '$2,670.00' },
  ],
  '2026-06-10': [
    { type: 'BUY', stockName: '삼성전자', stockCode: '005930', quantity: '20', price: '₩70,000', total: '₩1,400,000' },
  ],
  '2026-06-03': [
    { type: 'BUY', stockName: 'Apple Inc.', stockCode: 'AAPL', quantity: '5', price: '$172.00', total: '$860.00' },
  ],
}

const holdings = [
  { stockName: '삼성전자', stockCode: '005930', market: 'KR', quantity: '25', avgPrice: '₩71,000', currentPrice: '₩75,000', pnl: '+₩100,000', pnlRate: '+5.63' },
  { stockName: 'Apple Inc.', stockCode: 'AAPL', market: 'US', quantity: '3', avgPrice: '$172.00', currentPrice: '$185.50', pnl: '+$40.50', pnlRate: '+7.85' },
  { stockName: 'SK하이닉스', stockCode: '000660', market: 'KR', quantity: '5', avgPrice: '₩180,000', currentPrice: '₩183,000', pnl: '+₩15,000', pnlRate: '+1.67' },
  { stockName: 'NVIDIA Corp.', stockCode: 'NVDA', market: 'US', quantity: '3', avgPrice: '$890.00', currentPrice: '$920.00', pnl: '+$90.00', pnlRate: '+3.37' },
]

// --- 달력 상태 ---
const DUMMY_TODAY = '2026-07-01'

const viewDate = ref(new Date(2026, 6, 1))
const selectedDate = ref<string | null>(DUMMY_TODAY)

const currentYearMonth = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth() + 1
  return `${year}년 ${month}월`
})

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = Array(firstDayOfWeek).fill(null)
  for (let d = 1; d <= totalDays; d++) days.push(d)
  return days
})

function formatDate(day: number): string {
  const year = viewDate.value.getFullYear()
  const month = String(viewDate.value.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-${String(day).padStart(2, '0')}`
}

function hasTradeOnDay(day: number): boolean {
  return formatDate(day) in tradeData
}

function isSelectedDay(day: number): boolean {
  return selectedDate.value === formatDate(day)
}

function selectDate(day: number) {
  const dateStr = formatDate(day)
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}

function dayClass(day: number) {
  const dateStr = formatDate(day)
  const isSelected = selectedDate.value === dateStr
  const isToday = dateStr === DUMMY_TODAY
  const hasTrade = hasTradeOnDay(day)

  if (isSelected) return 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90'
  if (isToday) return 'ring-1 ring-primary text-primary font-semibold hover:bg-accent'
  if (hasTrade) return 'font-medium text-foreground hover:bg-accent'
  return 'text-muted-foreground hover:bg-accent'
}

const selectedDateTrades = computed(() => {
  if (!selectedDate.value) return []
  return tradeData[selectedDate.value] ?? []
})

function prevMonth() {
  selectedDate.value = null
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  selectedDate.value = null
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

// --- 매매이력 입력 팝업 ---
const modalOpen = ref(false)
const modalDate = ref<string | null>(null)

function openModal(date: string | null) {
  modalDate.value = date
  modalOpen.value = true
}
</script>
