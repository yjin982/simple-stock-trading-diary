<template>
  <div class="flex rounded-md border bg-card p-0.5">
    <button
      v-for="option in options"
      :key="option.value"
      class="rounded px-3 py-1.5 text-sm font-medium transition-colors"
      :class="modelValue === option.value
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground'"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
defineProps<{
  options: { label: string; value: T }[]
  modelValue: T
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>
