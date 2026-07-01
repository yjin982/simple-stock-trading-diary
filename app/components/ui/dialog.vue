<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <!-- 배경 오버레이 -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="emit('update:open', false)"
        />

        <!-- 패널 컨테이너: 모바일 하단 / 데스크탑 중앙 -->
        <div class="pointer-events-none relative flex h-full items-end justify-center sm:items-center sm:p-4">
          <div
            class="pointer-events-auto flex w-full max-h-[90svh] flex-col rounded-t-xl bg-background shadow-xl sm:max-h-[85vh] sm:max-w-lg sm:rounded-xl"
          >
            <!-- 헤더 -->
            <div class="flex shrink-0 items-center justify-between border-b px-5 py-4">
              <h2 class="text-base font-semibold">{{ title }}</h2>
              <button
                class="rounded-md p-1.5 hover:bg-accent transition-colors"
                aria-label="닫기"
                @click="emit('update:open', false)"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- 콘텐츠 슬롯 -->
            <div class="flex-1 overflow-y-auto">
              <slot />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
