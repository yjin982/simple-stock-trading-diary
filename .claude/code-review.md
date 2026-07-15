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
| **포트폴리오 비중 차트** | `chart.js` + `vue-chartjs` 도넛 차트. Chart1(국내/해외 종목 수 기준) 클릭 시 Chart2(종목별 평가금액 기준) 필터링 | ✅ 완료 |

#### 낮음
| 기능 | 설명 |
|------|------|
| **목표 수익률 달성 강조** | 보유 종목 수익률이 설정값 초과 시 UI 강조 표시 → `stock_settings` 테이블 필요 |
| **종목 메모** | 종목별 자유 메모 저장 → `stock_settings` 테이블 필요 |

---

## 4. DB 설계 검토 사항

### `stock_settings` 테이블 (종목 메모 + 목표 수익률 통합)

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

**구현 순서** (테이블 생성 후):
1. ✅ Supabase 대시보드에서 테이블 생성 + RLS 적용
2. 기존 trades 데이터에서 stock_settings 초기 데이터 수동 삽입 (아래 SQL)
3. `app/types/index.ts`에 `StockSetting` 인터페이스 추가
4. `app/stores/stockSettings.ts` Pinia 스토어 추가 (`fetchByCode` / `upsertMeta` / `updateSettings`)
5. `app/stores/trades.ts` `add()` 함수 — trade 저장 성공 후 `stockSettingsStore.upsertMeta()` 호출 (ON CONFLICT DO NOTHING → 기존 설정 보호)
6. `app/pages/holdings/[stockCode].vue` — 메모 편집 textarea + 목표 수익률 number input 카드 추가
7. `app/pages/holdings/index.vue` — `pnlRate >= targetRate` 조건으로 수익률 셀 강조 표시

> **`trades.update()`에는 upsert 불필요**: 편집 시 종목 자체는 변경하지 않으므로 stock_settings에 영향 없음.

### 기존 데이터 초기 삽입 SQL

Supabase SQL 에디터에서 실행. `trades` 테이블의 기존 거래 이력에서 중복 없이 종목별 레코드를 생성:

```sql
-- trades 이력 기반으로 stock_settings 초기 데이터 생성
-- 이미 존재하는 (user_id, stock_code, market) 조합은 건너뜀
INSERT INTO stock_settings (user_id, stock_code, stock_name, market)
SELECT DISTINCT
  user_id,
  stock_code,
  stock_name,
  market
FROM trades
ON CONFLICT (user_id, stock_code, market) DO NOTHING;
```

특정 종목만 개별 삽입하거나 memo/target_rate를 함께 설정할 경우:

```sql
INSERT INTO stock_settings (user_id, stock_code, stock_name, market, memo, target_rate)
VALUES (
  auth.uid(),          -- 또는 실제 user_id UUID
  '005930',            -- 종목코드
  '삼성전자',           -- 종목명
  'KR',                -- 'KR' 또는 'US'
  '장기 보유 목표',     -- 메모 (없으면 NULL)
  20.00                -- 목표 수익률 % (없으면 NULL)
)
ON CONFLICT (user_id, stock_code, market)
DO UPDATE SET
  memo = EXCLUDED.memo,
  target_rate = EXCLUDED.target_rate,
  updated_at = NOW();
```
