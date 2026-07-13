import type { Stock } from "~/types";

interface KrxListedItem {
  basDt: string;
  srtnCd: string;
  isinCd: string;
  mrktCtg: 'KOSPI' | 'KOSDAQ' | string;
  itmsNm: string;
  crno: string;
  corpNm: string;
}

function getRecentWeekday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2); // API는 당일 데이터 미제공, 전일부터 시작
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() - 3); // 일요일 → 목요일
  if (day === 6) d.setDate(d.getDate() - 2); // 토요일 → 목요일
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export default defineCachedEventHandler(async (event) => {
  const { name } = getQuery(event);
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "검색어(name)가 필요합니다.",
    });
  }

  const config = useRuntimeConfig();

  const res = await $fetch<any>(
    "https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo",
    {
      query: {
        serviceKey: config.dataGoKrServiceKey,
        resultType: "json",
        numOfRows: 100,
        pageNo: 1,
        basDt: getRecentWeekday(),
        likeItmsNm: name,
      },
    },
  );

  const header = res?.response?.header;
  if (header?.resultCode !== "00") {
    throw createError({
      statusCode: 502,
      statusMessage: `KRX상장종목정보 오류 [${header?.resultCode}] ${header?.resultMsg}`,
    });
  }

  const raw = res?.response?.body?.items?.item;
  const items: KrxListedItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return items
    .filter((item) => item.mrktCtg === "KOSPI" || item.mrktCtg === "KOSDAQ")
    .map(
      (item): Stock => ({
        code: item.srtnCd.replace(/^A/, ""),
        name: item.itmsNm,
        market: "KR",
        exchange: item.mrktCtg as 'KOSPI' | 'KOSDAQ',
        currency: "KRW",
        price: 0,
      }),
    );
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { name } = getQuery(event);
    return `stock-search:${getRecentWeekday()}:${String(name).toLowerCase().trim()}`;
  },
});
