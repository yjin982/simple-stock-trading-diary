<template>
  <div class="min-h-screen bg-background">
    <!-- 모바일 오버레이 -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- 모바일 사이드바 -->
    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-background shadow-lg lg:hidden"
      >
        <div class="flex items-center justify-between border-b px-4 py-3">
          <div class="flex items-center gap-2 font-bold">
            <TrendingUp class="h-5 w-5 text-primary" />
            <span>주식 매매 기록</span>
          </div>
          <button
            class="rounded-md p-1.5 hover:bg-accent"
            aria-label="메뉴 닫기"
            @click="sidebarOpen = false"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <nav class="flex-1 space-y-1 p-3">
          <NuxtLink
            v-for="item in visibleNavItems"
            :key="item.href"
            :to="item.href"
            class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            active-class="bg-accent text-foreground"
            @click="sidebarOpen = false"
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- 로그인 상태: 사이드바 하단에 계정 정보 -->
        <div v-if="user" class="border-t p-3">
          <div class="mb-2 truncate px-3 py-1 text-xs text-muted-foreground">
            {{ user.email }}
          </div>
          <button
            class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            @click="logout"
          >
            <LogOut class="h-4 w-4 shrink-0" />
            로그아웃
          </button>
        </div>
      </aside>
    </Transition>

    <!-- 데이터 로딩 표시줄 -->
    <div
      v-if="isLoading"
      class="fixed left-0 top-0 z-50 h-0.5 w-full animate-pulse bg-primary"
    />

    <!-- 상단바 -->
    <header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4 sm:px-6">
        <!-- 모바일 햄버거 버튼 -->
        <button
          class="rounded-md p-1.5 hover:bg-accent lg:hidden"
          aria-label="메뉴 열기"
          @click="sidebarOpen = true"
        >
          <Menu class="h-5 w-5" />
        </button>

        <!-- 로고 -->
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-foreground">
          <TrendingUp class="h-5 w-5 text-primary" />
          <span class="hidden sm:inline">주식 매매 기록</span>
        </NuxtLink>

        <!-- 데스크탑 네비게이션 -->
        <nav class="ml-4 hidden items-center gap-1 lg:flex">
          <NuxtLink
            v-for="item in visibleNavItems"
            :key="item.href"
            :to="item.href"
            class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            active-class="bg-accent text-foreground"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- 우측 영역 -->
        <div class="ml-auto flex items-center gap-2">
          <!-- 비로그인 -->
          <NuxtLink
            v-if="!user"
            to="/"
            class="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            로그인
          </NuxtLink>

          <!-- 로그인 -->
          <template v-else>
            <span class="hidden text-sm text-muted-foreground sm:block">{{ user.email }}</span>
            <button
              class="rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              @click="logout"
            >
              로그아웃
            </button>
          </template>
        </div>
      </div>
    </header>

    <!-- 데이터 조회 오류 -->
    <div v-if="loadError" class="mx-auto max-w-screen-xl px-4 pt-4 sm:px-6">
      <div class="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <span>{{ loadError }}</span>
        <button
          class="shrink-0 rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-destructive/10"
          @click="retryFetch"
        >
          다시 시도
        </button>
      </div>
    </div>

    <!-- 페이지 콘텐츠 -->
    <main class="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <slot />
    </main>

    <!-- 푸터 -->
    <footer class="mt-8 border-t py-4 text-center text-xs text-muted-foreground">
      ©2025 Yu-Jin Jeong. All Rights Reserved.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Briefcase, LayoutDashboard, LogOut, Menu, ScrollText, TrendingUp, Wallet, X } from '@lucide/vue'

const client = useSupabaseClient()
const user = useSupabaseUser()
const sidebarOpen = ref(false)

const tradesStore = useTradesStore()
const accountsStore = useAccountsStore()
watch(user, (u) => {
  if (u) {
    tradesStore.fetchAll()
    accountsStore.fetchAll()
  }
}, { immediate: true })

const isLoading = computed(() => tradesStore.loading || accountsStore.loading)
const loadError = computed(() => tradesStore.error || accountsStore.error)

function retryFetch() {
  tradesStore.fetchAll()
  accountsStore.fetchAll()
}

async function logout() {
  await client.auth.signOut()
  sidebarOpen.value = false
  await navigateTo('/')
}

const navItems = [
  { label: '홈', href: '/', icon: LayoutDashboard },
  { label: '매매내역', href: '/trades', icon: ScrollText },
  { label: '보유종목', href: '/holdings', icon: Briefcase },
  { label: '계좌관리', href: '/accounts', icon: Wallet },
]

const visibleNavItems = computed(() =>
  user.value ? navItems : navItems.filter(item => item.href === '/'),
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
