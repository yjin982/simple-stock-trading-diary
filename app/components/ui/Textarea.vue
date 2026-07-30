<template>
  <textarea
    :value="modelValue"
    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string }>();

const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>
