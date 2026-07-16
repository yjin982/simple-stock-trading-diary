<template>
  <div
    class="flex flex-col items-center gap-3 text-center"
    :class="[card ? 'rounded-lg border bg-card shadow-sm' : '', py]"
  >
    <div class="rounded-full bg-muted p-3">
      <component :is="icon" class="h-5 w-5 text-muted-foreground" />
    </div>
    <div>
      <p class="text-sm font-medium">{{ title }}</p>
      <p class="mt-0.5 text-xs text-muted-foreground">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  icon: Component
  title: string
  description: string
  card?: boolean
  py?: string
}>(), {
  card: false,
  py: 'py-16',
})
</script>
