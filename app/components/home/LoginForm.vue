<template>
  <div class="w-full max-w-sm space-y-6">
    <!-- 로고 + 타이틀 -->
    <div class="text-center">
      <img src="/logo.svg" alt="로고" class="w-16 h-16 mx-auto mb-4" />
      <h1 class="text-2xl font-bold tracking-tight">간단 주식 매매 다이어리</h1>
      <p class="mt-1 text-sm text-muted-foreground">계속하려면 로그인하세요.</p>
    </div>

    <!-- 로그인 폼 카드 -->
    <div class="p-6 border rounded-lg shadow-sm bg-card">
      <p class="mb-4 text-sm font-semibold">로그인</p>
      <div class="space-y-3">
        <input
          v-model="form.email"
          type="email"
          placeholder="이메일"
          class="flex w-full px-3 text-sm border rounded-md shadow-sm h-9 border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="비밀번호"
          class="flex w-full px-3 text-sm border rounded-md shadow-sm h-9 border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @keydown.enter="login"
        />
        <button
          class="w-full text-sm font-medium transition-colors rounded-md h-9 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          :disabled="loading"
          @click="login"
        >
          {{ loading ? "로그인 중..." : "로그인" }}
        </button>
      </div>
      <p v-if="error" class="mt-3 text-xs text-destructive">{{ error }}</p>
    </div>

    <!-- 데모 로그인 -->
    <div class="text-center">
      <p class="mb-2 text-xs text-muted-foreground">계정이 없으신가요?</p>
      <button
        class="w-full rounded-md border border-input bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        :disabled="loading"
        @click="loginAsDemo"
      >
        {{ loading ? "로그인 중..." : "데모 계정으로 체험하기" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient();

const form = reactive({ email: "", password: "" });
const loading = ref(false);
const error = ref("");

async function signIn(email: string, password: string) {
  error.value = "";
  loading.value = true;
  const { error: err } = await client.auth.signInWithPassword({ email, password });
  if (err) error.value = err.message;
  loading.value = false;
}

function login() {
  signIn(form.email, form.password);
}

// 데모 비밀번호는 서버에만 있다. 서버가 로그인한 세션을 받아 이 브라우저의 세션으로 설정한다.
async function loginAsDemo() {
  error.value = "";
  loading.value = true;
  try {
    const { accessToken, refreshToken } = await $fetch("/api/auth/demo", { method: "POST" });
    const { error: err } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (err) error.value = err.message;
  } catch (e) {
    error.value = apiErrorMessage(e, "데모 계정으로 로그인하지 못했습니다.");
  } finally {
    loading.value = false;
  }
}
</script>
