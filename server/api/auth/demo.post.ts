import { serverSupabaseClient } from "#supabase/server";

// "데모 계정으로 체험하기" 버튼용 로그인.
// 데모 비밀번호를 브라우저 번들(runtimeConfig.public)에 넣지 않도록 서버에서 대신 로그인하고,
// 브라우저에는 세션 토큰만 돌려준다 (데모로 로그인한 브라우저라면 어차피 갖게 되는 값).
// 데모 계정은 누구나 쓰도록 공개한 것이라 이 API는 로그인 없이 호출할 수 있다.
export default defineEventHandler(async (event) => {
  const { demoEmail, demoPassword } = useRuntimeConfig(event);
  if (!demoEmail || !demoPassword) {
    throw createError({
      statusCode: 503,
      statusMessage: "데모 계정이 설정되어 있지 않습니다.",
    });
  }

  const client = await serverSupabaseClient(event);
  const { data, error } = await client.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (error || !data.session) {
    throw createError({
      statusCode: 502,
      statusMessage: "데모 계정으로 로그인하지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
});
