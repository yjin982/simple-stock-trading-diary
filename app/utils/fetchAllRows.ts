export type RowsPage<T> = {
  data: T[] | null
  error: { message: string } | null
  count?: number | null
}

// Supabase(PostgREST)는 한 번에 돌려주는 행 수에 상한(기본 1000, 프로젝트 설정에 따라 다름)이 있어
// 그냥 select하면 오래된 행이 에러 없이 잘린다. range로 끝까지 나눠 읽는다.
// 상한이 pageSize보다 작게 설정돼 있어도 빠지는 행이 없도록, 다음 시작 위치는 실제로 받은 행 수로 정한다.
// 첫 요청에서 받은 전체 건수(count)와 다 읽은 건수가 다르면 계산이 틀어지므로 에러로 돌려준다.
export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number, withCount: boolean) => PromiseLike<RowsPage<T>>,
  pageSize = 1000,
): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = []
  let total = Infinity

  while (rows.length < total) {
    const from = rows.length
    const isFirst = from === 0
    const { data, error, count } = await fetchPage(from, from + pageSize - 1, isFirst)
    if (error) return { rows: [], error: error.message }
    if (isFirst && count != null) total = count
    if (!data?.length) break
    rows.push(...data)
  }

  if (total !== Infinity && rows.length !== total) {
    return { rows: [], error: `거래 내역을 모두 불러오지 못했습니다. (${rows.length}/${total}건)` }
  }
  return { rows, error: null }
}
