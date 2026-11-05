import type { H3Event } from "h3";
import { serverSupabaseUser } from "#supabase/server";

// 로그인한 사용자만 쓸 수 있는 API에서 호출한다.
// 공개 URL이라 누구나 외부 API(KRX 인증키 한도, Yahoo)를 대신 호출하게 두지 않기 위함이다.
// 주의: defineCachedEventHandler는 캐시가 맞으면 핸들러를 실행하지 않아 이 확인을 건너뛴다.
// 캐시는 defineCachedFunction으로 외부 호출에만 걸고, 핸들러는 defineEventHandler로 둔다.
export async function requireUser(event: H3Event) {
  const user = await serverSupabaseUser(event).catch(() => null);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "로그인이 필요합니다." });
  }
  return user;
}
