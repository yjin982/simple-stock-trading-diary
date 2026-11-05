<template>
  <p
    v-if="message"
    class="rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
  >
    {{ message }}
  </p>
</template>

<script setup lang="ts">
// 현재가를 조회하지 못한 종목은 평균단가로 대신 계산되어(평가손익 0) 합계에 섞인다.
// 합계가 정상 값처럼 보이지 않도록 그 사실을 알린다.
const props = defineProps<{
  holdings: { priceAvailable: boolean }[]
  loading?: boolean
}>()

const message = computed(() => {
  // 시세를 처음 받아 오는 중에는 모든 종목이 미조회 상태라 안내를 띄우지 않는다.
  if (props.loading) return null
  const missing = props.holdings.filter(h => !h.priceAvailable).length
  if (missing === 0) return null
  if (missing === props.holdings.length) {
    return '현재가를 조회하지 못했습니다. 평가금액·평가손익은 평균단가 기준(손익 0)으로 계산되어 실제와 다릅니다.'
  }
  return '일부 종목의 현재가를 조회하지 못해, 평균단가로 대신 계산한 값이 합계에 포함되어 있습니다.'
})
</script>
