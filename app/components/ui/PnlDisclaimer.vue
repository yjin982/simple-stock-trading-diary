<template>
  <p class="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
    <Info class="mt-0.5 h-3 w-3 shrink-0" />
    <span>
      손익은 수수료·세금·배당을 반영하지 않은 참고용 수치입니다.
      해외 주식의 원화 환산은 현재 환율 기준이며, 매수·매도 시점의 환율 차이(환차손익)는 포함하지 않습니다.
      세금 신고에는 증권사 자료를 이용하세요.
    </span>
  </p>
</template>

<script setup lang="ts">
// 수수료·세금·배당·거래 시점 환율은 사용자가 조회할 방법이 없어 계산하지 않기로 했다.
// 손익이 보이는 화면마다 이 범위를 알린다.
import { Info } from '@lucide/vue'
</script>
