# 주식 매매 기록 웹앱 기획서

> Claude Code 전달용 기획서 | 작성일: 2026-06-30

---

## 1. 프로젝트 개요

### 목적

개인 주식 매매 내역을 기록하고, 계좌별·기간별 수익률을 한눈에 파악하는 웹앱.  
프론트엔드(Nuxt 3) 역량 중심의 포트폴리오 프로젝트.

### 개발 범위 (Phase 구분)

| Phase                   | 내용                                                        |
| ----------------------- | ----------------------------------------------------------- |
| **Phase 1** (현재 구현) | 로컬 저장(localStorage + Pinia) 기반. 로그인 없이 개인 사용 |
| Phase 2 (추후)          | Supabase 연동 + 회원가입/로그인, 데이터 클라우드 동기화     |

---

## 2. 기술 스택

| 분류          | 기술                        | 비고                                                                                      |
| ------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| 프레임워크    | Nuxt 3                      | SSR/SPA 혼용 가능                                                                         |
| 언어          | TypeScript                  | strict mode                                                                               |
| 상태관리      | Pinia                       | + pinia-plugin-persistedstate (localStorage 자동 동기화)                                  |
| 스타일        | Tailwind CSS                |                                                                                           |
| UI 컴포넌트   | shadcn-vue                  | 또는 PrimeVue                                                                             |
| 차트          | vue-chartjs (Chart.js 래퍼) | 수익률 시각화                                                                             |
| 주식 시세 API | `yahoo-finance2` (npm)      | Nuxt server routes에서 서버사이드 호출. API 키 불필요. 국내(종목코드.KS) + 미국 통합 지원 |
| 패키지 매니저 | pnpm                        |                                                                                           |

### yahoo-finance2 사용 방식

```
Nuxt server/api/quote/[symbol].get.ts
→ yahoo-finance2.quoteSummary(symbol) 호출
→ 클라이언트에 현재가 반환
```

- 국내 종목: `005930.KS` (삼성전자), `035720.KQ` (카카오)
- 미국 종목: `AAPL`, `TSLA`
- API 키 없음, 클라이언트에 노출 없음

---

## 3. 도메인 모델 (데이터 구조)

### 3-1. 증권사 (Broker)

```ts
interface Broker {
  id: string; // uuid
  name: string; // 예: "한국투자증권", "키움증권", "토스증권"
  createdAt: string;
}
```

### 3-2. 계좌 (Account)

```ts
interface Account {
  id: string;
  brokerId: string; // Broker.id 참조
  alias: string; // 계좌 별칭 (예: "ISA계좌", "일반위탁")
  accountNumber?: string; // 선택 입력
  currency: "KRW" | "USD" | "BOTH"; // 계좌의 주거래 통화
  createdAt: string;
}
```

### 3-3. 거래 내역 (Trade)

```ts
interface Trade {
  id: string;
  accountId: string; // Account.id 참조
  type: "BUY" | "SELL";
  stockCode: string; // 종목 코드 (예: 005930, AAPL)
  stockName: string; // 종목명 (예: 삼성전자, Apple Inc.)
  market: "KR" | "US"; // 국내/미국 구분
  currency: "KRW" | "USD";
  price: number; // 매매가
  quantity: number; // 수량
  fee?: number; // 수수료 (선택)
  tradeDate: string; // YYYY-MM-DD
  memo?: string;
  createdAt: string;
}
```

### 3-4. 보유 종목 (Holding) — 계산값, 저장하지 않음

```ts
// Trade 데이터로 런타임에 계산
interface Holding {
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  currency: "KRW" | "USD";
  quantity: number; // 잔여 수량
  avgPrice: number; // 평균 단가 (분할매수 고려)
  totalCost: number; // 총 매수 금액
  currentPrice?: number; // yahoo-finance2 조회값
  unrealizedPnL?: number; // 평가손익
  unrealizedPnLRate?: number; // 평가손익률(%)
}
```

### 수익률 계산 기준

- **실현 손익**: 매도 완료된 거래 기준 (매도가 - 평균단가) × 수량
- **평가 손익**: 현재 보유 수량 × (현재가 - 평균단가)
- **평균 단가**: 동일 종목 분할매수 시 가중평균 적용
  - 수식: `(기존보유수량 × 기존평균단가 + 신규수량 × 신규단가) / (기존수량 + 신규수량)`

---

## 4. 화면 구성

### 4-1. 페이지 목록

| 경로           | 페이지    | 설명                                   |
| -------------- | --------- | -------------------------------------- |
| `/`            | 대시보드  | 전체 요약, 보유 종목 현황, 수익률 차트 |
| `/trades`      | 거래 내역 | 전체 거래 목록, 필터/검색              |
| `/trades/new`  | 거래 입력 | 매수/매도 폼                           |
| `/trades/[id]` | 거래 상세 | 수정/삭제                              |
| `/accounts`    | 계좌 관리 | 증권사·계좌 등록 및 목록               |
| `/holdings`    | 보유 종목 | 현재 보유 종목 + 현재가 + 평가손익     |

---

### 4-2. 대시보드 (`/`)

**상단 요약 카드 (4개)**

- 총 매수 금액
- 실현 손익 (금액 + %)
- 평가 손익 (금액 + %)
- 총 손익 (실현 + 평가)

**기간 필터**

- 전체 / 이번 달 / 이번 주 / 오늘

**계좌 필터**

- 전체 / 증권사별 / 계좌별 드롭다운

**차트 (vue-chartjs)**

- 월별 실현 손익 바 차트
- 보유 종목 비중 파이 차트

---

### 4-3. 거래 입력 폼 (`/trades/new`)

**필드 목록**

| 필드      | 타입               | 필수 | 비고                                       |
| --------- | ------------------ | ---- | ------------------------------------------ |
| 거래 유형 | 버튼 토글          | ✅   | 매수 / 매도                                |
| 거래일    | date picker        | ✅   | 기본값: 오늘                               |
| 증권사    | select             | ✅   | 등록된 증권사 목록                         |
| 계좌      | select             | ✅   | 선택한 증권사의 계좌 목록                  |
| 시장      | 버튼 토글          | ✅   | 국내(KRW) / 미국(USD)                      |
| 종목 검색 | autocomplete input | ✅   | 종목명 또는 코드 입력 → `/api/search` 호출 |
| 종목명    | text (자동 완성)   | ✅   | 검색 선택 시 자동 입력                     |
| 종목 코드 | text (자동 완성)   | ✅   | 검색 선택 시 자동 입력                     |
| 매매가    | number             | ✅   | KRW: 정수, USD: 소수점 2자리               |
| 수량      | number             | ✅   | 정수                                       |
| 수수료    | number             | ❌   | 선택 입력                                  |
| 메모      | textarea           | ❌   |                                            |

**종목 검색 동작**

```
사용자 입력 (debounce 300ms)
→ GET /api/search?q={keyword}&market={KR|US}
→ yahoo-finance2.search() 호출
→ 결과 드롭다운 표시 (종목명 + 종목코드)
→ 선택 시 현재가 자동 조회 및 가격 필드 자동 입력 (수정 가능)
```

---

### 4-4. 거래 내역 (`/trades`)

**필터**

- 날짜 범위 (시작일 ~ 종료일)
- 거래 유형 (전체 / 매수 / 매도)
- 시장 (전체 / 국내 / 미국)
- 증권사 / 계좌

**테이블 컬럼**
거래일 | 종목명 | 유형 | 시장 | 계좌 | 매매가 | 수량 | 거래 금액 | 손익

---

### 4-5. 보유 종목 (`/holdings`)

**테이블 컬럼**
종목명 | 시장 | 계좌 | 보유수량 | 평균단가 | 현재가 | 평가금액 | 평가손익 | 손익률

- 현재가는 페이지 진입 시 `/api/quote/[symbol]` 일괄 조회
- 로딩 스피너 표시, 조회 실패 시 "-" 표시

---

### 4-6. 계좌 관리 (`/accounts`)

**증권사 섹션**

- 증권사 추가 (이름 입력)
- 증권사 목록 (삭제 가능, 연결된 계좌가 있으면 삭제 불가)

**계좌 섹션**

- 계좌 추가: 증권사 선택 → 별칭 입력 → 계좌번호 선택 입력
- 계좌 목록: 증권사별 그룹핑

---

## 5. Nuxt Server API 목록

| 메서드 | 경로                  | 기능                         |
| ------ | --------------------- | ---------------------------- |
| GET    | `/api/quote/[symbol]` | 단일 종목 현재가 조회        |
| GET    | `/api/search`         | 종목 검색 (query: q, market) |

```ts
// server/api/quote/[symbol].get.ts
import yahooFinance from "yahoo-finance2";

export default defineEventHandler(async (event) => {
  const symbol = getRouterParam(event, "symbol");
  const result = await yahooFinance.quote(symbol);
  return {
    price: result.regularMarketPrice,
    currency: result.currency,
    name: result.shortName,
  };
});
```

```ts
// server/api/search.get.ts
import yahooFinance from "yahoo-finance2";

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);
  const result = await yahooFinance.search(q as string);
  return result.quotes.slice(0, 10);
});
```

---

## 6. 상태 관리 (Pinia Stores)

```
stores/
  brokers.ts     # 증권사 목록 CRUD
  accounts.ts    # 계좌 목록 CRUD
  trades.ts      # 거래 내역 CRUD + 필터링
  holdings.ts    # 보유 종목 계산 (trades에서 파생)
  quotes.ts      # 시세 캐시 (5분 TTL)
```

**localStorage 영속화**

- `pinia-plugin-persistedstate` 사용
- `brokers`, `accounts`, `trades` store만 영속화
- `quotes` store는 영속화 안 함 (항상 fresh fetch)

---

## 7. 디렉토리 구조

```
├── assets/
├── components/
│   ├── ui/              # shadcn-vue 공통 컴포넌트
│   ├── trade/
│   │   ├── TradeForm.vue
│   │   ├── TradeTable.vue
│   │   └── StockSearch.vue
│   ├── account/
│   │   └── AccountCard.vue
│   ├── dashboard/
│   │   ├── SummaryCard.vue
│   │   ├── PnLChart.vue
│   │   └── HoldingsPieChart.vue
│   └── holdings/
│       └── HoldingsTable.vue
├── composables/
│   ├── useTradeCalc.ts   # 평균단가, 손익 계산 로직
│   ├── useStockSearch.ts # 종목 검색 debounce 처리
│   └── useQuote.ts       # 시세 조회 + 캐시
├── pages/
│   ├── index.vue         # 대시보드
│   ├── trades/
│   │   ├── index.vue
│   │   ├── new.vue
│   │   └── [id].vue
│   ├── accounts.vue
│   └── holdings.vue
├── server/
│   └── api/
│       ├── quote/[symbol].get.ts
│       └── search.get.ts
├── stores/
│   ├── brokers.ts
│   ├── accounts.ts
│   ├── trades.ts
│   ├── holdings.ts
│   └── quotes.ts
├── types/
│   └── index.ts          # 공통 타입 정의
└── utils/
    └── calc.ts            # 순수 계산 함수 (테스트 용이)
```

---

## 8. 구현 우선순위

### 1단계 — 핵심 기능 (MVP)

1. 타입 정의 (`types/index.ts`)
2. Pinia stores 셋업 + localStorage 영속화
3. 계좌 관리 페이지 (증권사/계좌 CRUD)
4. 거래 입력 폼 (종목 검색 제외, 직접 입력)
5. 거래 내역 목록 + 필터

### 2단계 — 시세 연동

6. Nuxt server routes (`/api/quote`, `/api/search`)
7. 종목 검색 자동완성 (`StockSearch.vue`)
8. 보유 종목 페이지 (현재가 + 평가손익)

### 3단계 — 대시보드 & 시각화

9. 손익 계산 composable (`useTradeCalc.ts`)
10. 대시보드 요약 카드
11. 차트 (월별 손익 바, 보유 비중 파이)

### 4단계 — 품질

12. 반응형 디자인 (모바일 대응)
13. 에러 핸들링 (시세 조회 실패, 유효성 검사)
14. 빈 상태(empty state) UI

---

## 9. 주요 비즈니스 로직 명세

### 평균 단가 계산

```
동일 계좌 + 동일 종목에 대해 매수 거래를 시간 순 누적 계산

avgPrice = Σ(매수가 × 수량) / Σ(매수수량)
단, 매도 발생 시 수량만 차감 (평균 단가 유지)
```

### 실현 손익 계산

```
매도 발생 시점의 평균 단가 기준

realizedPnL = (매도가 - 매도시점평균단가) × 매도수량 - 수수료
```

### 환율 처리

- 환율 환산은 Phase 1에서 제외
- KRW 계좌와 USD 계좌를 별도로 취급
- 대시보드 총합 표시 시 통화 구분하여 각각 합산

---

## 10. Phase 2 대비 설계 포인트

Phase 1에서 localStorage를 사용하더라도, 이후 Supabase로 전환이 쉽도록:

- Store의 CRUD 메서드 인터페이스를 추상화해서 구현
- 컴포넌트는 store 메서드만 호출, 저장 레이어를 직접 참조하지 않음
- `id` 필드는 처음부터 uuid 사용 (`crypto.randomUUID()`)
- Supabase 스키마는 위 도메인 모델과 1:1 대응 가능하도록 설계

---

## 11. 초기 설정 체크리스트 (Claude Code 실행 전 확인)

- [ ] `nuxt.config.ts` 에 모듈 추가 필요: `@pinia/nuxt`, `@nuxtjs/tailwindcss`, `shadcn-nuxt`
- [ ] `pinia-plugin-persistedstate` 설치 및 Nuxt 플러그인 등록
- [ ] `yahoo-finance2` 설치 (`pnpm add yahoo-finance2`)
- [ ] TypeScript strict mode 활성화 확인

---

_이 문서를 Claude Code에 전달하여 구현을 시작하세요._
_구현 순서는 8번 '구현 우선순위'의 단계를 따르세요._

---

## 12. 중간 점검 (2026-07-07)

### 현재 상태 요약

UI/UX 3페이지(홈, 거래 내역, 보유 종목)가 먼저 구현됨. 반응형 디자인·필터·정렬은 완성 상태.
단, **데이터 레이어가 전혀 없음** — Pinia 스토어가 비어 있고, 폼 제출은 console.log로만 끝남.
기획서 1단계(Pinia + localStorage)가 미완이고 3단계 UI가 먼저 구현된 역전 상태.

| 구분                                 | 상태                     |
| ------------------------------------ | ------------------------ |
| UI/UX (3 페이지)                     | ✅ 완료                  |
| 반응형·필터·정렬                     | ✅ 완료                  |
| Pinia 스토어 (5개)                   | ❌ 디렉토리만 존재       |
| localStorage 영속화                  | ❌ 미구현                |
| Server API (/api/quote, /api/search) | ❌ 미구현                |
| /accounts 페이지                     | ❌ 모달로만 부분 구현    |
| 차트 (vue-chartjs)                   | ❌ 패키지 설치만, 미사용 |
| 거래 수정/삭제                       | ❌ 미구현                |

### 남은 구현 우선순위 (재정의)

> localStorage 방식은 건너뛰고 **Supabase**를 데이터 레이어로 바로 사용. (→ 섹션 13 참고)

**P1 — Supabase 연동 + Pinia 스토어**

- `@nuxtjs/supabase` 설치 및 환경 설정
- Supabase에 테이블 생성 + RLS 설정 (brokers, accounts, trades)
- `stores/brokers.ts`, `stores/accounts.ts`, `stores/trades.ts` — Supabase CRUD
- `stores/holdings.ts` — trades에서 파생 계산 (가중평균 방식)
- `stores/quotes.ts` — 시세 캐시 (/api/quote 호출, Supabase 없음)
- 기존 `app/lib/dummy-data.ts` 제거, Supabase 더미 데이터로 대체

**P2 — 폼을 스토어에 연결**

- `trade/FormModal.vue` → `tradesStore.add()`
- `account/AddModal.vue` → `accountsStore.add()` / `brokersStore.add()`
- 로그인 페이지 + auth 미들웨어

**P3 — Server API + 종목 검색** (기획 2단계)

- `server/api/quote/[symbol].get.ts`, `server/api/search.get.ts`
- `composables/useStockSearch.ts` (debounce), `composables/useQuote.ts`

**P4 — /accounts 페이지**

- 증권사/계좌 CRUD 전용 페이지 (기획서 4-6 항목)

**P5 — 차트** (기획 3단계)

- 월별 실현 손익 바 차트, 보유 종목 비중 파이 차트 (홈 달력 아래에 추가)

### 정리/수정할 사항

- **손익 계산 방식 통일**: 현재 holdings는 FIFO 방식 → 기획서 기준 가중평균으로 통일
- **타입 리팩터**: 현재 `TradeItem`을 기획서 `Trade` 인터페이스에 맞춤 (fee 추가, reason 제거 등)

### 확정된 UX 결정

- 거래 입력: `/trades/new` 페이지 대신 **모달 유지**
- 홈 달력: 제거하지 않고 유지, **차트 섹션은 달력 아래에 추가**
- 투자 6계명 섹션: 유지

---

## 13. Supabase CRUD 계획 (2026-07-07)

### 13-1. 테이블 설계

**관계도**

```
auth.users (Supabase 내장)
    └── brokers   (user_id FK)
         └── accounts (broker_id FK)
              └── trades   (account_id FK)
```

**SQL Schema**

```sql
-- 증권사
create table brokers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

-- 계좌
create table accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  broker_id      uuid not null references brokers(id) on delete restrict,
  alias          text not null,
  account_number text,
  currency       text not null check (currency in ('KRW', 'USD', 'BOTH')),
  created_at     timestamptz not null default now()
);

-- 거래 내역
create table trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  account_id  uuid not null references accounts(id) on delete restrict,
  type        text not null check (type in ('BUY', 'SELL')),
  stock_code  text not null,
  stock_name  text not null,
  market      text not null check (market in ('KR', 'US')),
  currency    text not null check (currency in ('KRW', 'USD')),
  price       numeric not null,
  quantity    numeric not null,
  fee         numeric not null default 0,
  trade_date  timestamptz not null default now(),
  memo        text,
  created_at  timestamptz not null default now()
);
```

**RLS 정책 (Row Level Security)**

```sql
alter table brokers  enable row level security;
alter table accounts enable row level security;
alter table trades   enable row level security;

-- 본인 데이터만 접근 (세 테이블 동일 패턴)
create policy " "
  on brokers for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- accounts, trades 동일 패턴으로 생성
```

**인덱스**

```sql
create index on trades (user_id, trade_date desc);
create index on trades (account_id);
create index on accounts (broker_id);
```

**타입 리팩터 (`app/types/index.ts`)**

현재 `TradeItem` 기반 타입을 아래 기획서 도메인 모델로 교체:

```ts
interface Broker {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}
interface Account {
  id: string;
  userId: string;
  brokerId: string;
  alias: string;
  accountNumber?: string;
  currency: "KRW" | "USD" | "BOTH";
  createdAt: string;
}
interface Trade {
  id: string;
  userId: string;
  accountId: string;
  type: "BUY" | "SELL";
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  currency: "KRW" | "USD";
  price: number;
  quantity: number;
  fee: number;
  tradeDate: string;
  memo?: string;
  createdAt: string;
}
interface Holding {
  stockCode: string;
  stockName: string;
  market: "KR" | "US";
  currency: "KRW" | "USD";
  quantity: number;
  avgPrice: number;
  totalCost: number;
  currentPrice?: number;
  unrealizedPnL?: number;
  unrealizedPnLRate?: number;
}
```

---

### 13-2. CRUD 구성 방법

**패키지 변경**

```bash
pnpm add @nuxtjs/supabase
pnpm remove pinia-plugin-persistedstate
```

**`pinia-plugin-persistedstate` 제거 근거**

Supabase 도입 시 이 패키지가 해결하려던 문제가 DB 레벨에서 이미 해결됨.

| 스토어                      | localStorage 필요? | 이유                                                                       |
| --------------------------- | ------------------ | -------------------------------------------------------------------------- |
| brokers / accounts / trades | ❌                 | Supabase가 source of truth. 다른 기기에서 추가된 데이터와 캐시 불일치 위험 |
| holdings                    | ❌                 | trades 파생 계산값, 저장 자체가 없음                                       |
| quotes                      | ❌                 | 5분 TTL 인메모리 캐시로 충분                                               |

추가 이유: 금융 데이터를 localStorage에 평문 저장하는 것은 보안상 부적절.  
UI 상태(필터, 정렬 기준) 저장이 필요하다면 URL 쿼리 파라미터 또는 `localStorage.setItem` 직접 호출로 대체.

**환경변수 (`.env`)**

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJhbGc...   # anon public key
```

**`nuxt.config.ts` 수정**

```ts
modules: ['@pinia/nuxt', '@nuxtjs/supabase'],
supabase: { redirect: false }  // 자동 리다이렉트 비활성화 (수동 처리)
```

**스토어 구조 — Supabase 직접 호출 방식**

컴포넌트 → Pinia 스토어 → `useSupabaseClient()` → Supabase DB

```
stores/
  brokers.ts   — fetchAll / add / remove (accounts 참조 있으면 삭제 불가)
  accounts.ts  — fetchAll / add / remove
  trades.ts    — fetchAll / add / update / remove + 필터 상태
  holdings.ts  — computed (trades 파생, DB 저장 없음)
  quotes.ts    — 시세 캐시 (/api/quote 호출만, Supabase 없음)
```

각 스토어 기본 패턴:

```ts
export const useBrokersStore = defineStore("brokers", () => {
  const client = useSupabaseClient();
  const user = useSupabaseUser();
  const items = ref<Broker[]>([]);

  async function fetchAll() {
    const { data } = await client
      .from("brokers")
      .select("*")
      .order("created_at");
    items.value = data ?? [];
  }
  async function add(name: string) {
    const { data } = await client
      .from("brokers")
      .insert({ name, user_id: user.value!.id })
      .select()
      .single();
    items.value.push(data!);
  }
  async function remove(id: string) {
    await client.from("brokers").delete().eq("id", id);
    items.value = items.value.filter((b) => b.id !== id);
  }
  return { items, fetchAll, add, remove };
});
```

**인증**

- `/login` 페이지: Supabase Auth (email + password)
- `middleware/auth.ts`: 미로그인 시 `/login` 리다이렉트
- 로그아웃: `supabase.auth.signOut()`

---

### 13-3. 더미 데이터 입력 및 테스트

**Step 1 — 테스트 유저 생성**

Supabase Dashboard → Authentication → Add User:

- email: `test@example.com` / password: `test1234`

**Step 2 — SQL Editor로 더미 데이터 삽입**

```sql
-- 1) 테스트 유저 id 확인
select id from auth.users where email = 'test@example.com';
-- 이하 <USER_ID> 자리에 위 결과값 사용

-- 2) 증권사
insert into brokers (user_id, name) values
  ('<USER_ID>', '키움증권'),
  ('<USER_ID>', '토스증권');

-- 3) 계좌 (broker_id는 위에서 생성된 값으로 교체)
insert into accounts (user_id, broker_id, alias, currency) values
  ('<USER_ID>', '<KIWOOM_ID>', '일반위탁', 'KRW'),
  ('<USER_ID>', '<TOSS_ID>',   '해외주식', 'USD');

-- 4) 거래 내역
insert into trades (user_id, account_id, type, stock_code, stock_name, market, currency, price, quantity, trade_date) values
  ('<USER_ID>', '<KRW_ACCOUNT_ID>', 'BUY',  '005930', '삼성전자',  'KR', 'KRW', 55000, 10, '2026-06-01'),
  ('<USER_ID>', '<KRW_ACCOUNT_ID>', 'BUY',  '005930', '삼성전자',  'KR', 'KRW', 53000, 5,  '2026-06-10'),
  ('<USER_ID>', '<KRW_ACCOUNT_ID>', 'SELL', '005930', '삼성전자',  'KR', 'KRW', 60000, 8,  '2026-06-20'),
  ('<USER_ID>', '<USD_ACCOUNT_ID>', 'BUY',  'AAPL',   'Apple Inc.','US', 'USD', 190.5, 3,  '2026-06-05'),
  ('<USER_ID>', '<USD_ACCOUNT_ID>', 'BUY',  'NVDA',   'NVIDIA',    'US', 'USD', 120.0, 5,  '2026-06-15');
```

**Step 3 — RLS 동작 확인**

SQL Editor에서 다른 유저 ID로 조회 시 0건이어야 함:

```sql
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000000"}';
select * from trades;  -- 0 rows 확인
```

**Step 4 — 앱 E2E 확인 체크리스트**

```bash
pnpm dev
```

- [ ] 로그인 → 대시보드 진입
- [ ] 거래 추가 → 새로고침 후에도 데이터 유지 (Supabase fetch 확인)
- [ ] 계좌 추가 → 거래 폼 계좌 드롭다운에 즉시 반영
- [ ] 보유 종목 → 가중평균 단가 계산 정확성 확인

---

## 14. 페이지 역할 재정의 및 UI/UX 개선 결정 사항

### 세 페이지의 역할 분리

각 페이지가 독립적인 시각(앵글)을 갖도록 역할을 명확히 분리한다.

| 페이지           | 앵글                      | 핵심 질문                          |
| ---------------- | ------------------------- | ---------------------------------- |
| **trades.vue**   | 시간 축 (trade log)       | "언제, 무엇을 매매했나?"           |
| **holdings.vue** | 종목 축 (stock-centric)   | "종목 X의 현재 포지션과 손익은?"   |
| **accounts.vue** | 계좌 축 (account-centric) | "계좌 A에는 어떤 종목이 들어있나?" |

holdings.vue의 "보유 종목"과 accounts.vue의 계좌별 보유 현황은 **겹치지 않는다**.

- holdings.vue: 전체 포트폴리오에서 종목별 성과 (가격/손익 포함, API 연동 후)
- accounts.vue: 특정 계좌에 어떤 종목이 몇 주 들어있는지 (팩트만, 가격 불필요)

---

### 변경 1 — trades.vue 그룹 버튼 단순화

**전**: 날짜별 / 종목별 / 타입별 / 통화별 (4개)  
**후**: 날짜별 / 타입별 (2개) + 통화 필터 탭

- `종목별` 제거: holdings.vue 아코디언(HoldingsTradeHistory)이 이미 종목별 거래 이력을 제공
- `통화별` → 필터 탭으로 전환: holdings.vue의 마켓 필터(전체/KR/US)와 동일한 UX 패턴으로, 전체/KRW(국내)/USD(해외) 탭을 필터 바에 추가

---

### 변경 2 — accounts.vue 보유 종목 실제 데이터 표시

placeholder 문구 → 실제 계좌별 보유 종목 칩으로 교체

**표시 내용**: `종목명 N주` 형태의 칩 목록 (가격/손익 없음)  
**데이터 소스**: `tradesStore.items`를 `accountId`로 필터링 후 FIFO 계산

**구현 방법**:

1. `app/composables/useHoldings.ts`의 FIFO 로직을 `computeHoldings(trades: Trade[]): Holding[]` 순수 함수로 추출
2. `useHoldings(ref)` 는 내부적으로 `computeHoldings`를 호출 (기존 동작 유지)
3. `accounts.vue`에서 `holdingsByAccount = Map<accountId, Holding[]>` computed 추가

```ts
// accounts.vue
const holdingsByAccount = computed(() => {
  const map = new Map<string, Holding[]>();
  for (const account of accountsStore.items) {
    const accountTrades = tradesStore.items.filter(
      (t) => t.accountId === account.id,
    );
    map.set(account.id, computeHoldings(accountTrades));
  }
  return map;
});
```

- [ ] 다른 계정으로 로그인 시 데이터 분리 확인 (RLS)
