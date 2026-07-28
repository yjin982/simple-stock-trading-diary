<template>
  <p class="text-xs text-muted-foreground">
    현재가는 약 15~20분 지연된 데이터입니다
    <span v-if="formattedTime">· 기준 {{ formattedTime }}</span>
    <span v-if="usdKrw">· 환율 ₩{{ Math.round(usdKrw).toLocaleString('ko-KR') }}</span>
  </p>
</template>

<script setup lang="ts">
const props = defineProps<{ time?: string | null }>()

const formattedTime = computed(() => {
  if (!props.time) return null
  return new Date(props.time).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const { usdKrw } = useExchangeRate()
</script>
