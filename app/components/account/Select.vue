<template>
  <div>
    <!-- 트리거 버튼 -->
    <button
      ref="triggerRef"
      type="button"
      class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      @click="toggleDropdown"
    >
      <span
        :class="selectedAccount ? 'text-foreground' : 'text-muted-foreground'"
      >
        {{
          selectedAccount ? selectedAccount.displayName : "계좌를 선택하세요"
        }}
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
        <!-- 계좌 목록 -->
        <ul class="max-h-52 overflow-auto py-1">
          <li
            v-if="accounts.length === 0"
            class="px-3 py-2.5 text-sm text-muted-foreground"
          >
            등록된 계좌가 없습니다.
          </li>
          <li
            v-for="acc in accounts"
            :key="acc.id"
            class="cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-accent"
            :class="modelValue === acc.id ? 'bg-accent/60 font-medium' : ''"
            @click="selectAccount(acc)"
          >
            {{ acc.displayName }}
          </li>
        </ul>

        <!-- 구분선 + 계좌 추가 버튼 -->
        <div class="border-t">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
            @click="openAddModal"
          >
            <Plus class="h-4 w-4" />
            계좌 추가
          </button>
        </div>
      </div>
    </Teleport>

    <!-- 계좌 추가 모달 -->
    <AccountAddModal v-model:open="addModalOpen" @added="onAccountAdded" />
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, Plus } from "@lucide/vue";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [id: string] }>();

const accountsStore = useAccountsStore()

type AccountOption = { id: string; displayName: string }

const accounts = computed<AccountOption[]>(() =>
  accountsStore.items.map(a => {
    const num = a.accountNumber ? ` · ${a.accountNumber}` : ''
    return { id: a.id, displayName: `${a.alias}${num} (${a.brokerName})` }
  })
)

onMounted(() => accountsStore.fetchAll())

const isOpen = ref(false);
const addModalOpen = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const dropdownStyle = reactive({ top: "0px", left: "0px", width: "0px" });

const selectedAccount = computed(
  () => accounts.value.find((a) => a.id === props.modelValue) ?? null,
);

function toggleDropdown() {
  if (!isOpen.value) {
    if (triggerRef.value) {
      const rect = triggerRef.value.getBoundingClientRect();
      dropdownStyle.top = `${rect.bottom + 4}px`;
      dropdownStyle.left = `${rect.left}px`;
      dropdownStyle.width = `${rect.width}px`;
    }
    isOpen.value = true;
  } else {
    isOpen.value = false;
  }
}

function selectAccount(acc: AccountOption) {
  emit("update:modelValue", acc.id);
  isOpen.value = false;
}

function openAddModal() {
  isOpen.value = false;
  nextTick(() => {
    addModalOpen.value = true;
  });
}

function onAccountAdded(id: string) {
  emit("update:modelValue", id);
}
</script>
