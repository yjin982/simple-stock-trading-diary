<template>
  <div>
    <!-- 트리거 버튼 -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="!accountId"
      class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      @click="toggleDropdown"
    >
      <span :class="selectedStock ? 'text-foreground' : 'text-muted-foreground'">
        {{ triggerLabel }}
      </span>
      <ChevronDown
        class="h-4 w-4 shrink-0 text-muted-foreground transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>

    <!-- 플로팅 드롭다운 -->
    <Teleport to="body">
      <!-- 닫기 오버레이 (드롭다운 외부 클릭 감지) -->
      <div v-if="isOpen" class="fixed inset-0 z-[55]" @click="isOpen = false" />

      <!-- 드롭다운 패널 -->
      <div
        v-if="isOpen"
        class="fixed z-[60] overflow-hidden rounded-md border bg-background shadow-lg"
        :style="dropdownStyle"
      >
        <ul class="max-h-52 overflow-auto py-1">
          <li
            v-if="stocks.length === 0"
            class="px-3 py-2.5 text-sm text-muted-foreground"
          >
            매도 가능한 보유 종목이 없습니다.
          </li>
          <li
            v-for="stock in stocks"
            :key="stock.code"
            class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent"
            :class="selectedStock?.code === stock.code ? 'bg-accent/60 font-medium' : ''"
            @click="selectStock(stock)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-medium truncate">{{ stock.name }}</span>
              <span class="shrink-0 text-xs text-muted-foreground">{{ stock.code }}</span>
            </div>
            <span class="ml-3 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {{ stock.quantity }}주 보유
            </span>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { Stock } from '~/types'

export type HoldingOption = {
  code: string
  name: string
  market: 'KR' | 'US'
  exchange?: 'KOSPI' | 'KOSDAQ'
  currency: 'KRW' | 'USD'
  quantity: number
  avgPrice: number
}

const props = defineProps<{
  accountId: string
  stocks: HoldingOption[]
}>()

const emit = defineEmits<{
  select: [stock: Stock]
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownStyle = reactive({ top: '0px', left: '0px', width: '0px' })
const selectedStock = ref<HoldingOption | null>(null)

const triggerLabel = computed(() => {
  if (!props.accountId) return '계좌를 먼저 선택하세요'
  if (selectedStock.value) return `${selectedStock.value.name} (${selectedStock.value.code})`
  return '매도할 종목을 선택하세요'
})

watch(() => props.accountId, () => {
  selectedStock.value = null
  isOpen.value = false
})

function toggleDropdown() {
  if (!props.accountId) return
  if (!isOpen.value) {
    if (triggerRef.value) {
      const rect = triggerRef.value.getBoundingClientRect()
      dropdownStyle.top = `${rect.bottom + 4}px`
      dropdownStyle.left = `${rect.left}px`
      dropdownStyle.width = `${rect.width}px`
    }
    isOpen.value = true
  } else {
    isOpen.value = false
  }
}

function selectStock(stock: HoldingOption) {
  selectedStock.value = stock
  isOpen.value = false
  emit('select', {
    code: stock.code,
    name: stock.name,
    market: stock.market,
    exchange: stock.exchange,
    currency: stock.currency,
    price: stock.avgPrice,
  })
}

function reset() {
  selectedStock.value = null
  isOpen.value = false
}

function setStock(stock: Stock) {
  selectedStock.value = {
    code: stock.code,
    name: stock.name,
    market: stock.market,
    exchange: stock.exchange,
    currency: stock.currency,
    quantity: 0,
    avgPrice: stock.price,
  }
}

defineExpose({ reset, setStock })
</script>
