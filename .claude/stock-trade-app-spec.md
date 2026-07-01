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
