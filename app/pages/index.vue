<template>
  <div class="space-y-6">
    <!-- 나만의 투자 6계명 -->
    <section
      class="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 w-full">
        <img
          :src="img1"
          alt="쌀 때 사서"
          class="w-full h-[150px] md:h-[20vh] md:max-h-[220px] md:min-h-[160px] object-contain"
        />
        <img
          :src="img2"
          alt="비쌀 때 팔아"
          class="w-full h-[150px] md:h-[20vh] md:max-h-[220px] md:min-h-[160px] object-contain"
        />
      </div>
      <div class="p-4">
        <div
          class="grid grid-cols-1 gap-y-2 md:grid-cols-2 md:w-[80%] justify-center md:mx-auto md:gap-x-2"
        >
          <div
            v-for="(rule, i) in RULES"
            :key="i"
            class="flex items-start gap-2.5 py-1.5 border-b border-muted/40 last:border-0 md:last:border-b"
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

    <!-- 요약 카드 + 매매이력 입력 버튼 -->
    <section>
      <div class="mb-3 flex items-center justify-between">
        <h1 class="text-base font-semibold">포트폴리오 요약</h1>
        <button
          class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          @click="openModal(null)"
        >
          <Plus class="h-4 w-4" />
          매매이력 입력
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <UiCard title="총 평가금액" value="₩14,821,500" />
        <UiCard
          title="평가손익"
          value="+₩821,500"
          sub-value="+5.87%"
          trend="positive"
        />
        <UiCard
          title="실현손익"
          value="+₩1,234,000"
          sub-value="+10.28%"
          trend="positive"
        />
        <UiCard title="총 매수금액" value="₩14,000,000" />
        <UiCard
          title="총 수익률"
          value="+14.68%"
          trend="positive"
          class="col-span-2 sm:col-span-1"
        />
      </div>
    </section>

    <!-- 거래 달력 -->
    <section
      class="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold">거래 이력</h2>
        <div class="flex items-center gap-1">
          <button
            class="rounded-md p-1.5 hover:bg-accent transition-colors"
            aria-label="이전 달"
            @click="prevMonth"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <span class="w-28 text-center text-sm font-medium">{{
            currentYearMonth
          }}</span>
          <button
            class="rounded-md p-1.5 hover:bg-accent transition-colors"
            aria-label="다음 달"
            @click="nextMonth"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- 요일 헤더 -->
      <div class="mb-1 grid grid-cols-7">
        <div
          v-for="(day, i) in ['일', '월', '화', '수', '목', '금', '토']"
          :key="day"
          class="py-1 text-center text-xs text-muted-foreground"
          :class="{ 'text-red-500': i === 0, 'text-blue-500': i === 6 }"
        >
          {{ day }}
        </div>
      </div>

      <!-- 날짜 그리드 -->
      <div class="grid grid-cols-7 gap-y-0.5">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="flex items-center justify-center"
        >
          <button
            v-if="day !== null"
            class="relative flex h-8 w-8 flex-col items-center justify-center rounded-full text-sm transition-colors"
            :class="dayClass(day)"
            @click="selectDate(day)"
          >
            <span :class="getDayTradeType(day) ? '-mt-0.5' : ''">{{
              day
            }}</span>
            <!-- 거래 유형별 컬러 인디케이터 -->
            <span
              v-if="getDayTradeType(day)"
              class="absolute bottom-1 h-1.5 w-1.5 rounded-full"
              :class="dotClass(day)"
            />
          </button>
          <div v-else class="h-8 w-8" />
        </div>
      </div>
    </section>

    <!-- 선택일 거래 내역 (날짜 클릭 시 항상 표시) -->
    <section
      v-if="selectedDate"
      class="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold">{{ selectedDate }} 거래 내역</h2>
        <button
          class="flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          @click="openModal(selectedDate)"
        >
          <Plus class="h-3.5 w-3.5" />
          매매이력 입력
        </button>
      </div>

      <TradeHistoryGroup :trades="selectedDateTrades" :card="false" />
    </section>

    <!-- 보유 종목 -->
    <section
      class="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
    >
      <h2 class="mb-3 text-sm font-semibold">보유 종목</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th
                class="pb-2 text-left text-xs font-medium text-muted-foreground"
              >
                종목
              </th>
              <th
                class="pb-2 text-right text-xs font-medium text-muted-foreground"
              >
                수량
              </th>
              <th
                class="pb-2 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell"
              >
                평균단가
              </th>
              <th
                class="pb-2 text-right text-xs font-medium text-muted-foreground"
              >
                현재가
              </th>
              <th
                class="pb-2 text-right text-xs font-medium text-muted-foreground"
              >
                평가손익
              </th>
              <th
                class="pb-2 text-right text-xs font-medium text-muted-foreground hidden md:table-cell"
              >
                손익률
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(holding, i) in holdings"
              :key="i"
              class="border-b last:border-0"
            >
              <td class="py-3">
                <div class="font-medium">{{ holding.stockName }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ holding.stockCode }} · {{ holding.market }}
                </div>
              </td>
              <td class="py-3 text-right">
                {{ holding.quantity.toLocaleString() }}
              </td>
              <td class="py-3 text-right hidden sm:table-cell">
                {{ fmtCurrency(holding.avgPrice, holding.currency) }}
              </td>
              <td class="py-3 text-right">
                {{ fmtCurrency(holding.currentPrice, holding.currency) }}
              </td>
              <td
                class="py-3 text-right font-medium"
                :class="pnlColor(holding.pnl)"
              >
                {{ fmtPnl(holding.pnl, holding.currency) }}
              </td>
              <td
                class="py-3 text-right hidden md:table-cell"
                :class="pnlColor(holding.pnlRate)"
              >
                {{ fmtPnlRate(holding.pnlRate) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 매매이력 입력 팝업 -->
    <TradeFormModal v-model:open="modalOpen" :default-date="modalDate" />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from "@lucide/vue";
import { DUMMY_TODAY, dummyHoldings, dummyTradeData } from "~/lib/dummy-data";
import img1 from "~/assets/images/img1.jpg";
import img2 from "~/assets/images/img2.jpg";

const RULES = [
  "절대 잃지 않기",
  "절대 물리지 않기",
  "포모고 나발이고 절대 고점에 진입하지 않기",
  "패닉셀하지 않기",
  "목표 수익률 달성하면 기계적 매도",
  "주요 경제 지표 안 좋으면 일괄 매도 후 예수금 들고 관망",
];

const holdings = dummyHoldings;

// --- 달력 상태 ---

const viewDate = ref(new Date(2026, 6, 1));
const selectedDate = ref<string | null>(DUMMY_TODAY);

const currentYearMonth = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth() + 1;
  return `${year}년 ${month}월`;
});

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  return days;
});

function formatDate(day: number): string {
  const year = viewDate.value.getFullYear();
  const month = String(viewDate.value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function getDayTradeType(day: number): "BUY" | "SELL" | "BOTH" | null {
  const trades = dummyTradeData[formatDate(day)];
  if (!trades?.length) return null;
  const hasBuy = trades.some((t) => t.type === "BUY");
  const hasSell = trades.some((t) => t.type === "SELL");
  if (hasBuy && hasSell) return "BOTH";
  return hasBuy ? "BUY" : "SELL";
}

function isSelectedDay(day: number): boolean {
  return selectedDate.value === formatDate(day);
}

function selectDate(day: number) {
  const dateStr = formatDate(day);
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr;
}

function dayClass(day: number) {
  const dateStr = formatDate(day);
  const isSelected = selectedDate.value === dateStr;
  const isToday = dateStr === DUMMY_TODAY;
  const tradeType = getDayTradeType(day);

  if (isSelected)
    return "bg-primary text-primary-foreground font-semibold hover:bg-primary/90";
  if (isToday)
    return "ring-1 ring-primary text-primary font-semibold hover:bg-accent";
  if (tradeType === "BUY") return "font-semibold text-red-600 hover:bg-red-50";
  if (tradeType === "SELL")
    return "font-semibold text-blue-600 hover:bg-blue-50";
  if (tradeType === "BOTH")
    return "font-semibold text-purple-600 hover:bg-purple-50";
  return "text-muted-foreground hover:bg-accent";
}

function dotClass(day: number): string {
  if (isSelectedDay(day)) return "bg-white";
  const type = getDayTradeType(day);
  if (type === "BUY") return "bg-red-500";
  if (type === "SELL") return "bg-blue-500";
  return "bg-purple-500"; // BOTH
}

const selectedDateTrades = computed(() => {
  if (!selectedDate.value) return [];
  return dummyTradeData[selectedDate.value] ?? [];
});

function prevMonth() {
  selectedDate.value = null;
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() - 1,
    1,
  );
}

function nextMonth() {
  selectedDate.value = null;
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() + 1,
    1,
  );
}

// --- 매매이력 입력 팝업 ---
const modalOpen = ref(false);
const modalDate = ref<string | null>(null);

function openModal(date: string | null) {
  modalDate.value = date;
  modalOpen.value = true;
}
</script>
