<template>
  <div>
    <!-- 로그인 화면 (비로그인 상태에서만) -->
    <div
      v-if="!user"
      class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center"
    >
      <HomeLoginForm />
    </div>

    <!-- 앱 콘텐츠 (로그인 상태에서만) -->
    <div v-if="user" class="space-y-6">
      <!-- 나만의 투자 6계명 -->
      <section
        class="overflow-hidden border rounded-lg shadow-sm bg-card text-card-foreground"
      >
        <div
          class="grid items-center justify-center w-full grid-cols-1 md:grid-cols-2"
        >
          <div class="p-4 space-y-2">
            <img
              :src="img1"
              alt="쌀 때 사서"
              class="w-full h-[150px] object-contain md:h-[20vh] md:max-h-[220px] md:min-h-[160px]"
            />
            <img
              :src="img2"
              alt="비쌀 때 팔아"
              class="w-full h-[150px] object-contain md:h-[20vh] md:max-h-[220px] md:min-h-[160px]"
            />
          </div>
          <div class="p-4">
            <div
              v-for="(rule, i) in RULES"
              :key="i"
              class="flex items-start gap-2.5 border-b border-muted/40 py-1.5 last:border-0 md:last:border-b"
            >
              <span
                class="mt-0.5 flex h-4 w-7 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-white"
              >
                0{{ i + 1 }}
              </span>
              <p
                class="text-xs font-medium leading-relaxed text-card-foreground/90"
              >
                {{ rule }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeSummaryCards @open-modal="openModal(null)" />
      <HomeTradeCalendar @open-modal="openModal" />
      <HomeHoldingsTable />
    </div>

    <TradeFormModal v-model:open="modalOpen" :default-date="modalDate" />
  </div>
</template>

<script setup lang="ts">
import img1 from "~/assets/images/img1.jpg";
import img2 from "~/assets/images/img2.jpg";

const user = useSupabaseUser();
const tradesStore = useTradesStore();

onMounted(() => tradesStore.fetchAll());

const RULES = [
  "절대 잃지 않기",
  "절대 물리지 않기",
  "포모고 나발이고 절대 고점에 진입하지 않기",
  "패닉셀하지 않기",
  "목표 수익률 달성하면 기계적 매도",
  "주요 경제 지표 안 좋으면 일괄 매도 후 예수금 들고 관망",
];

const modalOpen = ref(false);
const modalDate = ref<string | null>(null);

function openModal(date: string | null) {
  modalDate.value = date;
  modalOpen.value = true;
}
</script>
