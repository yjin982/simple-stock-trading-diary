# USD/KRW 환율이 화면에 표시되지 않던 문제 조사 및 해결

## 문제 인식

`/api/stock/quote?symbols=USDKRW=X`를 통해 환율 값을 정상적으로 받아왔는데도, `holdings` 페이지 등 클라이언트 화면에는 환율 관련 값(USD 금액의 원화 환산 sub-value, 상단 환율 안내)이 렌더링되지 않는 현상이 보고됨.

- 클라이언트 측: `useExchangeRate()`가 반환하는 `usdKrw`가 계속 `null` → `krwEquiv()`가 항상 `null`을 반환해 화면에 아무 것도 안 뜸
- API를 직접 호출하면 정상적인 JSON이 오므로, "요청은 되는데 화면엔 안 뜬다"는 모순적인 상황이었음 → 서버 응답의 **내용**이 아니라 **키 이름**을 의심해야 했음

## 테스트한 방식

1. **API 직접 호출** — `curl "http://localhost:3000/api/stock/quote?symbols=USDKRW=X"`
   정상적으로 가격 정보가 담긴 JSON이 오긴 하는데, 응답 객체의 **키 이름이 호출할 때마다 다름**을 발견 (`"USDKRW=X"`일 때도 있고 `"KRW=X"`일 때도 있음).

2. **yahoo-finance2 라이브러리 단독 재현** — 프로젝트 `node_modules`를 그대로 이용해 임시 스크립트로 서버 코드를 거치지 않고 라이브러리 자체를 직접 호출:
   ```js
   import YahooFinance from "yahoo-finance2";
   const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
   for (let i = 0; i < 3; i++) {
     const raw = await yf.quote(["USDKRW=X"]);
     console.log(`run ${i}: symbol=${raw[0].symbol}`);
   }
   // run 0: symbol=USDKRW=X
   // run 1: symbol=KRW=X   ← 축약형으로 옴
   // run 2: symbol=USDKRW=X
   ```
   → 같은 심볼로 요청해도 Yahoo가 응답의 `symbol` 필드를 비일관적으로 준다는 것을 확인. 서버 코드나 라이브러리 버그가 아니라 **Yahoo 응답 자체의 비일관성**이 원인임을 특정.

3. **배치 조회 시 순서/개수 보존 여부 테스트** — `["AAPL", "USDKRW=X", "INVALIDXYZ123", "005930.KS"]`로 조회
   - 유효하지 않은 심볼(`INVALIDXYZ123`)은 응답 배열에서 조용히 빠지고 이후 심볼들이 인덱스가 하나씩 당겨짐을 확인 (요청 4개 → 응답 3개).
   - → "요청 배열과 응답 배열을 인덱스로 매칭"하는 수정 방식은 안전하지 않다는 근거 확보 (그래서 인덱스 매칭 대신 값 기반 역매핑을 선택).

4. **실행 중인 서버의 캐시 동작 재현** — 같은 요청을 짧은 간격으로 반복 호출해, `defineCachedEventHandler`의 15분 캐시(`getKey: stock-quote:USDKRW=X`) 때문에 Yahoo가 어쩌다 `"KRW=X"`로 응답한 시점의 결과가 그대로 15분간 고정되어 버리는 것을 확인. 서로 다른 심볼 조합(`USDKRW=X,AAPL` 등)으로 캐시를 우회해가며 재현.

## 원인

- `server/api/stock/quote.get.ts`가 응답 객체의 key로 Yahoo가 돌려준 `quote.symbol` 값을 그대로 사용 (`result[quote.symbol] = ...`).
- Yahoo Finance API가 `"USDKRW=X"`로 요청해도 `symbol` 필드를 `"USDKRW=X"` 또는 `"KRW=X"`로 비일관적으로 응답.
- `defineCachedEventHandler`의 15분 캐시 때문에, 어쩌다 `"KRW=X"`로 응답받은 결과가 그대로 15분간 캐시됨.
- 클라이언트(`useExchangeRate.ts`)는 정확한 문자열 `'USDKRW=X'`로만 조회(`priceMap.value['USDKRW=X']`)하므로, 캐시된 키가 `"KRW=X"`이면 `undefined` → `usdKrw` computed가 `null` → 화면에 아무 것도 안 뜸.

## 해결 방법

`server/api/stock/quote.get.ts`에 `resolveRequestedSymbol()`을 추가해, Yahoo가 어떤 형태로 응답하든 **항상 원래 요청한 심볼 문자열**로 결과를 키잉하도록 수정.

```ts
// Yahoo는 "USDKRW=X"로 요청해도 응답 symbol을 "KRW=X"처럼 축약형으로
// 돌려줄 때가 있다 (같은 심볼도 요청마다 비일관적). 응답을 요청 심볼 기준으로
// 매핑해야 클라이언트의 키 조회(priceMap[symbol])가 항상 일치한다.
function resolveRequestedSymbol(
  requested: string[],
  returnedSymbol: string,
): string {
  if (requested.includes(returnedSymbol)) return returnedSymbol;
  const match = requested.find(
    (s) => s.startsWith("USD") && s.endsWith("=X") && s.slice(3) === returnedSymbol,
  );
  return match ?? returnedSymbol;
}
```

- 인덱스 매칭이 아니라 **심볼 값 기준 역매핑**이라 유효하지 않은 심볼이 배치에 섞여도 안전함 (테스트 3번 근거).
- 일반 주식 심볼(`AAPL`, `005930.KS` 등)은 요청/응답 심볼이 항상 같으므로 `requested.includes()`에서 바로 매칭되어 영향 없음.

## 검증

1. **API 레벨**: 수정 전/후 동일 요청(`symbols=USDKRW=X`)을 반복 호출 → 수정 후에는 항상 `{"USDKRW=X": {...}}` 형태로 일관되게 응답하는 것을 확인.
2. **타입체크**: `npx vue-tsc --noEmit -p .` 통과.
3. **브라우저 확인**: dev 서버 재시작 후 `/holdings` 페이지를 실제로 로드해서 확인
   - 상단 안내 문구에 `환율 ₩1,448` 표시됨 (`UiPriceDelayNotice.vue`)
   - USD 보유 종목(Apple Inc., Alphabet Inc. 등)의 평균단가/현재가/평가금액 아래에 `≈ ₩249,049` 형태의 원화 환산 sub-value가 정상 표시됨
   - 네트워크 탭에서 `/api/stock/quote?symbols=USDKRW=X` 요청이 200으로 정상 처리되는 것을 확인

## 참고 (이번 수정 범위 밖)

`useExchangeRate()`는 호출될 때마다 독립된 상태(`usePriceMap` 인스턴스)를 새로 만드는 구조라, 같은 페이지에서 이 composable을 여러 컴포넌트(`holdings/index.vue`, `UiPriceDelayNotice.vue` 등)가 각자 호출하면 `/api/stock/quote?symbols=USDKRW=X` 요청이 그만큼 중복 발생함. 15분 서버 캐시 덕분에 실질적 비용은 작지만, 필요하면 `useState` 등으로 전역 공유해 중복 요청을 줄일 수 있음.
