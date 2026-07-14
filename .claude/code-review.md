# 프로젝트 코드 리뷰 보고서

## 1. 삭제 항목

| 파일 | 항목 | 상태 |
|------|------|------|
| `app/pages/accounts/index.vue` | `pricesLoading` 미사용 변수 | ✅ 완료 |
| `app/composables/useSummary.ts` | `export type Summary` 불필요한 export | ✅ 완료 |
| `app/lib/dummy-data.ts` | 더미 데이터 파일 전체 | ✅ 완료 |

---

## 2. 리팩토링 항목

| 항목 | 내용 | 상태 |
|------|------|------|
| **2-A** `currencyClass` 중복 함수 | `utils/format.ts`로 이동, 두 pages에서 제거 | ✅ 완료 |
| **2-B** `TradeItem.reason` → `TradeItem.memo` | types, store, 컴포넌트 전체 통일 | ✅ 완료 |
| **2-C** `accounts.ts update()` 반환 타입 | `Promise<Account \| null>` 명시 | ✅ 완료 |

---

## 3. 기능 추가 제안

### 완료
| 기능 | 내용 | 상태 |
|------|------|------|
| 파비콘 / 로고 적용 | `nuxt.config.ts` head 설정, 로그인 화면 로고 | ✅ 완료 |
| 거래 캘린더 이전 | `index.vue` → `trades.vue` 캘린더 탭으로 이전 | ✅ 완료 |
| 캘린더 탭 월 요약 카드 | 월별 매수/매도 금액 집계 | ✅ 완료 |
| 캘린더 탭 수정/삭제 | 선택일 거래 내역에서 수정·삭제 가능 | ✅ 완료 |
| 매매내역 탭 구조 개편 | 내역/캘린더 탭 분리, 언더라인 스타일 | ✅ 완료 |

### 미완료 (우선순위 순)

#### 높음
| 기능 | 설명 |
|------|------|
| **기간별 실현손익 복원** | `trades.vue` 기간 요약 카드의 실현손익이 더미 데이터 의존으로 제거됨. `computeRealizedPnl`에 `startDate/endDate` 파라미터 추가하여 FIFO 전체 이력 기준으로 기간 내 매도 손익만 집계하는 방식으로 재구현 필요 |
| **매매 이력 필터 확장** | `trades.vue` 내역 탭에 종목별/계좌별 필터 추가. `filteredDateGroups` computed에서 추가 필터링으로 구현 가능 |

#### 중간
| 기능 | 설명 |
|------|------|
| **CSV 내보내기** | 매매 이력을 CSV로 다운로드. `filteredDateGroups` 데이터 활용 |
| **포트폴리오 비중 차트** | 보유 종목별 평가금액 파이 차트. `allHoldings` 데이터를 vue-chartjs로 시각화 |

#### 낮음
| 기능 | 설명 |
|------|------|
| **목표 수익률 달성 강조** | 보유 종목 수익률이 설정값 초과 시 UI 강조 표시 |
| **종목 메모** | 종목별 자유 메모 저장 (별도 DB 테이블 필요) |
