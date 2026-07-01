<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium leading-none">
      {{ label }}
      <span v-if="required" class="ml-0.5 text-destructive">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
  error?: string
  hint?: string
}>()
</script>
