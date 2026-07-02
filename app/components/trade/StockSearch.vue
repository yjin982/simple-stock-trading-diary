<template>
  <div ref="containerRef" class="relative">
    <input
      v-model="query"
      type="text"
      autocomplete="off"
      :placeholder="selectedStock ? '' : '종목명 또는 코드 입력'"
      class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      @input="onInput"
      @focus="showDropdown = true"
      @keydown.escape="showDropdown = false"
      @keydown.down.prevent="moveDown"
      @keydown.up.prevent="moveUp"
      @keydown.enter.prevent="confirmHighlighted"
    />

    <!-- 선택된 종목 뱃지 (입력 필드 위에 표시) -->
    <div
      v-if="selectedStock && !query"
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3"
    >
      <span class="text-sm">{{ selectedStock.name }}</span>
      <span class="ml-1.5 text-xs text-muted-foreground">({{ selectedStock.code }})</span>
    </div>

    <!-- 드롭다운 목록 -->
    <ul
      v-if="showDropdown && query.length >= 1"
      class="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-auto rounded-md border bg-background shadow-lg"
    >
      <template v-if="filteredStocks.length > 0">
        <li
          v-for="(stock, i) in filteredStocks"
          :key="stock.code"
          class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors"
          :class="i === highlightedIndex ? 'bg-accent' : 'hover:bg-accent'"
          @mousedown.prevent="selectStock(stock)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium truncate">{{ stock.name }}</span>
            <span class="shrink-0 text-xs text-muted-foreground">{{ stock.code }}</span>
          </div>
          <span class="ml-3 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {{ stock.market }}
          </span>
        </li>
      </template>
      <li v-else class="px-3 py-3 text-sm text-muted-foreground text-center">
        검색 결과가 없습니다.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { dummyStocks } from '~/lib/dummy-data'
import type { Stock } from '~/types'

const emit = defineEmits<{
  select: [stock: Stock]
}>()

const containerRef = ref<HTMLElement | null>(null)
const query = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const selectedStock = ref<Stock | null>(null)

const filteredStocks = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return dummyStocks.filter(
    (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
  )
})

function onInput() {
  selectedStock.value = null
  highlightedIndex.value = -1
  showDropdown.value = true
}

function selectStock(stock: Stock) {
  selectedStock.value = stock
  query.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1
  emit('select', stock)
}

function moveDown() {
  if (!showDropdown.value) return
  highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredStocks.value.length - 1)
}

function moveUp() {
  if (!showDropdown.value) return
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
}

function confirmHighlighted() {
  const stock = filteredStocks.value[highlightedIndex.value]
  if (stock) selectStock(stock)
}

// 외부 클릭 시 드롭다운 닫기
onClickOutside(containerRef, () => {
  showDropdown.value = false
})

// 부모에서 reset() 호출 가능하도록 노출
function reset() {
  query.value = ''
  selectedStock.value = null
  showDropdown.value = false
  highlightedIndex.value = -1
}

defineExpose({ reset })
</script>
