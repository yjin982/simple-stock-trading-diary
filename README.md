# 주식 매매 기록 (Simple Stock Trading Diary)

개인 주식 거래 내역을 기록하고 포트폴리오를 관리하는 웹 애플리케이션입니다.

## 주요 기능

- **포트폴리오 요약** — 국내/해외 종목별 평가금액, 미실현손익, 실현손익, 총 수익률 조회
- **보유 종목 관리** — FIFO(선입선출) 방식 계좌별 평균단가 계산, Yahoo Finance 현재가 조회; 같은 종목을 여러 계좌에 보유 시 계좌별로 분리 표시
- **종목 상세** — 단일 계좌는 요약 카드 + 매매 이력, 다중 계좌는 합산 요약 + 계좌별 탭 UI
- **매매 이력** — 거래 내역 등록/수정/삭제, 날짜별·유형별 그룹 보기, CSV 내보내기; 계좌별 FIFO 기반 평균보유일수·실현손익 표시
- **거래 캘린더** — 월별 캘린더 뷰로 매매 이력 확인 및 월간 요약
- **계좌 관리** — 증권사/계좌별 보유 현황 및 손익 집계 (KRW, USD, KRW+USD 계좌)
- **종목 설정** — 종목별 메모 및 목표 수익률 설정, 달성 시 강조 표시
- **종목 검색** — KRX Open API 기반 국내 종목 검색(KOSPI/KOSDAQ/ETF), Yahoo Finance 기반 해외 종목 검색

## 손익 계산 기준

- 보유수량·평균단가·실현손익은 계좌·종목별 **FIFO(선입선출)** 로 계산합니다. 같은 날짜의 거래는 입력한 순서(`sequence`)대로 처리합니다.
- **수수료·세금·배당은 반영하지 않습니다.** 앱에서 조회할 방법이 없어 계산하지 않기로 정했고, 화면에도 이 점을 안내합니다.
- 해외 주식의 원화 환산은 **현재 환율** 기준입니다. 매수·매도 시점의 환율 차이(환차손익)는 포함하지 않습니다.
- 그래서 표시되는 손익은 참고용이며 **세금 신고 근거로 쓸 수 없습니다.** 세금 신고에는 증권사 자료를 이용하세요.
- 환율이나 현재가를 조회하지 못하면 0원이나 손익 0으로 계산하지 않고 "계산 불가" 또는 안내 문구로 표시합니다.
- 보유수량보다 많이 파는 매도는 앱과 DB(트리거) 양쪽에서 막습니다.

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| 프레임워크 | Nuxt 4 (Vue 3) |
| 언어 | TypeScript |
| 상태 관리 | Pinia |
| UI | Tailwind CSS v3, 직접 만든 UI 컴포넌트(`app/components/ui`), @vueuse/core |
| 차트 | Chart.js + vue-chartjs |
| 백엔드/DB | Supabase (PostgreSQL + Auth + RLS) |
| 주가·환율 데이터 | Yahoo Finance (yahoo-finance2) |
| 종목 검색 | KRX Open API (국내), Yahoo Finance (해외) |
| 아이콘 | Lucide Vue (@lucide/vue) |
| 테스트 | Vitest |
| 배포 | Vercel (Cron으로 Supabase 휴면 방지) |

## 시작하기

패키지 매니저로 **pnpm**을 사용합니다.

```bash
pnpm install
pnpm dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 데이터베이스 준비

Supabase CLI를 쓰지 않고, Supabase 대시보드의 **SQL Editor**에서 직접 실행합니다.

1. `supabase/schema.sql` — 테이블, enum, 제약, RLS 정책
2. `supabase/migrations/*.sql` — 파일 이름 순서대로 실행 (초과 매도 방지 트리거 등)

`supabase/inspect_schema.sql`을 실행하면 실제 DB의 컬럼, 제약, RLS 정책, 트리거, enum을 한 표로 확인할 수 있습니다. 스키마를 바꿀 때는 `migrations/`에 파일을 추가하고 `schema.sql`도 함께 고칩니다.

## 환경 변수

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 설정합니다. 배포 시에는 Vercel 환경변수에도 같은 값을 넣습니다.

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
NUXT_KRX_AUTH_KEY=your_krx_auth_key
NUXT_CRON_SECRET=your_cron_secret
```

| 변수 | 설명 |
| --- | --- |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_KEY` | Supabase anon public key |
| `NUXT_KRX_AUTH_KEY` | KRX Open API 인증키 (`data-dbg.krx.co.kr`). 아래 KRX API 이용 신청 필요 |
| `NUXT_CRON_SECRET` | keep-alive cron 호출 검증용. Vercel의 `CRON_SECRET`과 같은 값 |
| `NUXT_PUBLIC_DEMO_EMAIL`, `NUXT_PUBLIC_DEMO_PASSWORD` | (선택) 로그인 화면의 "데모 계정으로 체험하기" 계정. 브라우저에 노출되므로 실제 계정을 쓰지 마세요 |

### KRX Open API 이용 신청

국내 종목 검색은 아래 3개 API를 사용합니다. KRX Open API는 API마다 이용 신청을 해야 하고 **사용 기한**이 있습니다. 기한이 지나면 국내 검색에서 "KRX 인증키가 유효하지 않거나 이 API의 사용 승인이 없습니다" 오류가 납니다.

| 서비스 | 엔드포인트 |
| --- | --- |
| 유가증권 종목기본정보 | `sto/stk_isu_base_info` |
| 코스닥 종목기본정보 | `sto/ksq_isu_base_info` |
| ETF 일별매매정보 | `etp/etf_bydd_trd` |

## 스크립트

```bash
pnpm dev        # 개발 서버
pnpm build      # 프로덕션 빌드
pnpm preview    # 빌드 결과 로컬 미리보기
pnpm test       # Vitest (FIFO 손익 계산 등)
pnpm typecheck  # 타입 검사 (vue-tsc -b --noEmit)
```

## 프로젝트 구조

```text
app/
├── pages/
│   ├── index.vue                  # 로그인 / 홈 (포트폴리오 요약 + 비중 차트 + 보유 종목)
│   ├── trades.vue                 # 매매 이력 (내역 탭 + 캘린더 탭)
│   ├── holdings/
│   │   ├── index.vue              # 보유 종목 목록 (종목별 계좌 rowspan 그룹)
│   │   └── [market]/[stockCode].vue  # 종목 상세 (단일/다중 계좌 분기 UI)
│   └── accounts/
│       ├── index.vue              # 계좌 목록
│       └── [brokerName].vue       # 증권사별 계좌 상세
├── components/
│   ├── trade/                     # 매매 폼, 종목 검색, 캘린더, 이력 그룹
│   ├── holdings/                  # 종목 상세의 매매 이력·종목 설정·요약 카드
│   ├── home/                      # 홈 요약 카드, 포트폴리오 차트, 보유 테이블, 로그인 폼
│   ├── account/                   # 계좌 추가/수정 모달, 계좌 선택
│   └── ui/                        # 공용 UI (Card, Dialog, PnlDisclaimer, EstimatedPriceNotice 등)
├── composables/
│   ├── useHoldings.ts             # FIFO 포지션 + 현재가 → 보유 종목
│   ├── usePriceMap.ts             # 현재가 조회 (오래된 응답 무시)
│   ├── useExchangeRate.ts         # USD/KRW 환율 조회·원화 환산
│   ├── useSummary.ts              # 홈 포트폴리오 요약 집계
│   └── useAccountPagination.ts    # 계좌별 페이지네이션 상태
├── stores/
│   ├── trades.ts                  # 거래 내역 CRUD (전체 거래를 1000건씩 나눠 조회)
│   ├── accounts.ts                # 계좌 CRUD
│   └── stockSettings.ts           # 종목 메모·목표수익률
├── utils/
│   ├── calc.ts                    # FIFO 손익 계산 (모든 화면이 같은 runFifo 사용)
│   ├── fetchAllRows.ts            # Supabase 행 수 상한을 넘는 조회
│   ├── stockKey.ts                # 시장+종목코드 키 (KR/US 코드 충돌 방지)
│   ├── yahooSymbol.ts             # Yahoo 심볼 변환 (.KS/.KQ)
│   ├── format.ts, date.ts, csv.ts, pagination.ts
├── middleware/auth.ts             # 로그인 필요 페이지 보호
└── types/                         # 공용 타입, Supabase 테이블 타입
server/
├── api/
│   ├── stock/
│   │   ├── search.ts              # KRX 국내 종목 검색 (전체 목록 12시간 캐시)
│   │   ├── search-us.ts           # Yahoo 해외 종목 검색 (1시간 캐시)
│   │   └── quote.get.ts           # Yahoo 현재가·환율 (15분 캐시, 최대 50개)
│   └── cron/keep-alive.get.ts     # Supabase 휴면 방지 (Vercel Cron, 매일)
└── utils/requireUser.ts           # 로그인 사용자만 API 호출 허용
supabase/
├── schema.sql                     # DB 스키마 (RLS 포함)
├── migrations/                    # 대시보드에서 실행한 변경 기록
└── inspect_schema.sql             # 실제 DB 상태 조회
tests/                             # Vitest (calc, fetchAllRows)
```
