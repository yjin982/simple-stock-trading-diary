// 서버 API(createError)가 돌려준 오류 메시지를 꺼낸다.
// h3는 한글 statusMessage를 HTTP 상태 문구(statusText)에 넣지 못해 "."으로 바꾸므로,
// FetchError.statusMessage가 아니라 응답 본문(data)의 statusMessage를 읽어야 한다.
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { statusMessage?: unknown } } | null | undefined)?.data
  const message = data?.statusMessage
  return typeof message === 'string' && message.trim() ? message : fallback
}
