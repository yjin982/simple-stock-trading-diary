<template>
  <div ref="containerRef" class="relative">
    <div v-if="accountCurrency === 'BOTH'" class="mb-1.5 flex gap-1">
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-medium transition-colors"
        :class="selectedMarket === 'KR' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'"
        @click="selectMarket('KR')"
      >
        국내
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-medium transition-colors"
        :class="selectedMarket === 'US' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'"
        @click="selectMarket('US')"
      >
        해외
      </button>
    </div>
    <input
      v-model="query"
      type="text"
      autocomplete="off"
      :disabled="!accountCurrency"
      :placeholder="inputPlaceholder"
      class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      @input="onInput"
      @focus="showDropdown = true"
      @keydown.escape="showDropdown = false"
      @keydown.down.prevent="moveDown"
      @keydown.up.prevent="moveUp"
      @keydown.enter.prevent="confirmHighlighted($event)"
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
      <!-- 로딩 -->
      <li v-if="status === 'pending'" class="px-3 py-3 text-sm text-muted-foreground text-center">
        검색 중...
      </li>
      <!-- 에러 -->
      <li v-else-if="status === 'error'" class="px-3 py-3 text-sm text-destructive text-center">
        검색 중 오류가 발생했습니다.
      </li>
      <!-- 결과 -->
      <template v-else-if="stocks && stocks.length > 0">
        <li
          v-for="(stock, i) in stocks"
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
            {{ stock.exchange ?? stock.market }}
          </span>
        </li>
      </template>
      <!-- 빈 결과 (검색 후) -->
      <li v-else-if="status === 'success'" class="px-3 py-3 text-sm text-muted-foreground text-center">
        검색 결과가 없습니다.
      </li>
      <!-- 검색 전 안내 -->
      <li v-else class="px-3 py-3 text-sm text-muted-foreground text-center">
        엔터를 눌러 검색하세요.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { Stock } from '~/types'

const props = defineProps<{
  accountCurrency: 'KRW' | 'USD' | 'BOTH' | null
}>()

const emit = defineEmits<{
  select: [stock: Stock]
}>()

const containerRef = ref<HTMLElement | null>(null)
const query = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const selectedStock = ref<Stock | null>(null)
// BOTH(KRW+USD) 계좌는 국내/해외 검색 대상을 사용자가 직접 선택해야 한다.
const selectedMarket = ref<'KR' | 'US'>(props.accountCurrency === 'USD' ? 'US' : 'KR')

const inputPlaceholder = computed(() => {
  if (!props.accountCurrency) return '계좌를 먼저 선택하세요'
  if (selectedStock.value) return ''
  return '종목명 입력 후 엔터로 검색'
})

const searchEndpoint = computed<string>(() =>
  selectedMarket.value === 'KR' ? '/api/stock/search' : '/api/stock/search-us'
)

const { data: stocks, status, execute } = useFetch<Stock[]>(searchEndpoint, {
  query: { name: query },
  immediate: false,
  watch: false,
})

function resetSearchState() {
  stocks.value = undefined
  query.value = ''
  selectedStock.value = null
  highlightedIndex.value = -1
  showDropdown.value = false
}

function selectMarket(market: 'KR' | 'US') {
  if (selectedMarket.value === market) return
  selectedMarket.value = market
  resetSearchState()
}

watch(() => props.accountCurrency, (currency) => {
  selectedMarket.value = currency === 'USD' ? 'US' : 'KR'
  resetSearchState()
})

function onInput() {
  selectedStock.value = null
  highlightedIndex.value = -1
  showDropdown.value = true
  stocks.value = undefined
}

function selectStock(stock: Stock) {
  selectedStock.value = stock
  query.value = ''
  showDropdown.value = false
  highlightedIndex.value = -1
  emit('select', stock)
}

function moveDown() {
  if (!showDropdown.value || !stocks.value?.length) return
  highlightedIndex.value = Math.min(highlightedIndex.value + 1, stocks.value.length - 1)
}

function moveUp() {
  if (!showDropdown.value) return
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
}

function confirmHighlighted(event?: KeyboardEvent) {
  if (event?.isComposing) return
  const stock = stocks.value?.[highlightedIndex.value]
  if (stock) {
    selectStock(stock)
  } else if (query.value.trim().length >= 1) {
    execute()
    showDropdown.value = true
  }
}

onClickOutside(containerRef, () => {
  showDropdown.value = false
})

function reset() {
  query.value = ''
  selectedStock.value = null
  showDropdown.value = false
  highlightedIndex.value = -1
  stocks.value = undefined
}

function setStock(stock: Stock) {
  selectedStock.value = stock
  query.value = ''
  showDropdown.value = false
}

defineExpose({ reset, setStock })
</script>
