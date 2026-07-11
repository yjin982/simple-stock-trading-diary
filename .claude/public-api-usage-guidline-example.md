# KRX 시세/종목 API — Nuxt.js 사용 가이드라인

두 API 문서를 기반으로 작성한 Nuxt 3 프로젝트 연동 가이드입니다.

| 구분     | ① KRX상장종목정보 (금융위원회)                                                | ② KOSPI 시리즈 일별시세정보 (KRX)                      |
| -------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| 용도     | 회사명 → 종목코드/기본정보 검색                                               | KOSPI **지수** 일별 시세 (OHLC, 거래량 등)             |
| 제공처   | 공공데이터포털 (data.go.kr)                                                   | KRX Open API (data-dbg.krx.co.kr)                      |
| Endpoint | `https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo` | `https://data-dbg.krx.co.kr/svc/apis/idx/kospi_dd_trd` |
| 인증     | 쿼리 파라미터 `serviceKey`                                                    | HTTP 헤더 `AUTH_KEY`                                   |
| 형식     | GET / XML(기본) 또는 JSON                                                     | GET / JSON                                             |
| 갱신     | 일 1회                                                                        | '10.01.04 데이터부터 제공                              |

> ⚠️ **주의**: ②번 Spec 문서는 개별 종목 시세가 아니라 **KOSPI 지수 시세** API입니다.
> 개별 종목의 일별 시세가 필요하면 KRX Open API의 "유가증권 일별매매정보"(`/svc/apis/sto/stk_bydd_trd`)를 별도로 이용 신청해야 합니다.

---

## 1. 아키텍처 원칙: 인증키는 반드시 서버에서만

두 API 모두 인증키가 필요합니다. Nuxt 클라이언트(브라우저)에서 직접 호출하면:

1. **인증키가 브라우저에 노출**됩니다 (네트워크 탭에서 그대로 보임)
2. **CORS 에러**가 발생합니다 (두 API 모두 브라우저 호출을 허용하지 않음)

따라서 **Nuxt의 서버 라우트(`server/api/`)를 프록시로 사용**합니다. Nuxt는 Vite 기반 프레임워크지만 자체 백엔드 서버(Nitro)를 내장하고 있어, `server/api/` 폴더에 파일을 만들면 별도 백엔드 없이 API 엔드포인트가 생깁니다. Vue 컴포넌트 → `/api/...` (내 서버) → 외부 API 순서로 흐릅니다.

```
[브라우저/Vue 컴포넌트]
      │  useFetch('/api/stocks/search?name=삼성')
      ▼
[Nuxt 서버 라우트 (server/api/)]  ← 인증키는 여기서만 사용
      │  serviceKey / AUTH_KEY 첨부
      ▼
[data.go.kr / data-dbg.krx.co.kr]
```

---

## 2. 환경 설정

### 2-1. `.env` (git에 커밋 금지 — `.gitignore`에 추가)

```bash
# 공공데이터포털에서 발급받은 일반 인증키(Decoding 키 사용 권장)
NUXT_DATA_GO_KR_SERVICE_KEY=발급받은키
# KRX Open API 마이페이지에서 발급받은 인증키
NUXT_KRX_AUTH_KEY=발급받은키
```

> 💡 공공데이터포털은 **Encoding 키 / Decoding 키** 두 가지를 제공합니다.
> `$fetch`의 `query` 옵션은 값을 자동으로 URL 인코딩하므로 **Decoding 키**를 넣어야 이중 인코딩으로 인한 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`(에러코드 30)를 피할 수 있습니다.

### 2-2. `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 서버 전용 (클라이언트 번들에 포함되지 않음)
    dataGoKrServiceKey: "", // NUXT_DATA_GO_KR_SERVICE_KEY 로 자동 주입
    krxAuthKey: "", // NUXT_KRX_AUTH_KEY 로 자동 주입
  },
});
```

`runtimeConfig`의 최상위 키는 서버에서만 접근 가능합니다. `public: {}` 안에 넣으면 브라우저에 노출되므로 **인증키는 절대 `public`에 넣지 않습니다.**

---

## 3. API ① — 회사명으로 종목 검색 (KRX상장종목정보)

### 3-1. 요청 파라미터 (문서 기준)

필수는 `serviceKey` 하나뿐이고, 나머지는 전부 옵션입니다.

| 파라미터                  | 설명                         | 비고                             |
| ------------------------- | ---------------------------- | -------------------------------- |
| `serviceKey`              | 인증키                       | **필수**                         |
| `resultType`              | `xml`(기본) / `json`         | JSON 권장                        |
| `numOfRows` / `pageNo`    | 페이징                       | 기본값 있음                      |
| `basDt`                   | 기준일자와 일치 (`YYYYMMDD`) | **반드시 지정 권장** (아래 참고) |
| `beginBasDt` / `endBasDt` | 기준일자 범위 (이상 / 미만)  |                                  |
| `itmsNm`                  | 종목명 **완전 일치**         | "삼성전자"                       |
| `likeItmsNm`              | 종목명 **부분 일치**         | "삼성" → 삼성전자, 삼성SDI...    |
| `likeSrtnCd`              | 단축코드 부분 일치           | `A005930` 형식                   |
| `isinCd` / `likeIsinCd`   | ISIN코드 일치 / 부분 일치    |                                  |
| `corpNm` / `likeCorpNm`   | 법인명 일치 / 부분 일치      |                                  |
| `crno`                    | 법인등록번호 일치            | 외국회사는 미제공                |

**중요한 함정 2가지:**

- **`basDt`를 지정하지 않으면 과거 모든 기준일자의 데이터가 누적 조회**됩니다 (문서 샘플의 totalCount가 160만 건 이상). 같은 종목이 날짜별로 중복되므로, 최근 영업일 하나를 `basDt`로 지정하세요. 주말/공휴일에는 데이터가 없으니 결과가 비면 하루씩 앞당겨 재시도하는 로직이 필요합니다.
- **시장 구분(KOSPI/KOSDAQ/KONEX) 필터는 요청 파라미터에 없습니다.** 응답 필드 `mrktCtg`로만 제공되므로, KOSPI만 필요하면 **서버 라우트에서 응답을 필터링**해야 합니다.

### 3-2. 응답 주요 필드

`resultType=json` 기준 구조: `response.body.items.item[]`

| 필드      | 설명                                       |
| --------- | ------------------------------------------ |
| `basDt`   | 기준일자 (YYYYMMDD)                        |
| `srtnCd`  | 단축코드 (예: `A005930` — 앞에 `A`가 붙음) |
| `isinCd`  | ISIN코드 (예: `KR7005930003`)              |
| `mrktCtg` | 시장구분 (`KOSPI` / `KOSDAQ` / `KONEX`)    |
| `itmsNm`  | 종목명                                     |
| `crno`    | 법인등록번호                               |
| `corpNm`  | 법인명                                     |

### 3-3. 서버 라우트 구현

`server/api/stocks/search.get.ts`

```ts
interface KrxListedItem {
  basDt: string;
  srtnCd: string;
  isinCd: string;
  mrktCtg: string;
  itmsNm: string;
  crno: string;
  corpNm: string;
}

export default defineEventHandler(async (event) => {
  const { name, basDt } = getQuery(event);
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
        likeItmsNm: name, // 부분 일치 검색
        ...(basDt ? { basDt } : {}), // 기준일자 (YYYYMMDD)
      },
    },
  );

  // 에러코드 확인 (문서의 OpenAPI 에러코드 참고)
  const header = res?.response?.header;
  if (header?.resultCode !== "00") {
    throw createError({
      statusCode: 502,
      statusMessage: `KRX상장종목정보 오류 [${header?.resultCode}] ${header?.resultMsg}`,
    });
  }

  // 결과가 1건이면 객체, 0건이면 undefined일 수 있어 배열로 정규화
  const raw = res?.response?.body?.items?.item;
  const items: KrxListedItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // KOSPI만 필터링 (요청 파라미터로는 시장구분 필터 불가)
  return items.filter((item) => item.mrktCtg === "KOSPI");
});
```

### 3-4. 컴포넌트에서 호출

```vue
<script setup lang="ts">
const keyword = ref("");

const {
  data: stocks,
  status,
  error,
  execute,
} = await useFetch("/api/stocks/search", {
  query: { name: keyword },
  immediate: false, // 페이지 로드 시 자동 호출 안 함
  watch: false, // keyword 변경 시 자동 재호출 안 함 (버튼으로 제어)
});
</script>

<template>
  <form @submit.prevent="execute()">
    <input v-model="keyword" placeholder="회사명 (예: 삼성)" />
    <button type="submit" :disabled="status === 'pending'">검색</button>
  </form>

  <p v-if="error">{{ error.statusMessage }}</p>
  <ul v-else-if="stocks?.length">
    <li v-for="s in stocks" :key="s.isinCd">
      {{ s.itmsNm }} ({{ s.srtnCd }}) — {{ s.corpNm }}
    </li>
  </ul>
</template>
```

> Vue 경험 기준으로 보면 `useFetch`는 Nuxt가 제공하는 `fetch` 래퍼로, SSR 시 서버에서 한 번만 호출되고 결과가 클라이언트로 전달됩니다(중복 호출 방지). 검색처럼 사용자 액션으로 호출할 때는 `immediate: false` + `execute()` 패턴을 쓰면 됩니다.

---

## 4. API ② — KOSPI 지수 일별시세 (KRX Open API)

### 4-1. 요청/응답 명세 (문서 기준)

- **요청**: `basDd` (기준일자, `YYYYMMDD`) 단 하나. 종목/지수명 검색 파라미터 없음.
- **인증**: HTTP 헤더 `AUTH_KEY`
- **응답** `OutBlock_1[]`:

| 필드            | 설명     | 필드         | 설명         |
| --------------- | -------- | ------------ | ------------ |
| `BAS_DD`        | 기준일자 | `OPNPRC_IDX` | 시가         |
| `IDX_CLSS`      | 계열구분 | `HGPRC_IDX`  | 고가         |
| `IDX_NM`        | 지수명   | `LWPRC_IDX`  | 저가         |
| `CLSPRC_IDX`    | 종가     | `ACC_TRDVOL` | 거래량       |
| `CMPPREVDD_IDX` | 대비     | `ACC_TRDVAL` | 거래대금     |
| `FLUC_RT`       | 등락률   | `MKTCAP`     | 상장시가총액 |

해당 일자의 **KOSPI 계열 전체 지수**(KOSPI, KOSPI 200 등)가 배열로 반환되므로, 특정 지수만 필요하면 `IDX_NM`으로 필터링합니다. 모든 값이 `string` 타입이므로 숫자 연산 전 `Number()` 변환이 필요합니다.

### 4-2. 서버 라우트 구현

`server/api/kospi/index-daily.get.ts`

```ts
interface KospiIndexRow {
  BAS_DD: string;
  IDX_CLSS: string;
  IDX_NM: string;
  CLSPRC_IDX: string;
  CMPPREVDD_IDX: string;
  FLUC_RT: string;
  OPNPRC_IDX: string;
  HGPRC_IDX: string;
  LWPRC_IDX: string;
  ACC_TRDVOL: string;
  ACC_TRDVAL: string;
  MKTCAP: string;
}

export default defineEventHandler(async (event) => {
  const { basDd, idxNm } = getQuery(event);
  if (!basDd || !/^\d{8}$/.test(String(basDd))) {
    throw createError({
      statusCode: 400,
      statusMessage: "basDd(YYYYMMDD)가 필요합니다.",
    });
  }

  const config = useRuntimeConfig();

  const res = await $fetch<{ OutBlock_1: KospiIndexRow[] }>(
    "https://data-dbg.krx.co.kr/svc/apis/idx/kospi_dd_trd",
    {
      query: { basDd },
      headers: { AUTH_KEY: config.krxAuthKey },
    },
  );

  const rows = res?.OutBlock_1 ?? [];
  // 지수명 필터 (예: idxNm=코스피 → "코스피", "코스피 200" 등 부분 일치)
  return idxNm ? rows.filter((r) => r.IDX_NM.includes(String(idxNm))) : rows;
});
```

### 4-3. 두 API 조합 예시

회사명 검색(①) → 종목 선택 → 지수 시세(②) 표시 같은 흐름이면, 서버 라우트를 각각 두고 컴포넌트에서 순차 호출하면 됩니다. ②는 지수 데이터이므로 개별 종목 시세와는 무관하다는 점만 유의하세요.

---

## 5. 운영 시 주의사항

**데이터 갱신 시점** — 전일 데이터는 익일 오전 8시경 갱신됩니다(일 1회). "오늘" 날짜로 조회하면 데이터가 없으므로, 기본값은 **직전 영업일**로 잡고, 빈 응답이면 하루씩 앞당겨 재시도하세요 (주말·공휴일 대응).

**트래픽 제한** — ①은 초당 최대 30 TPS, 공공데이터포털 개발계정은 일일 호출 한도가 있습니다. ②도 계정별 호출 제한이 있습니다. 사용자 입력마다 호출하지 말고 **디바운스**(입력 후 300ms 대기)를 적용하고, 자주 조회되는 데이터는 서버 라우트에서 캐싱하세요:

```ts
// Nitro 내장 캐시 — 같은 날짜 요청은 1시간 동안 재사용
export default defineCachedEventHandler(
  async (event) => {
    // ... 위와 동일한 로직
  },
  { maxAge: 60 * 60, getKey: (event) => getQuery(event).basDd as string },
);
```

**에러코드 대응 (①, 문서 2장 기준)** — 응답 body가 아닌 `response.header.resultCode`로 판단합니다:

| 코드 | 의미                   | 대응                                |
| ---- | ---------------------- | ----------------------------------- |
| `00` | 정상                   | —                                   |
| `10` | 잘못된 요청 파라미터   | 파라미터명/형식 확인                |
| `22` | 요청제한횟수 초과      | 캐싱 도입, 한도 상향 신청           |
| `30` | 등록되지 않은 서비스키 | 키 값·인코딩(Decoding 키 사용) 확인 |
| `31` | 기한만료된 서비스키    | 공공데이터포털에서 연장 신청        |
| `32` | 등록되지 않은 IP       | 포털에 서버 IP 등록                 |

**XML 폴백** — ①은 `resultType=json`을 지정해도 인증 실패 등 일부 에러는 XML로 응답할 수 있습니다. `$fetch`가 JSON 파싱에 실패하면 원문을 로그로 남겨 확인하세요.

**타입 관리** — 두 API 모두 응답 필드가 전부 문자열입니다. 위 예시처럼 interface를 정의해두고, 숫자가 필요한 필드는 표시 직전에 변환하는 것을 권장합니다.

---

## 6. 체크리스트

- [ ] 공공데이터포털에서 "금융위원회\_KRX상장종목정보" 활용신청 + 인증키 발급
- [ ] KRX Open API 가입 → 인증키 발급 → "KOSPI 시리즈 일별시세정보" 이용 신청 (승인 ~1일)
- [ ] `.env`에 키 2개 등록, `.gitignore` 확인
- [ ] `nuxt.config.ts`의 `runtimeConfig`에 서버 전용 키 선언 (`public` 금지)
- [ ] `server/api/` 프록시 라우트 2개 작성
- [ ] `basDt`/`basDd` 영업일 처리 + 빈 응답 재시도 로직
- [ ] KOSPI 필터링(`mrktCtg === 'KOSPI'`) 서버 측 적용
- [ ] 캐싱(`defineCachedEventHandler`) + 검색 디바운스 적용
