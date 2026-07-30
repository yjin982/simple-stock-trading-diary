<template>
  <section class="p-5 border rounded-lg shadow-sm bg-card text-card-foreground">
    <h2 class="mb-4 text-sm font-semibold">종목 설정</h2>
    <div class="space-y-4">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-muted-foreground">목표 수익률</label>
        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5">
            <input
              v-model="settingsForm.targetRate"
              type="number"
              step="0.1"
              min="0"
              max="9999"
              placeholder="예: 20.0"
              class="px-3 text-sm border rounded-md shadow-sm h-9 w-28 border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span class="text-sm text-muted-foreground">%</span>
          </div>
          <span
            v-if="isTargetReached"
            class="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
          >
            🎯 목표 달성!
          </span>
        </div>
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-muted-foreground">종목 메모</label>
        <UiTextarea
          v-model="settingsForm.memo"
          rows="3"
          maxlength="500"
          placeholder="이 종목에 대한 메모를 입력하세요."
        />
        <p class="mt-0.5 text-right text-[10px] text-muted-foreground">
          {{ (settingsForm.memo ?? '').length }}/500
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          :disabled="saving"
          @click="emit('save')"
        >
          {{ saving ? '저장 중...' : '저장' }}
        </button>
        <span v-if="saved" class="text-xs text-muted-foreground">저장되었습니다.</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  settingsForm: { memo: string; targetRate: string }
  saving: boolean
  saved: boolean
  isTargetReached: boolean
}>()

const emit = defineEmits<{ save: [] }>()
</script>
