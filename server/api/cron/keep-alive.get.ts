import { serverSupabaseClient } from "#supabase/server";

// Supabase 무료 플랜은 7일간 요청이 없으면 프로젝트를 휴면시키므로
// Vercel Cron(vercel.json)이 이 라우트를 매일 호출해 가벼운 select를 보낸다.
// RLS 때문에 빈 배열이 반환돼도 요청은 DB까지 도달하므로 활동으로 기록된다.
export default defineEventHandler(async (event) => {
  // Vercel은 CRON_SECRET 환경변수가 있으면 "Authorization: Bearer <값>" 헤더를 붙여 호출한다.
  // 공개 URL이라 외부 호출을 막기 위해 시크릿이 없거나 일치하지 않으면 거부한다.
  const { cronSecret } = useRuntimeConfig(event);
  if (!cronSecret || getHeader(event, "authorization") !== `Bearer ${cronSecret}`) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const client = await serverSupabaseClient(event);
  const { error } = await client.from("accounts").select("id").limit(1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { ok: true, at: new Date().toISOString() };
});
