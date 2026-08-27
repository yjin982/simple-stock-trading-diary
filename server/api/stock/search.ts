import type { Stock } from "~/types";

interface KrxBaseInfoResponse {
  OutBlock_1?: KrxBaseInfoItem[];
}

interface KrxBaseInfoItem {
  ISU_CD: string;
  ISU_SRT_CD: string;
  ISU_NM: string;
  ISU_ABBRV: string;
  ISU_ENG_NM: string;
  LIST_DD: string;
  MKT_TP_NM: string;
  SECUGRP_NM: string;
  SECT_TP_NM: string;
  KIND_STKCERT_TP_NM: string;
  PARVAL: string;
  LIST_SHRS: string;
}

// 서버 실행 위치와 무관하게 KST 기준 날짜를 사용해야 한국 시간대 경계에서
// 기준일이 하루 어긋나는 문제를 피할 수 있다.
function toKstDate(base: Date): Date {
  return new Date(base.getTime() + 9 * 60 * 60 * 1000);
}

function formatYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// 전일부터 거슬러 올라가며 주말을 제외한 영업일 후보(KST 기준) 목록을 반환.
// 공휴일이라 KRX 응답이 비어 있는 경우, 호출부에서 다음 후보로 순차 재시도한다.
function recentBusinessDays(maxCandidates = 5): string[] {
  const days: string[] = [];
  const cursor = toKstDate(new Date());
  cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.length < maxCandidates) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days.push(formatYYYYMMDD(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days;
}

const KRX_ENDPOINTS = {
  KOSPI: "https://data-dbg.krx.co.kr/svc/apis/sto/stk_isu_base_info",
  KOSDAQ: "https://data-dbg.krx.co.kr/svc/apis/sto/ksq_isu_base_info",
} as const;

async function fetchKrxMarket(
  authKey: string,
  market: keyof typeof KRX_ENDPOINTS,
  basDd: string,
): Promise<KrxBaseInfoItem[]> {
  const res = await $fetch<KrxBaseInfoResponse>(KRX_ENDPOINTS[market], {
    method: "POST",
    headers: {
      AUTH_KEY: authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ basDd }),
  });
  return res?.OutBlock_1 ?? [];
}

type KrxItemWithExchange = KrxBaseInfoItem & { _exchange: "KOSPI" | "KOSDAQ" };

// KOSPI+KOSDAQ 전체 상장 목록은 검색어와 무관하게 하루 동안 동일하므로,
// 검색어별로 매번 새로 받아오지 않도록 날짜(basDd) 기준으로만 캐싱한다.
// 실제 검색어 필터링은 이 캐시된 전체 목록에서 매 요청마다(캐시 없이) 수행한다.
const fetchAllKrStocks = defineCachedFunction(
  async (basDd: string): Promise<KrxItemWithExchange[]> => {
    const config = useRuntimeConfig();
    const [kospiItems, kosdaqItems] = await Promise.all([
      fetchKrxMarket(config.krxAuthKey, "KOSPI", basDd),
      fetchKrxMarket(config.krxAuthKey, "KOSDAQ", basDd),
    ]);
    return [
      ...kospiItems.map((item) => ({ ...item, _exchange: "KOSPI" as const })),
      ...kosdaqItems.map((item) => ({ ...item, _exchange: "KOSDAQ" as const })),
    ];
  },
  {
    name: "krx-all-stocks",
    maxAge: 60 * 60 * 12,
    getKey: (basDd: string) => basDd,
  },
);

interface KrxEtfItem {
  ISU_CD: string;
  ISU_NM: string;
}

// ETF는 종목코드가 이미 6자리 단축코드이고 거래소 구분이 없어 KRX 호출 1번으로 전체를 커버한다.
const fetchAllKrEtfs = defineCachedFunction(
  async (basDd: string): Promise<KrxEtfItem[]> => {
    const config = useRuntimeConfig();
    const res = await $fetch<{ OutBlock_1?: KrxEtfItem[] }>(
      "https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd",
      {
        method: "POST",
        headers: {
          AUTH_KEY: config.krxAuthKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ basDd }),
      },
    );
    return res?.OutBlock_1 ?? [];
  },
  {
    name: "krx-all-etfs",
    maxAge: 60 * 60 * 12,
    getKey: (basDd: string) => basDd,
  },
);

export default defineEventHandler(async (event) => {
  const { name } = getQuery(event);
  const query = typeof name === "string" ? name.trim().toLowerCase() : "";
  if (!query) {
    throw createError({
      statusCode: 400,
      statusMessage: "검색어(name)가 필요합니다.",
    });
  }

  // 최근 영업일부터 순서대로 시도해, 공휴일이라 KRX 응답이 비어 있으면
  // 다음(더 이전) 영업일로 자동 재시도한다.
  let allStocks: KrxItemWithExchange[] = [];
  let allEtfs: KrxEtfItem[] = [];
  for (const basDd of recentBusinessDays()) {
    const [stocks, etfs] = await Promise.all([
      fetchAllKrStocks(basDd),
      fetchAllKrEtfs(basDd),
    ]);
    if (stocks.length > 0 || etfs.length > 0) {
      allStocks = stocks;
      allEtfs = etfs;
      break;
    }
  }

  const stockResults = allStocks
    .filter((item) => {
      const nm = item.ISU_NM.toLowerCase();
      const abbr = item.ISU_ABBRV.toLowerCase();
      return nm.includes(query) || abbr.includes(query);
    })
    .map(
      (item): Stock => ({
        code: item.ISU_SRT_CD,
        name: item.ISU_ABBRV,
        market: "KR",
        exchange: item._exchange,
        currency: "KRW",
        price: 0,
        stockType: item.KIND_STKCERT_TP_NM,
      }),
    );

  const etfResults = allEtfs
    .filter((item) => item.ISU_NM.toLowerCase().includes(query))
    .map(
      (item): Stock => ({
        code: item.ISU_CD,
        name: item.ISU_NM,
        market: "KR",
        currency: "KRW",
        price: 0,
        stockType: "ETF",
      }),
    );

  return [...stockResults, ...etfResults];
});
