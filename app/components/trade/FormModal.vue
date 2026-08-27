<template>
  <UiDialog
    :open="open"
    :title="editTrade ? '매매이력 수정' : '매매이력 입력'"
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
        <UiInput v-model="form.date" type="date" class="w-full" />
      </UiFormField>

      <!-- 계좌 선택 -->
      <UiFormField label="계좌" required :error="errors.accountId">
        <AccountSelect v-model="form.accountId" />
      </UiFormField>

      <!-- 종목 검색/선택 -->
      <UiFormField
        label="종목"
        required
        :error="errors.stockCode"
        :hint="form.type === 'BUY' ? '종목명 또는 코드로 검색하세요' : '보유 중인 종목만 매도할 수 있습니다.'"
      >
        <TradeStockSearch
          v-if="form.type === 'BUY'"
          ref="stockSearchRef"
          :account-currency="selectedAccountCurrency"
          @select="onStockSelect"
        />
        <TradeHoldingSelect
          v-else
          ref="stockSearchRef"
          :account-id="form.accountId"
          :stocks="accountHoldings"
          @select="onStockSelect"
        />
      </UiFormField>

      <!-- 단가 -->
      <UiFormField
        label="단가"
        required
        :error="errors.price"
        hint="단가를 입력하세요."
      >
        <UiInput
          v-model="form.price"
          type="text"
          inputmode="decimal"
          placeholder="0"
          class="w-full"
        />
      </UiFormField>

      <!-- 수량 -->
      <UiFormField
        label="수량"
        required
        :error="errors.quantity || (quantityExceedsHolding ? `보유수량(${maxQuantity}주)을 초과할 수 없습니다.` : '')"
        :hint="form.type === 'SELL' && form.stockCode ? `보유수량 ${maxQuantity}주까지 매도할 수 있습니다.` : undefined"
      >
        <UiInput
          v-model="form.quantity"
          type="number"
          min="0"
          :max="maxQuantity ?? undefined"
          :step="form.market === 'KR' ? '1' : 'any'"
          placeholder="0"
          class="w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </UiFormField>

      <!-- 같은 날짜 내 순서 -->
      <UiFormField
        label="같은 날짜 내 순서"
        hint="같은 거래일에 여러 건이 있을 때 처리 순서를 정합니다. 숫자가 낮을수록 먼저 처리됩니다."
      >
        <UiInput
          v-model="form.sequence"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          class="w-full"
        />
      </UiFormField>

      <!-- 매수/매도 이유 -->
      <UiFormField :label="form.type === 'BUY' ? '매수 이유' : '매도 이유'">
        <UiTextarea
          v-model="form.memo"
          rows="2"
          placeholder="이유를 입력하세요 (선택)"
        />
      </UiFormField>

      <p v-if="tradesStore.error" class="text-xs text-destructive">
        {{ tradesStore.error }}
      </p>

      <!-- 버튼 -->
      <div class="flex gap-2 pt-1">
        <UiButton variant="secondary" @click="emit('update:open', false)">
          취소
        </UiButton>
        <UiButton
          type="submit"
          :disabled="!isFormValid || tradesStore.loading"
        >
          {{ tradesStore.loading ? '저장 중...' : editTrade ? '수정' : '저장' }}
        </UiButton>
      </div>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
import type { Stock, Trade } from '~/types'
import type { HoldingOption } from './HoldingSelect.vue'

interface Props {
  open: boolean
  defaultDate?: string | null
  editTrade?: Trade
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const tradesStore = useTradesStore()
const accountsStore = useAccountsStore()
const stockSearchRef = ref<{ reset: () => void; setStock: (stock: Stock) => void } | null>(null)

const selectedAccountCurrency = computed(() => {
  const acc = accountsStore.items.find(a => a.id === form.accountId)
  return acc?.currency ?? null
})

// 매도 시 선택 가능한 보유 종목 목록.
// 수정 중인 거래 자신은 제외하고, "이 거래가 저장될 시점"(거래일·순서) 이전/동시의
// 거래만으로 FIFO를 계산해 실제 그 시점에 보유했던 수량을 기준으로 판단한다.
const accountHoldings = computed(() => {
  if (form.type !== 'SELL' || !form.accountId) return []

  const targetDate = form.date
  const targetSequence = Number(form.sequence) || 0

  const trades = tradesStore.items.filter((t) => {
    if (props.editTrade && t.id === props.editTrade.id) return false
    if (t.tradeDate !== targetDate) return t.tradeDate < targetDate
    return t.sequence <= targetSequence
  })

  const positions = buildFifoPositions(trades)
  const holdings: HoldingOption[] = []

  for (const pos of positions.values()) {
    if (pos.accountId !== form.accountId) continue
    const quantity = lotsQty(pos.lots)
    if (quantity <= 0) continue
    holdings.push({
      code: pos.stockCode,
      name: pos.stockName,
      market: pos.market,
      exchange: pos.exchange,
      currency: pos.currency,
      quantity,
      avgPrice: lotsCost(pos.lots) / quantity,
    })
  }
  return holdings
})

const maxQuantity = computed(() => {
  if (form.type !== 'SELL') return null
  return accountHoldings.value.find(h => h.code === form.stockCode && h.market === form.market)?.quantity ?? 0
})

const today = todayKST()

function emptyForm() {
  return {
    type: 'BUY' as 'BUY' | 'SELL',
    date: props.defaultDate ?? today,
    accountId: '',
    stockName: '',
    stockCode: '',
    market: '' as 'KR' | 'US' | '',
    exchange: undefined as 'KOSPI' | 'KOSDAQ' | undefined,
    currency: '' as 'KRW' | 'USD' | '',
    price: '',
    quantity: '',
    sequence: '0',
    memo: '',
  }
}

const form = reactive(emptyForm())

const errors = reactive({
  date: '',
  accountId: '',
  stockCode: '',
  price: '',
  quantity: '',
})

// 국내 종목은 정수 수량만 허용, 해외 종목은 소수(fractional shares) 허용
function isQuantityFormatValid(quantity: string, market: 'KR' | 'US' | ''): boolean {
  const n = Number(quantity)
  if (!(n > 0)) return false
  return market === 'KR' ? Number.isInteger(n) : true
}

const isFormValid = computed(() =>
  form.date !== '' &&
  form.accountId !== '' &&
  form.stockCode !== '' &&
  Number(form.price) > 0 &&
  form.quantity !== '' &&
  isQuantityFormatValid(form.quantity, form.market) &&
  !quantityExceedsHolding.value,
)

const isEditMode = computed(() => !!props.editTrade)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    Object.assign(errors, { date: '', accountId: '', stockCode: '', price: '', quantity: '' })
    tradesStore.clearError()

    if (props.editTrade) {
      Object.assign(form, {
        type: props.editTrade.type,
        date: props.editTrade.tradeDate,
        accountId: props.editTrade.accountId,
        stockName: props.editTrade.stockName,
        stockCode: props.editTrade.stockCode,
        market: props.editTrade.market,
        exchange: props.editTrade.exchange,
        currency: props.editTrade.currency,
        price: String(props.editTrade.price),
        quantity: String(props.editTrade.quantity),
        sequence: String(props.editTrade.sequence ?? 0),
        memo: props.editTrade.memo ?? '',
      })
      nextTick(() => {
        stockSearchRef.value?.setStock({
          code: props.editTrade!.stockCode,
          name: props.editTrade!.stockName,
          market: props.editTrade!.market,
          exchange: props.editTrade!.exchange,
          currency: props.editTrade!.currency,
          price: props.editTrade!.price,
        })
      })
    } else {
      Object.assign(form, emptyForm())
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

function resetStockFields() {
  form.stockName = ''
  form.stockCode = ''
  form.market = ''
  form.exchange = undefined
  form.currency = ''
  form.price = ''
  form.quantity = ''
  errors.stockCode = ''
  errors.quantity = ''
}

// 계좌 변경 시: 계좌가 다르면 보유 종목/매수 가능 종목이 달라지므로 선택을 초기화
watch(
  () => form.accountId,
  () => {
    if (isEditMode.value) return
    resetStockFields()
  },
)

// 거래 유형 변경 시: 매수 검색 목록과 매도 보유 목록이 다르므로 선택을 초기화
watch(
  () => form.type,
  () => {
    if (isEditMode.value) return
    resetStockFields()
  },
)

// 매도 시 입력한 수량이 보유수량을 초과하면 실시간으로 에러 표시 + 저장 버튼 비활성화
const quantityExceedsHolding = computed(() => {
  if (form.type !== 'SELL' || form.quantity === '') return false
  return Number(form.quantity) > (maxQuantity.value ?? 0)
})

function onStockSelect(stock: { code: string; name: string; market: 'KR' | 'US'; exchange?: 'KOSPI' | 'KOSDAQ'; currency: 'KRW' | 'USD'; price: number }) {
  form.stockName = stock.name
  form.stockCode = stock.code
  form.market = stock.market
  form.exchange = stock.exchange
  form.currency = stock.currency
  form.price = stock.price > 0 ? String(stock.price) : ''
  errors.stockCode = ''
}

function validate(): boolean {
  errors.date = form.date ? '' : '거래일을 선택하세요.'
  errors.accountId = form.accountId ? '' : '계좌를 선택하세요.'
  errors.stockCode = form.stockCode ? '' : '종목을 선택하세요.'
  errors.price = Number(form.price) > 0 ? '' : '단가를 입력하세요.'

  const quantityFormatError = form.market === 'KR' ? '국내 종목은 정수 수량만 입력할 수 있습니다.' : '수량을 입력하세요.'

  if (form.type === 'SELL') {
    const max = maxQuantity.value ?? 0
    errors.quantity = form.quantity && isQuantityFormatValid(form.quantity, form.market) && Number(form.quantity) <= max
      ? ''
      : (isQuantityFormatValid(form.quantity, form.market) ? `수량을 1~${max} 이하로 입력하세요.` : quantityFormatError)
  } else {
    errors.quantity = form.quantity && isQuantityFormatValid(form.quantity, form.market) ? '' : quantityFormatError
  }

  return Object.values(errors).every((e) => e === '')
}

async function handleSubmit() {
  if (!validate()) return

  const payload = {
    accountId: form.accountId,
    type: form.type,
    stockCode: form.stockCode,
    stockName: form.stockName,
    market: form.market as 'KR' | 'US',
    exchange: form.exchange,
    currency: form.currency as 'KRW' | 'USD',
    price: Number(form.price),
    quantity: Number(form.quantity),
    tradeDate: form.date,
    sequence: Number(form.sequence) || 0,
    memo: form.memo || undefined,
  }

  const result = props.editTrade
    ? await tradesStore.update(props.editTrade.id, payload)
    : await tradesStore.add(payload)

  if (result) {
    emit('saved')
    emit('update:open', false)
  }
}
</script>
