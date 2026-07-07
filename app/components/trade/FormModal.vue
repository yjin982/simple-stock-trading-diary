<template>
  <UiDialog
    :open="open"
    title="매매이력 입력"
    @update:open="emit('update:open', $event)"
  >
    <form class="space-y-4 p-5 pb-6" @submit.prevent="handleSubmit">
      <!-- 거래 유형 -->
      <UiFormField label="거래 유형" required>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-md py-2 text-sm font-semibold transition-colors"
            :class="form.type === 'BUY'
              ? 'bg-red-500 text-white'
              : 'border border-input bg-background text-muted-foreground hover:bg-accent'"
            @click="form.type = 'BUY'"
          >
            매수
          </button>
          <button
            type="button"
            class="flex-1 rounded-md py-2 text-sm font-semibold transition-colors"
            :class="form.type === 'SELL'
              ? 'bg-blue-600 text-white'
              : 'border border-input bg-background text-muted-foreground hover:bg-accent'"
            @click="form.type = 'SELL'"
          >
            매도
          </button>
        </div>
      </UiFormField>

      <!-- 거래일 -->
      <UiFormField label="거래일" required :error="errors.date">
        <input
          v-model="form.date"
          type="date"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </UiFormField>

      <!-- 계좌 선택 -->
      <UiFormField label="계좌" required :error="errors.accountId">
        <AccountSelect v-model="form.accountId" />
      </UiFormField>

      <!-- 종목 검색 -->
      <UiFormField
        label="종목"
        required
        :error="errors.stockCode"
        hint="종목명 또는 코드로 검색하세요"
      >
        <TradeStockSearch
          ref="stockSearchRef"
          @select="onStockSelect"
        />
      </UiFormField>

      <!-- 단가 -->
      <UiFormField
        label="단가"
        required
        :error="errors.price"
        :hint="form.stockCode ? '종목 선택 시 현재가로 자동 입력됩니다 (수정 가능)' : undefined"
      >
        <input
          v-model="form.price"
          type="text"
          inputmode="decimal"
          placeholder="0"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </UiFormField>

      <!-- 수량 -->
      <UiFormField label="수량" required :error="errors.quantity">
        <input
          v-model="form.quantity"
          type="number"
          min="1"
          step="1"
          placeholder="0"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </UiFormField>

      <!-- 매수/매도 이유 -->
      <UiFormField :label="form.type === 'BUY' ? '매수 이유' : '매도 이유'">
        <textarea
          v-model="form.reason"
          rows="2"
          placeholder="이유를 입력하세요 (선택)"
          class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </UiFormField>

      <p v-if="tradesStore.error" class="text-xs text-destructive">
        {{ tradesStore.error }}
      </p>

      <!-- 버튼 -->
      <div class="flex gap-2 pt-1">
        <button
          type="button"
          class="flex-1 rounded-md border border-input bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          @click="emit('update:open', false)"
        >
          취소
        </button>
        <button
          type="submit"
          class="flex-1 rounded-md py-2 text-sm font-semibold text-white transition-colors"
          :class="isFormValid && !tradesStore.loading ? 'bg-primary hover:bg-primary/90' : 'cursor-not-allowed bg-primary/40'"
          :disabled="!isFormValid || tradesStore.loading"
        >
          {{ tradesStore.loading ? '저장 중...' : '저장' }}
        </button>
      </div>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  defaultDate?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const tradesStore = useTradesStore()
const stockSearchRef = ref<{ reset: () => void } | null>(null)

const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  type: 'BUY' as 'BUY' | 'SELL',
  date: props.defaultDate ?? today,
  accountId: '',
  stockName: '',
  stockCode: '',
  market: '' as 'KR' | 'US' | '',
  currency: '' as 'KRW' | 'USD' | '',
  price: '',
  quantity: '',
  reason: '',
})

const errors = reactive({
  date: '',
  accountId: '',
  stockCode: '',
  price: '',
  quantity: '',
})

const isFormValid = computed(() =>
  form.date !== '' &&
  form.accountId !== '' &&
  form.stockCode !== '' &&
  form.price !== '' &&
  form.quantity !== '' &&
  Number(form.quantity) > 0,
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      Object.assign(form, {
        type: 'BUY',
        date: props.defaultDate ?? today,
        accountId: '',
        stockName: '',
        stockCode: '',
        market: '',
        currency: '',
        price: '',
        quantity: '',
        reason: '',
      })
      Object.assign(errors, { date: '', accountId: '', stockCode: '', price: '', quantity: '' })
      tradesStore.clearError()
      stockSearchRef.value?.reset()
    }
  },
)

watch(
  () => props.defaultDate,
  (date) => {
    if (props.open) form.date = date ?? today
  },
)

function onStockSelect(stock: { code: string; name: string; market: 'KR' | 'US'; currency: 'KRW' | 'USD'; price: number }) {
  form.stockName = stock.name
  form.stockCode = stock.code
  form.market = stock.market
  form.currency = stock.currency
  form.price = String(stock.price)
  errors.stockCode = ''
}

function validate(): boolean {
  errors.date = form.date ? '' : '거래일을 선택하세요.'
  errors.accountId = form.accountId ? '' : '계좌를 선택하세요.'
  errors.stockCode = form.stockCode ? '' : '종목을 선택하세요.'
  errors.price = form.price ? '' : '단가를 입력하세요.'
  errors.quantity = form.quantity && Number(form.quantity) > 0 ? '' : '수량을 1 이상 입력하세요.'
  return Object.values(errors).every((e) => e === '')
}

async function handleSubmit() {
  if (!validate()) return

  const trade = await tradesStore.add({
    accountId: form.accountId,
    type: form.type,
    stockCode: form.stockCode,
    stockName: form.stockName,
    market: form.market as 'KR' | 'US',
    currency: form.currency as 'KRW' | 'USD',
    price: Number(form.price),
    quantity: Number(form.quantity),
    tradeDate: form.date,
    memo: form.reason || undefined,
  })

  if (trade) {
    emit('saved')
    emit('update:open', false)
  }
}
</script>
