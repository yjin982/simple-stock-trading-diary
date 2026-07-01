// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/tailwindcss',
    // shadcn-nuxt는 npx shadcn-vue@latest add 로 컴포넌트 추가 시점에 활성화
    // 'shadcn-nuxt',
  ],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
  typescript: {
    strict: true,
  },
})
