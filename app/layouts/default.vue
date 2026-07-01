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
            v-for="item in navItems"
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
      </aside>
    </Transition>

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
            v-for="item in navItems"
            :key="item.href"
            :to="item.href"
            class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            active-class="bg-accent text-foreground"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- 페이지 콘텐츠 -->
    <main class="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Briefcase, LayoutDashboard, Menu, ScrollText, TrendingUp, X } from '@lucide/vue'

const sidebarOpen = ref(false)

const navItems = [
  { label: '홈', href: '/', icon: LayoutDashboard },
  { label: '매매내역', href: '/trades', icon: ScrollText },
  { label: '보유종목', href: '/holdings', icon: Briefcase },
]
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
