<template>
  <div
    class="rounded-lg border bg-card text-card-foreground shadow-sm"
    :class="compact ? 'p-3' : 'p-5'"
  >
    <p
      class="font-medium text-muted-foreground uppercase tracking-wide"
      :class="compact ? 'mb-0.5 text-[10px]' : 'mb-1 text-xs'"
    >
      {{ title }}
    </p>
    <p
      class="font-bold tracking-tight"
      :class="[compact ? 'text-sm' : 'text-2xl', valueColorClass]"
    >
      {{ value }}
    </p>
    <p v-if="subValue" class="mt-1 font-medium" :class="[compact ? 'text-[11px]' : 'text-sm', subValueColorClass]">
      {{ subValue }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string
  subValue?: string
  trend?: 'positive' | 'negative' | 'neutral'
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trend: 'neutral',
  compact: false,
})

const valueColorClass = computed(() => ({
  'text-red-500': props.trend === 'positive',
  'text-blue-500': props.trend === 'negative',
  'text-foreground': props.trend === 'neutral',
}))

const subValueColorClass = computed(() => ({
  'text-red-500': props.trend === 'positive',
  'text-blue-500': props.trend === 'negative',
  'text-muted-foreground': props.trend === 'neutral',
}))
</script>
