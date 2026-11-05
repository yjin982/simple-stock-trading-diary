# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

A working Nuxt 4 app for recording personal stock trades (KR + US markets) and tracking holdings and P&L. Data lives in Supabase (Auth + Postgres with RLS); current prices and the USD/KRW rate come from Yahoo Finance; KR stock search uses the KRX Open API. Deployed on Vercel.

A local, gitignored `.claude/code-review.md` (if present) tracks review findings and the current work plan — check it before starting larger changes.

## Commands

Package manager: pnpm (pnpm-lock.yaml is present — use pnpm, not npm/yarn).

- `pnpm install` — install dependencies
- `pnpm dev` — start dev server at http://localhost:3000
- `pnpm build` — production build
- `pnpm preview` — preview a production build locally
- `pnpm exec vue-tsc --noEmit` — type check (no script alias)

There is no lint or test script yet.

## Architecture

Nuxt 4 `srcDir` is `app/`; server routes are in the root `server/`. `app/utils`, `app/composables` and `app/stores` are auto-imported — there are no explicit imports for `buildFifoPositions`, `useTradesStore`, etc.

- `app/stores/` (Pinia) — `trades.ts`, `accounts.ts`, `stockSettings.ts`. Each talks to Supabase directly via `useSupabaseClient()` and maps snake_case rows to camelCase types in `app/types/index.ts`. `app/layouts/default.vue` loads trades + accounts once after login; pages read from the stores.
- `app/utils/calc.ts` — all P&L math (FIFO). `buildFifoPositions` → remaining lots per position, `computeHoldingsFromPositions` → holdings with current price, `computeRealizedPnl` → realized P&L by currency, `buildTradeRows` → per-trade rows for the stock detail history, `wouldIntroduceOversell` → guard used by the trades store before editing/deleting a BUY.
- `app/composables/` — `useHoldings` (FIFO + prices), `usePriceMap` (calls `/api/stock/quote`, discards stale responses), `useExchangeRate` (shared USD/KRW via `useState`; value is `null` until fetched or if the fetch fails), `useSummary` (home summary).
- `app/pages/` — `index.vue` (login / home), `trades.vue` (history + calendar tabs), `holdings/index.vue`, `holdings/[market]/[stockCode].vue`, `accounts/index.vue`, `accounts/[brokerName].vue`. Protected pages use the `auth` middleware.
- `app/components/ui/` — hand-written UI primitives (shadcn-vue is **not** installed, even though README says so).
- `server/api/stock/` — `search.ts` (KRX, KR stocks), `search-us.ts` (Yahoo), `quote.get.ts` (Yahoo quotes, 15 min cache, max 50 symbols). `server/api/cron/keep-alive.get.ts` keeps the free Supabase project awake; the cron schedule is declared in `nuxt.config.ts` (`nitro.vercel.config.crons`), not in `vercel.json`.
- There are no SQL/migration files in the repo; the schema and RLS policies live only in the Supabase dashboard. Column changes must be applied there by hand.

## Domain rules (keep these consistent everywhere)

- **Identify a stock by market + code.** KR and US can share a code. Use `stockKey(market, stockCode)` for map keys and filters; FIFO positions are keyed `accountId|market|stockCode`.
- **Trade order** is `tradeDate` → `sequence` (user-set order within a day) → `createdAt`. Always sort with `sortTradesAsc`; `FormModal.vue` mirrors the same rule to check the balance at the time of a sell.
- **Selling more than held** is blocked in the client (FormModal for sells, `wouldIntroduceOversell` for BUY edits/deletes). Existing oversold data is tracked via `oversoldQty` / `oversold` and shown as a warning, not silently dropped.
- **Quantity policy:** KR stocks are whole shares, US stocks may be fractional.
- **Missing prices:** when a quote is unavailable, `currentPrice` falls back to `avgPrice` and `priceAvailable` is `false`; the UI must show "—" / a notice rather than a normal-looking value.
- **P&L scope:** fees, taxes, dividends and FX gains/losses are intentionally not calculated (the user has no way to obtain them). USD amounts are converted to KRW at the *current* rate only. Do not add fields for these; show a notice instead.
- KRW and USD amounts are summed separately; combine them only after converting with a known exchange rate.

## 코드 스타일

- 환경변수 관리는 `.env` 파일. `.env` 파일은 commit 하지 않음.
- 변수명: camelCase
- TypeScript strict mode
- import는 알파벳 순으로 정리. 컴포넌트는 컴포넌트끼리, api는 api끼리 유형에 따라 묶어서 작성

## 커밋 메시지 컨벤션 (Commit Convention)

- 모든 커밋 메시지는 한국어로 작성합니다.
- 다음 형식(Conventional Commits)을 엄격히 준수합니다.
  - `feat`: 새로운 기능 추가
  - `fix`: 버그 수정
  - `docs`: 문서 변경
  - `refactor`: 동작 변경 없는 코드 구조 개선
  - `style`: 포맷, 세미콜론 등 의미 없는 스타일 변경
- 형식: `<type>(<scope>): <summary>`
- 본문(body)이 필요한 경우 `왜(Why)` 변경했는지 구체적으로 작성하세요.
