// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
    },
  },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxtjs/supabase"],
  supabase: {
    redirect: false,
  },
  tailwindcss: {
    cssPath: "~/assets/css/main.css",
  },
  nitro: {
    vercel: {
      // Nitro는 Build Output API(.vercel/output/config.json)로 배포하므로
      // vercel.json의 crons는 반영되지 않는다. 여기서 선언해야 config.json에 포함된다.
      config: {
        crons: [{ path: "/api/cron/keep-alive", schedule: "0 0 * * *" }],
      },
    },
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    // 서버 전용 키 — NUXT_ 접두사 env가 자동 주입됨 (클라이언트에 노출 안 됨)
    krxAuthKey: "",
    // Vercel Cron이 보내는 CRON_SECRET과 같은 값을 NUXT_CRON_SECRET으로도 설정해야 함
    cronSecret: "",
    // 데모 계정 — 서버(/api/auth/demo)에서만 사용해 비밀번호가 브라우저 번들에 들어가지 않게 한다.
    // NUXT_DEMO_EMAIL / NUXT_DEMO_PASSWORD로 주입
    demoEmail: "",
    demoPassword: "",
    public: {
      supabaseUrl: "",
      supabaseKey: "",
    },
  },
});
