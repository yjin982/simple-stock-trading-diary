<template>
  <div class="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
    <p class="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {{ title }}
    </p>
    <p class="text-2xl font-bold tracking-tight" :class="valueColorClass">
      {{ value }}
    </p>
    <p v-if="subValue" class="mt-1 text-sm font-medium" :class="subValueColorClass">
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
}

const props = withDefaults(defineProps<Props>(), {
  trend: 'neutral',
})

const valueColorClass = computed(() => ({
  'text-emerald-600': props.trend === 'positive',
  'text-red-500': props.trend === 'negative',
  'text-foreground': props.trend === 'neutral',
}))

const subValueColorClass = computed(() => ({
  'text-emerald-600': props.trend === 'positive',
  'text-red-500': props.trend === 'negative',
  'text-muted-foreground': props.trend === 'neutral',
}))
</script>
