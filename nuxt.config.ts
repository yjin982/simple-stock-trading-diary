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
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    // 서버 전용 키 — NUXT_ 접두사 env가 자동 주입됨 (클라이언트에 노출 안 됨)
    dataGoKrServiceKey: "",
    krxAuthKey: "",
    public: {
      supabaseUrl: "",
      supabaseKey: "",
    },
  },
});
