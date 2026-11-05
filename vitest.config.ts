import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// app/utils의 순수 계산 함수만 테스트하므로 Nuxt 환경 없이 실행한다.
// (Nuxt 자동 import에 기대는 코드는 이 설정으로 테스트할 수 없음)
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
