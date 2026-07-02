<template>
  <UiDialog :open="open" title="계좌 추가" @update:open="emit('update:open', $event)">
    <form class="space-y-4 p-5 pb-6" @submit.prevent="handleSubmit">
      <!-- 증권사 -->
      <UiFormField label="증권사" required :error="errors.broker">
        <input
          v-model="form.broker"
          type="text"
          placeholder="예: 한국투자증권, 키움증권"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </UiFormField>

      <!-- 계좌 별칭 -->
      <UiFormField label="계좌 별칭" required :error="errors.alias">
        <input
          v-model="form.alias"
          type="text"
          placeholder="예: ISA계좌, 일반위탁"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </UiFormField>

      <!-- 계좌번호 (선택) -->
      <UiFormField label="계좌번호" hint="선택 입력">
        <input
          v-model="form.accountNumber"
          type="text"
          placeholder="예: 1234-5678"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          class="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          추가
        </button>
      </div>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
import type { NewAccount } from '~/types'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  added: [account: NewAccount]
}>()

const form = reactive({ broker: '', alias: '', accountNumber: '' })
const errors = reactive({ broker: '', alias: '' })

watch(
  () => props.open,
  (isOpen) => { if (isOpen) reset() },
)

function reset() {
  Object.assign(form, { broker: '', alias: '', accountNumber: '' })
  Object.assign(errors, { broker: '', alias: '' })
}

function validate(): boolean {
  errors.broker = form.broker.trim() ? '' : '증권사를 입력하세요.'
  errors.alias = form.alias.trim() ? '' : '계좌 별칭을 입력하세요.'
  return !errors.broker && !errors.alias
}

function handleSubmit() {
  if (!validate()) return

  const displayName = form.accountNumber
    ? `${form.alias} · ${form.accountNumber} (${form.broker})`
    : `${form.alias} (${form.broker})`

  emit('added', {
    id: crypto.randomUUID(),
    displayName,
    broker: form.broker.trim(),
    alias: form.alias.trim(),
    accountNumber: form.accountNumber.trim(),
  })

  reset()
  emit('update:open', false)
}
</script>
