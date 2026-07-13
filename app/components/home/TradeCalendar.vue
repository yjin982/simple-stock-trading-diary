<template>
  <div class="space-y-4">
    <!-- 거래 달력 -->
    <section class="p-5 border rounded-lg shadow-sm bg-card text-card-foreground">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold">거래 이력</h2>
        <div class="flex items-center gap-1">
          <button
            class="rounded-md p-1.5 transition-colors hover:bg-accent"
            aria-label="이전 달"
            @click="prevMonth"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="w-28 text-center text-sm font-medium">{{ currentYearMonth }}</span>
          <button
            class="rounded-md p-1.5 transition-colors hover:bg-accent"
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
            class="relative flex h-8 w-8 flex-col items-center justify-center rounded-full text-sm transition-colors"
            :class="dayClass(day)"
            @click="selectDate(day)"
          >
            <span :class="getDayTradeType(day) ? '-mt-0.5' : ''">{{ day }}</span>
            <span
              v-if="getDayTradeType(day)"
              class="absolute bottom-1 h-1.5 w-1.5 rounded-full"
              :class="dotClass(day)"
            />
          </button>
          <div v-else class="h-8 w-8" />
        </div>
      </div>
    </section>

    <!-- 선택일 거래 내역 -->
    <section
      v-if="selectedDate"
      class="p-5 border rounded-lg shadow-sm bg-card text-card-foreground"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold">{{ selectedDate }} 거래 내역</h2>
        <button
          class="flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          @click="emit('open-modal', selectedDate)"
        >
          <Plus class="h-3.5 w-3.5" />
          매매이력 입력
        </button>
      </div>
      <TradeHistoryGroup :trades="selectedDateTrades" :card="false" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from '@lucide/vue'

const emit = defineEmits<{ 'open-modal': [date: string] }>()

const tradesStore = useTradesStore()
const today = new Date().toISOString().slice(0, 10)
const viewDate = ref(new Date())
const selectedDate = ref<string | null>(today)

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

function getDayTradeType(day: number): 'BUY' | 'SELL' | 'BOTH' | null {
  const trades = tradesStore.tradesByDate[formatDate(day)]
  if (!trades?.length) return null
  const hasBuy = trades.some(t => t.type === 'BUY')
  const hasSell = trades.some(t => t.type === 'SELL')
  if (hasBuy && hasSell) return 'BOTH'
  return hasBuy ? 'BUY' : 'SELL'
}

function selectDate(day: number) {
  const dateStr = formatDate(day)
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}

function dayClass(day: number) {
  const dateStr = formatDate(day)
  const isSelected = selectedDate.value === dateStr
  const isToday = dateStr === today
  const tradeType = getDayTradeType(day)

  if (isSelected) return 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90'
  if (isToday) return 'ring-1 ring-primary text-primary font-semibold hover:bg-accent'
  if (tradeType === 'BUY') return 'font-semibold text-red-600 hover:bg-red-50'
  if (tradeType === 'SELL') return 'font-semibold text-blue-600 hover:bg-blue-50'
  if (tradeType === 'BOTH') return 'font-semibold text-purple-600 hover:bg-purple-50'
  return 'text-muted-foreground hover:bg-accent'
}

function dotClass(day: number): string {
  if (selectedDate.value === formatDate(day)) return 'bg-white'
  const type = getDayTradeType(day)
  if (type === 'BUY') return 'bg-red-500'
  if (type === 'SELL') return 'bg-blue-500'
  return 'bg-purple-500'
}

const selectedDateTrades = computed(() =>
  selectedDate.value ? (tradesStore.tradesByDate[selectedDate.value] ?? []) : [],
)

function prevMonth() {
  selectedDate.value = null
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  selectedDate.value = null
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}
</script>
