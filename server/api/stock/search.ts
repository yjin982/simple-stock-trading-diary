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

// 전일 기준 영업일 YYYYMMDD
function getRecentWeekday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() - 2); // 일 → 금
  if (day === 6) d.setDate(d.getDate() - 1); // 토 → 금
  return d.toISOString().slice(0, 10).replace(/-/g, "");
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
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "검색어(name)가 필요합니다.",
    });
  }

  const basDd = getRecentWeekday();
  const [allStocks, allEtfs] = await Promise.all([
    fetchAllKrStocks(basDd),
    fetchAllKrEtfs(basDd),
  ]);
  const query = String(name).trim().toLowerCase();

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
