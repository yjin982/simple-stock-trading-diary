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

export default defineCachedEventHandler(
  async (event) => {
    const { name } = getQuery(event);
    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: "검색어(name)가 필요합니다.",
      });
    }

    const config = useRuntimeConfig();
    const basDd = getRecentWeekday();

    const [kospiItems, kosdaqItems] = await Promise.all([
      fetchKrxMarket(config.krxAuthKey, "KOSPI", basDd),
      fetchKrxMarket(config.krxAuthKey, "KOSDAQ", basDd),
    ]);

    const query = String(name).trim().toLowerCase();

    return [
      ...kospiItems.map((item) => ({ ...item, _exchange: "KOSPI" as const })),
      ...kosdaqItems.map((item) => ({ ...item, _exchange: "KOSDAQ" as const })),
    ]
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
  },
  {
    maxAge: 60 * 60 * 12,
    getKey: (event) => {
      const { name } = getQuery(event);
      return `stock-search:${getRecentWeekday()}:${String(name).toLowerCase().trim()}`;
    },
  },
);
