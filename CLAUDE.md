# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a Nuxt 4 application named "simple-stock-trading-diary", currently at the initial scaffold stage (default Nuxt starter content, no custom pages/components/stores yet). Treat architectural conventions below as a starting point, not established patterns — verify against the actual code as the app grows.

## Commands

Package manager: pnpm (pnpm-lock.yaml is present — use pnpm, not npm/yarn).

- `pnpm install` — install dependencies
- `pnpm dev` — start dev server at http://localhost:3000
- `pnpm build` — production build
- `pnpm generate` — static site generation
- `pnpm preview` — preview a production build locally

There is no lint, test, or type-check script configured yet. `tsconfig.json` only references the auto-generated `.nuxt/tsconfig.*.json` project files (standard Nuxt TypeScript setup); there's no custom `compilerOptions`.

## Architecture

- `app/app.vue` — root component (currently the default Nuxt welcome page)
- `nuxt.config.ts` — Nuxt config; minimal (devtools enabled, compatibilityDate set)
- `public/` — static assets
- Nuxt 4's `srcDir` convention applies: app code lives under `app/` (pages, components, composables, etc. would go in `app/pages/`, `app/components/`, `app/composables/` respectively once added).

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
