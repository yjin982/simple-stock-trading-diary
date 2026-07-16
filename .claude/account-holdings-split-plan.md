# 계좌별 보유 종목 분리 계산 및 UI 개선

## Context

현재 `buildFifoPositions()`는 맵 키로 `stockCode`만 사용하기 때문에 같은 종목을 두 개 이상의 계좌에서 보유하고 있으면 하나로 합산된다. 이로 인해 보유수량/평균단가/평가손익/수익률이 계좌별로 다른데도 한 줄로만 표시된다. 키를 `${accountId}|${stockCode}` 복합키로 바꿔 계좌별로 분리 계산하고, UI에서는 종목 셀을 rowspan으로 합치고 계좌별 행을 렌더링한다.

---

## 작업 순서

### 1. `app/utils/calc.ts`

**`FifoPosition` 타입에 accountId 추가**
```ts
export type FifoPosition = {
  accountId: string
  accountName?: string
  stockCode: string
  // ...나머지 동일
}
```

**`buildFifoPositions()` 키 변경**
- 기존: `t.stockCode`
- 변경: `const key = \`${t.accountId}|${t.stockCode}\``
- 초기 position 생성 시 `accountId`, `accountName` 포함
- BUY/SELL 로직 내 `.has()`, `.set()`, `.get()` 모두 composite key 사용

> `computeRealizedPnl()`는 변경 안 함 (전체 포트폴리오 합산 전용)

### 2. `app/types/index.ts`

```ts
export interface Holding {
  accountId: string
  accountName?: string
  // ...나머지 동일
}
```

### 3. `app/composables/useHoldings.ts`

- yahooSymbols 중복 제거 (Set dedup — 같은 종목을 여러 계좌가 보유해도 symbol은 하나)
- Holding 생성 시 `accountId`, `accountName` 포함

### 4. `app/pages/holdings/index.vue`

- `HoldingGroup` 타입 + `groupedHoldings` computed (stockCode별 묶음, 집계 stats 포함)
- `sortedGroups` computed (기존 `sortedHoldings` 대체, 그룹 단위 정렬)
- 요약 카드: "보유 종목 N개" → `groupedHoldings.length` / `avgRate` → 그룹 기반 계산
- 테이블: `<template v-for="group">` + `<tr v-for="(h, i) in group.rows">`, 종목 셀 `v-if="i===0" :rowspan="group.rows.length"`, 계좌 컬럼 추가

### 5. `app/components/home/HoldingsTable.vue`

- holdings 페이지와 동일한 grouping computed 내부 구현
- 계좌 컬럼 추가, rowspan 적용

### 6. `app/pages/holdings/[stockCode].vue`

- `holding` (단수) → `holdings` (배열, filter로 변경)
- 빈 상태: `holdings.length === 0`
- 요약 카드: `v-for="h in holdings"` + 다계좌 시 계좌명 헤더
- `isTargetReached`: `holdings.value.some(h => ...)`
- `watch` / `saveSettings`: `holdings.value[0]` 기준
- `HoldingsTradeHistory` currency: `holdings.value[0]?.currency`

---

## 알려진 제한사항 (범위 외)

`TradeHistory.vue`의 buyQueue는 stockCode만으로 필터링하므로 여러 계좌의 거래가 하나의 FIFO 큐에 섞임 → avgHoldingDays 부정확 가능. 별도 이슈로 분리.

---

## 검증

1. 같은 종목을 2개 이상 계좌에 보유한 상태에서:
   - `/holdings`: 종목 rowspan + 계좌별 수량/평균단가/손익 별도 표시
   - 홈 보유 종목 테이블도 동일
   - `/holdings/[stockCode]`: 계좌 수만큼 카드 그룹 표시
2. 단일 계좌 종목은 기존과 동일하게 표시
3. `/accounts` 페이지 계좌별 요약 정상 동작 확인
