import YahooFinance from "yahoo-finance2";

// v4부터 인스턴스마다 Yahoo 인증값(crumb)·요청 큐를 따로 가진다.
// API마다 인스턴스를 만들면 인증 요청도 그만큼 늘어나므로 서버 전체에서 하나를 같이 쓴다.
export const yahooFinance = new YahooFinance();
