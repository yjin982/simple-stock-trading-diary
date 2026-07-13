<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h1 class="text-base font-semibold">포트폴리오 요약</h1>
      <button
        class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        @click="emit('open-modal')"
      >
        <Plus class="h-4 w-4" />
        매매이력 입력
      </button>
    </div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <UiCard title="총 평가금액" value="₩14,821,500" />
      <UiCard
        title="평가손익"
        value="+₩821,500"
        sub-value="+5.87%"
        trend="positive"
      />
      <UiCard
        title="실현손익"
        value="+₩1,234,000"
        sub-value="+10.28%"
        trend="positive"
      />
      <UiCard title="총 매수금액" value="₩14,000,000" />
      <UiCard
        title="총 수익률"
        value="+14.68%"
        trend="positive"
        class="col-span-2 sm:col-span-1"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue'

const emit = defineEmits<{ 'open-modal': [] }>()
</script>
