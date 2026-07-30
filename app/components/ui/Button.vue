<template>
  <button
    :type="type"
    :disabled="disabled"
    class="flex-1 rounded-md py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :class="variantClass"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "destructive";
    type?: "button" | "submit";
    disabled?: boolean;
  }>(),
  { variant: "primary", type: "button", disabled: false },
);

const VARIANT_CLASSES = {
  primary: "font-semibold bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "font-medium border border-input bg-background text-foreground hover:bg-accent",
  destructive:
    "font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90",
} as const;

const variantClass = computed(() => VARIANT_CLASSES[props.variant]);
</script>
