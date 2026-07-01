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
              ? 'bg-blue-600 text-white'
              : 'border border-input bg-background text-muted-foreground hover:bg-accent'"
            @click="form.type = 'BUY'"
          >
            매수
          </button>
          <button
            type="button"
            class="flex-1 rounded-md py-2 text-sm font-semibold transition-colors"
            :class="form.type === 'SELL'
              ? 'bg-red-500 text-white'
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
        <select
          v-model="form.accountId"
          class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">계좌를 선택하세요</option>
          <option
            v-for="acc in dummyAccounts"
            :key="acc.id"
            :value="acc.id"
          >
            {{ acc.displayName }}
          </option>
        </select>
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

      <!-- 메모 -->
      <UiFormField label="메모">
        <textarea
          v-model="form.memo"
          rows="2"
          placeholder="선택 입력"
          class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </UiFormField>

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
          :class="isFormValid ? 'bg-primary hover:bg-primary/90' : 'cursor-not-allowed bg-primary/40'"
          :disabled="!isFormValid"
        >
          저장
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
}>()

const DUMMY_TODAY = '2026-07-01'

// 더미 계좌 데이터
const dummyAccounts = [
  { id: '1', displayName: 'ISA계좌 (한국투자증권)' },
  { id: '2', displayName: '일반위탁 (키움증권)' },
  { id: '3', displayName: '1234-5678 (토스증권)' },
]

const stockSearchRef = ref<{ reset: () => void } | null>(null)

const form = reactive({
  type: 'BUY' as 'BUY' | 'SELL',
  date: props.defaultDate ?? DUMMY_TODAY,
  accountId: '',
  stockName: '',
  stockCode: '',
  price: '',
  quantity: '',
  memo: '',
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

// 모달이 열릴 때마다 폼 초기화
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      Object.assign(form, {
        type: 'BUY',
        date: props.defaultDate ?? DUMMY_TODAY,
        accountId: '',
        stockName: '',
        stockCode: '',
        price: '',
        quantity: '',
        memo: '',
      })
      Object.assign(errors, { date: '', accountId: '', stockCode: '', price: '', quantity: '' })
      stockSearchRef.value?.reset()
    }
  },
)

// defaultDate가 변경될 때 날짜 업데이트 (모달이 이미 열려 있는 경우)
watch(
  () => props.defaultDate,
  (date) => {
    if (props.open) form.date = date ?? DUMMY_TODAY
  },
)

function onStockSelect(stock: { code: string; name: string; market: string; price: string }) {
  form.stockName = stock.name
  form.stockCode = stock.code
  // 추후 API 연동 전까지 더미 현재가 자동 입력
  form.price = stock.price
  errors.stockCode = ''
}

function validate(): boolean {
  let valid = true
  errors.date = form.date ? '' : '거래일을 선택하세요.'
  errors.accountId = form.accountId ? '' : '계좌를 선택하세요.'
  errors.stockCode = form.stockCode ? '' : '종목을 선택하세요.'
  errors.price = form.price ? '' : '단가를 입력하세요.'
  errors.quantity =
    form.quantity && Number(form.quantity) > 0 ? '' : '수량을 1 이상 입력하세요.'

  valid = Object.values(errors).every((e) => e === '')
  return valid
}

function handleSubmit() {
  if (!validate()) return

  // 더미: 실제 저장 대신 콘솔 출력
  console.log('매매이력 저장:', {
    type: form.type,
    date: form.date,
    accountId: form.accountId,
    stockName: form.stockName,
    stockCode: form.stockCode,
    price: form.price,
    quantity: form.quantity,
    memo: form.memo,
  })

  emit('update:open', false)
}
</script>
