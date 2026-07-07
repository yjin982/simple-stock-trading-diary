<template>
  <UiDialog
    :open="open"
    :title="isEdit ? '계좌 수정' : '계좌 추가'"
    @update:open="emit('update:open', $event)"
  >
    <form class="space-y-4 p-5 pb-6" @submit.prevent="handleSubmit">
      <!-- 증권사 -->
      <UiFormField label="증권사" required :error="errors.brokerName">
        <input
          v-model="form.brokerName"
          type="text"
          placeholder="예: 키움증권, 토스증권"
          class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </UiFormField>

      <!-- 계좌 별칭 -->
      <UiFormField label="계좌 별칭" required :error="errors.alias">
        <input
          v-model="form.alias"
          type="text"
          placeholder="예: ISA계좌, 연금저축펀드"
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

      <!-- 통화 -->
      <UiFormField label="주거래 통화" required>
        <div class="flex gap-2">
          <button
            v-for="opt in currencyOptions"
            :key="opt.value"
            type="button"
            class="flex-1 rounded-md border py-1.5 text-sm font-medium transition-colors"
            :class="
              form.currency === opt.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-foreground hover:bg-accent'
            "
            @click="form.currency = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </UiFormField>

      <p v-if="accountsStore.error" class="text-xs text-destructive">
        {{ accountsStore.error }}
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
          :disabled="accountsStore.loading"
          class="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {{ accountsStore.loading ? "저장 중..." : isEdit ? "수정" : "추가" }}
        </button>
      </div>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
import type { Account } from "~/types";

const props = defineProps<{
  open: boolean;
  editAccount?: Account;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  added: [id: string];
}>();

const accountsStore = useAccountsStore();

const isEdit = computed(() => !!props.editAccount);

const currencyOptions = [
  { label: "KRW", value: "KRW" as const },
  { label: "USD", value: "USD" as const },
  { label: "KRW+USD", value: "BOTH" as const },
];

const form = reactive({
  brokerName: "",
  alias: "",
  accountNumber: "",
  currency: "KRW" as "KRW" | "USD" | "BOTH",
});

const errors = reactive({ brokerName: "", alias: "" });

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    if (props.editAccount) {
      form.brokerName = props.editAccount.brokerName;
      form.alias = props.editAccount.alias;
      form.accountNumber = props.editAccount.accountNumber ?? "";
      form.currency = props.editAccount.currency;
    } else {
      form.brokerName = "";
      form.alias = "";
      form.accountNumber = "";
      form.currency = "KRW";
    }
    errors.brokerName = "";
    errors.alias = "";
  },
);

function validate(): boolean {
  errors.brokerName = form.brokerName.trim() ? "" : "증권사를 입력하세요.";
  errors.alias = form.alias.trim() ? "" : "계좌 별칭을 입력하세요.";
  return !errors.brokerName && !errors.alias;
}

async function handleSubmit() {
  if (!validate()) return;

  if (isEdit.value && props.editAccount) {
    await accountsStore.update(props.editAccount.id, {
      brokerName: form.brokerName.trim(),
      alias: form.alias.trim(),
      accountNumber: form.accountNumber.trim(),
      currency: form.currency,
    });
    if (!accountsStore.error) emit("update:open", false);
  } else {
    const account = await accountsStore.add({
      brokerName: form.brokerName.trim(),
      alias: form.alias.trim(),
      accountNumber: form.accountNumber.trim() || undefined,
      currency: form.currency,
    });
    if (account) {
      emit("added", account.id);
      emit("update:open", false);
    }
  }
}
</script>
