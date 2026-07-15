# 프로젝트 코드 리뷰 보고서

## 1. 삭제 항목

| 파일                            | 항목                                  | 상태    |
| ------------------------------- | ------------------------------------- | ------- |
| `app/pages/accounts/index.vue`  | `pricesLoading` 미사용 변수           | ✅ 완료 |
| `app/composables/useSummary.ts` | `export type Summary` 불필요한 export | ✅ 완료 |
| `app/lib/dummy-data.ts`         | 더미 데이터 파일 전체                 | ✅ 완료 |

---

## 2. 리팩토링 항목

| 항목                                          | 내용                                        | 상태    |
| --------------------------------------------- | ------------------------------------------- | ------- |
| **2-A** `currencyClass` 중복 함수             | `utils/format.ts`로 이동, 두 pages에서 제거 | ✅ 완료 |
| **2-B** `TradeItem.reason` → `TradeItem.memo` | types, store, 컴포넌트 전체 통일            | ✅ 완료 |
| **2-C** `accounts.ts update()` 반환 타입      | `Promise<Account \| null>` 명시             | ✅ 완료 |

---

## 3. 기능 추가

### 완료

| 기능                    | 내용                                                                                  | 상태    |
| ----------------------- | ------------------------------------------------------------------------------------- | ------- |
| 파비콘 / 로고 적용      | `nuxt.config.ts` head 설정, 로그인 화면 로고                                          | ✅ 완료 |
| 거래 캘린더 이전        | `index.vue` → `trades.vue` 캘린더 탭으로 이전                                         | ✅ 완료 |
| 캘린더 탭 월 요약 카드  | 월별 매수/매도 금액 집계                                                              | ✅ 완료 |
| 캘린더 탭 수정/삭제     | 선택일 거래 내역에서 수정·삭제 가능                                                   | ✅ 완료 |
| 매매내역 탭 구조 개편   | 내역/캘린더 탭 분리, 언더라인 스타일                                                  | ✅ 완료 |
| 포트폴리오 비중 차트    | `chart.js` + `vue-chartjs` 도넛 차트. Chart1(국내/해외) 클릭 시 Chart2(종목별) 필터링 | ✅ 완료 |
| 목표 수익률 + 종목 메모 | `stock_settings` 테이블 + 스토어. `/holdings/[stockCode]`에서 편집, 목록에서 🎯 뱃지  | ✅ 완료 |
| 종목 검색 KRX API 교체  | 공공데이터포털 → `data-dbg.krx.co.kr`. `ISU_ABBRV` 표시로 삼성전자/삼성전자우 구분    | ✅ 완료 |
| CSV 내보내기            | 매매이력 탭 내역 필터 기준 CSV 다운로드. UTF-8 BOM 포함 (Excel 한글 지원)             | ✅ 완료 |

### 미완료 (우선순위 순)

#### 높음

| 기능                     | 설명                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **기간별 실현손익 복원** | `trades.vue` 기간 요약 카드의 실현손익이 더미 데이터 의존으로 제거됨. `computeRealizedPnl`에 `startDate/endDate` 파라미터 추가하여 FIFO 전체 이력 기준으로 기간 내 매도 손익만 집계하는 방식으로 재구현 필요 |
| **매매 이력 필터 확장**  | `trades.vue` 내역 탭에 종목별/계좌별 필터 추가. `filteredDateGroups` computed에서 추가 필터링으로 구현 가능                                                                                                  |

---

## 4. DB 설계 검토 사항

### `stock_settings` 테이블 (종목 메모 + 목표 수익률 통합) ✅ 구현 완료

두 기능 모두 **종목 단위** 설정이므로 단일 테이블로 통합. 보유 포지션이 0이 돼도 설정이 남아야 하므로 `trades` JOIN에 의존하지 않고 `stock_name` 비정규화 저장.

```sql
CREATE TABLE stock_settings (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_code  TEXT         NOT NULL,
  stock_name  TEXT         NOT NULL,
  market      TEXT         NOT NULL CHECK (market IN ('KR', 'US')),
  memo        TEXT,                      -- 종목 메모 (nullable)
  target_rate NUMERIC(5,2),              -- 목표 수익률 % (nullable, 예: 20.00)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, stock_code, market)
);

ALTER TABLE stock_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON stock_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**UNIQUE 키**: `(user_id, stock_code, market)` — KR/US ticker 충돌 방지 및 market 기반 필터링 대응.

**구현 완료 목록**:

1. ✅ Supabase 대시보드에서 테이블 생성 + RLS 적용
2. ✅ 기존 trades 데이터에서 stock_settings 초기 데이터 수동 삽입
3. ✅ `app/types/index.ts` — `StockSetting` 인터페이스 추가
4. ✅ `app/stores/stockSettings.ts` — Pinia 스토어 (`fetchByCode` / `upsertMeta` / `updateSettings`)
5. ✅ `app/stores/trades.ts` — `add()` 함수에서 `stockSettingsStore.upsertMeta()` 호출
6. ✅ `app/pages/holdings/[stockCode].vue` — 메모 textarea + 목표 수익률 number input 카드
7. ✅ `app/pages/holdings/index.vue` — `pnlRate >= targetRate` 조건으로 🎯 뱃지 표시

### 종목 검색 KRX API 교체 ✅ 구현 완료

공공데이터포털(`apis.data.go.kr`) → KRX Open API(`data-dbg.krx.co.kr`)로 교체.

| 항목       | 변경 전                       | 변경 후                                           |
| ---------- | ----------------------------- | ------------------------------------------------- |
| 엔드포인트 | 공공데이터포털 `getItemInfo`  | `stk_isu_base_info` / `ksq_isu_base_info`         |
| 인증       | `serviceKey` 쿼리 파라미터    | `AUTH_KEY` 요청 헤더                              |
| 검색 방식  | 서버 `likeItmsNm` 필터        | 전체 목록 조회 후 서버 필터링                     |
| 표시명     | `itmsNm` (종목명)             | `ISU_ABBRV` (종목약명) — 삼성전자/삼성전자우 구분 |
| 캐시       | 1시간 (쿼리별)                | 12시간 (날짜별)                                   |
| 환경변수   | `NUXT_DATA_GO_KR_SERVICE_KEY` | `NUXT_KRX_AUTH_KEY`                               |

### CSV 내보내기 ✅ 구현 완료

- `app/utils/csv.ts` — CSV 생성 + Blob 다운로드 유틸리티
- `trades.vue` 내역 탭 필터 바 우측에 `↓ CSV` 버튼
- 현재 기간 필터 기준 데이터 내보내기 (0건 시 비활성화)
- 파일명: `매매이력_전체_날짜.csv` / `매매이력_시작일_종료일.csv`
- UTF-8 BOM 포함으로 Excel 한글 깨짐 방지
