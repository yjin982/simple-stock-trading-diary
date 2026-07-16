# 주식 매매 기록 (Simple Stock Trading Diary)

개인 주식 거래 내역을 기록하고 포트폴리오를 관리하는 웹 애플리케이션입니다.

## 주요 기능

- **포트폴리오 요약** — 국내/해외 종목별 평가금액, 미실현손익, 실현손익, 총 수익률 조회
- **보유 종목 관리** — FIFO 방식 계좌별 평균단가 계산, Yahoo Finance 실시간 현재가 조회; 같은 종목을 여러 계좌에 보유 시 계좌별로 분리 표시
- **종목 상세** — 단일 계좌는 요약 카드 + 매매 이력, 다중 계좌는 합산 요약 + 계좌별 탭 UI
- **매매 이력** — 거래 내역 등록/수정/삭제, 날짜별·유형별 그룹 보기, CSV 내보내기; 계좌별 FIFO 기반 평균보유일수·실현손익 표시
- **거래 캘린더** — 월별 캘린더 뷰로 매매 이력 확인 및 월간 요약
- **계좌 관리** — 증권사/계좌별 보유 현황 및 손익 집계; 각 화면에서 계좌명 클릭 시 해당 증권사 페이지로 이동
- **종목 설정** — 종목별 메모 및 목표 수익률 설정, 달성 시 강조 표시
- **종목 검색** — KRX Open API 기반 국내 종목 검색(KOSPI/KOSDAQ), Yahoo Finance 기반 해외 종목 검색

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | Nuxt 4 (Vue 3) |
| 언어 | TypeScript |
| 상태 관리 | Pinia |
| UI | Tailwind CSS v3, shadcn-vue, Radix Vue |
| 차트 | Chart.js + vue-chartjs |
| 백엔드/DB | Supabase (PostgreSQL + Auth + RLS) |
| 주가 데이터 | Yahoo Finance (yahoo-finance2) |
| 종목 검색 | KRX Open API (국내), Yahoo Finance (해외) |
| 아이콘 | Lucide Vue |

## 시작하기

패키지 매니저로 **pnpm**을 사용합니다.

```bash
pnpm install
pnpm dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 설정합니다.

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
NUXT_KRX_AUTH_KEY=your_krx_auth_key
```

| 변수 | 설명 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_KEY` | Supabase anon public key |
| `NUXT_KRX_AUTH_KEY` | KRX Open API 인증키 (`data-dbg.krx.co.kr`) |

## 프로젝트 구조

```
app/
├── pages/
│   ├── index.vue              # 홈 (포트폴리오 요약 + 보유 종목)
│   ├── trades.vue             # 매매 이력 (내역 탭 + 캘린더 탭)
│   ├── holdings/
│   │   ├── index.vue          # 보유 종목 목록 (계좌별 rowspan 그룹)
│   │   └── [stockCode].vue    # 종목 상세 (단일/다중 계좌 분기 UI)
│   └── accounts/
│       ├── index.vue          # 계좌 목록
│       └── [brokerName].vue   # 증권사별 계좌 상세
├── components/
│   ├── trade/                 # 매매이력 폼, 검색, 캘린더, 이력 그룹
│   ├── holdings/
│   │   ├── TradeHistory.vue   # 계좌별 FIFO 매매 이력 테이블 + 페이지네이션
│   │   ├── StockSettings.vue  # 종목 설정 (목표수익률·메모) 폼
│   │   └── SummaryCards.vue   # 보유 요약 카드 그리드 (일반/compact/합산)
│   ├── home/                  # 홈 요약 카드, 포트폴리오 차트, 보유 테이블
│   ├── account/               # 계좌 추가/수정 모달
│   └── ui/                    # 공용 UI 컴포넌트
├── composables/
│   ├── useHoldings.ts         # FIFO 포지션 계산 + Yahoo Finance 현재가
│   ├── usePriceMap.ts         # Yahoo Finance 가격 조회
│   ├── useSummary.ts          # 포트폴리오 요약 집계
│   └── useAccountPagination.ts # 계좌별 페이지네이션 상태 관리
├── stores/
│   ├── trades.ts              # 거래 내역 CRUD
│   ├── accounts.ts            # 계좌 CRUD
│   └── stockSettings.ts       # 종목 메모·목표수익률 관리
├── utils/
│   ├── calc.ts                # FIFO 손익 계산 (buildFifoPositions, buildTradeRows 등)
│   ├── format.ts              # 통화·손익 포맷팅
│   ├── csv.ts                 # CSV 생성·다운로드
│   ├── date.ts                # 날짜 유틸
│   ├── pagination.ts          # 그룹 페이지네이션
│   └── yahooSymbol.ts         # Yahoo 심볼 변환 (KS/KQ 접미사)
└── types/
    ├── index.ts               # 공용 타입 (Trade, Holding, TradeRow, Account 등)
    └── database.types.ts      # Supabase 테이블 타입
server/
└── api/
    ├── stock/
    │   ├── search.ts          # KRX API 국내 종목 검색 (12시간 캐시)
    │   ├── search-us.ts       # Yahoo Finance 해외 종목 검색
    │   └── quote.ts           # Yahoo Finance 현재가 조회
```

## 빌드

```bash
pnpm build     # 프로덕션 빌드
pnpm preview   # 빌드 결과 로컬 미리보기
pnpm generate  # 정적 사이트 생성
```
