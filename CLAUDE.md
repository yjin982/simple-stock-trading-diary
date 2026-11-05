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
- `pnpm typecheck` — type check (`vue-tsc -b --noEmit`). The `-b` is required: the root `tsconfig.json` only has project references, so plain `vue-tsc --noEmit` checks nothing and always passes.
- `pnpm test` — Vitest (`tests/**/*.test.ts`). Runs without the Nuxt runtime, so only pure modules with explicit imports (e.g. `app/utils/calc.ts`) can be tested this way. Run a single file with `pnpm exec vitest run tests/calc.test.ts`, or a single case with `-t "<name>"`.

There is no lint script. When changing `app/utils/calc.ts`, add or update a case in `tests/calc.test.ts` first.

## Architecture

Nuxt 4 `srcDir` is `app/`; server routes are in the root `server/`. `app/utils`, `app/composables` and `app/stores` are auto-imported — there are no explicit imports for `buildFifoPositions`, `useTradesStore`, etc.

- `app/stores/` (Pinia) — `trades.ts`, `accounts.ts`, `stockSettings.ts`. Each talks to Supabase directly via `useSupabaseClient()` and maps snake_case rows to camelCase types in `app/types/index.ts`. `app/layouts/default.vue` loads trades + accounts once after login; pages read from the stores.
- `app/utils/calc.ts` — all P&L math (FIFO, tested in `tests/calc.test.ts`). `buildFifoPositions` → remaining lots per position, `computeHoldingsFromPositions` → holdings with current price, `computeRealizedPnl` → realized P&L by currency, `buildTradeRows` → per-trade rows for the stock detail history, `wouldIntroduceOversell` → guard used by the trades store before editing/deleting a BUY.
- `app/composables/` — `useHoldings` (FIFO + prices), `usePriceMap` (calls `/api/stock/quote`, discards stale responses), `useExchangeRate` (shared USD/KRW via `useState`; value is `null` until fetched or if the fetch fails), `useSummary` (home summary).
- `app/pages/` — `index.vue` (login / home), `trades.vue` (history + calendar tabs), `holdings/index.vue`, `holdings/[market]/[stockCode].vue`, `accounts/index.vue`, `accounts/[brokerName].vue`. Protected pages use the `auth` middleware.
- `app/components/ui/` — hand-written UI primitives (shadcn-vue is **not** installed).
- `server/api/stock/` — `search.ts` (KRX, KR stocks), `search-us.ts` (Yahoo), `quote.get.ts` (Yahoo quotes, 15 min cache, max 50 symbols). All three call `requireUser(event)` (`server/utils/requireUser.ts`) first. Put caching on the upstream call with `defineCachedFunction` and keep the route a plain `defineEventHandler` — `defineCachedEventHandler` skips the handler (and the auth check) on a cache hit. Map upstream failures to 502 so they aren't confused with the app's own 401. On the client, read API error text with `apiErrorMessage(err, fallback)` (`app/utils/apiError.ts`): h3 replaces a Korean `statusMessage` with `"."` in the HTTP status text, so `FetchError.statusMessage` is useless — the real message is only in the response body.
- `server/api/auth/demo.post.ts` — the "데모 계정으로 체험하기" button. The server signs in with `NUXT_DEMO_EMAIL`/`NUXT_DEMO_PASSWORD` (server-only runtimeConfig) and returns only session tokens; never move demo credentials back to `runtimeConfig.public`. `server/api/cron/keep-alive.get.ts` keeps the free Supabase project awake; the cron schedule is declared in `nuxt.config.ts` (`nitro.vercel.config.crons`), not in `vercel.json`.
- `supabase/` — there is no Supabase CLI setup; SQL is run by hand in the dashboard SQL Editor. `migrations/*.sql` record what has been applied (including the `trades_prevent_oversell` trigger, which rejects any insert/update/delete that increases a position's oversold quantity), and `inspect_schema.sql` dumps the live schema, RLS policies, triggers and enums for comparison. Any schema change must be written as a new migration file **and** run in the dashboard.

## Domain rules (keep these consistent everywhere)

- **Identify a stock by market + code.** KR and US can share a code. Use `stockKey(market, stockCode)` for map keys and filters; FIFO positions are keyed `accountId|market|stockCode`.
- **Trade order** is `tradeDate` → `sequence` (user-set order within a day) → `createdAt`. Always sort with `sortTradesAsc`; `FormModal.vue` mirrors the same rule to check the balance at the time of a sell.
- **Selling more than held** is blocked in the client (FormModal for sells, `wouldIntroduceOversell` for BUY edits/deletes) and again in the DB by the `trades_prevent_oversell` trigger, using the same rule (reject only if the oversold quantity increases). The trigger takes a per-position advisory lock first, so concurrent saves to the same position are checked one after another. Keep the client and trigger rules in sync. Existing oversold data is tracked via `oversoldQty` / `oversold` and shown as a warning, not silently dropped.
- **One FIFO loop.** `buildFifoPositions`, `computeRealizedPnl` and `buildTradeRows` all go through the private `runFifo` in `calc.ts`; don't write another lot-matching loop elsewhere, or screens will disagree.
- **Quantity policy:** KR stocks are whole shares, US stocks may be fractional. Never compare quantities to `0` with `===`/`>`; use `QTY_EPSILON` (and `roundQty` for display / comparing against user input), because fractional sums leave float noise like `0.30000000000000004`.
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
