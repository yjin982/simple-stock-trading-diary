import { describe, expect, it } from "vitest";
import { fetchAllRows, type RowsPage } from "~/utils/fetchAllRows";

// range(from, to) 요청에 서버처럼 응답하는 가짜 테이블. maxRows는 Supabase의 최대 행 수 설정.
function fakeTable(total: number, maxRows: number) {
  const table = Array.from({ length: total }, (_, i) => i);
  const calls: Array<[number, number]> = [];
  const fetchPage = async (from: number, to: number, withCount: boolean): Promise<RowsPage<number>> => {
    calls.push([from, to]);
    const end = Math.min(to + 1, from + maxRows);
    return { data: table.slice(from, end), error: null, count: withCount ? total : null };
  };
  return { table, calls, fetchPage };
}

describe("fetchAllRows", () => {
  it("페이지 크기를 넘는 행을 빠짐없이 순서대로 읽는다", async () => {
    const { table, calls, fetchPage } = fakeTable(25, 1000);
    const result = await fetchAllRows(fetchPage, 10);

    expect(result).toEqual({ rows: table, error: null });
    expect(calls).toEqual([
      [0, 9],
      [10, 19],
      [20, 29],
    ]);
  });

  it("서버 최대 행 수가 페이지 크기보다 작아도 빠지는 행이 없다", async () => {
    const { table, fetchPage } = fakeTable(25, 4);
    const result = await fetchAllRows(fetchPage, 10);

    expect(result.rows).toEqual(table);
    expect(result.error).toBeNull();
  });

  it("행이 정확히 페이지 크기의 배수여도 끝에서 멈춘다", async () => {
    const { calls, fetchPage } = fakeTable(20, 1000);
    const result = await fetchAllRows(fetchPage, 10);

    expect(result.rows).toHaveLength(20);
    expect(calls).toHaveLength(2);
  });

  it("행이 없으면 빈 배열", async () => {
    const { fetchPage } = fakeTable(0, 1000);

    expect(await fetchAllRows(fetchPage, 10)).toEqual({ rows: [], error: null });
  });

  it("중간에 에러가 나면 일부만 돌려주지 않고 에러를 돌려준다", async () => {
    const result = await fetchAllRows<number>(async (from) =>
      from === 0
        ? { data: [1, 2], error: null, count: 4 }
        : { data: null, error: { message: "network error" } },
      2,
    );

    expect(result).toEqual({ rows: [], error: "network error" });
  });

  it("다 읽은 건수가 전체 건수보다 적으면 에러", async () => {
    // 읽는 도중 다른 곳에서 행이 삭제된 경우처럼, 빈 페이지가 먼저 오는 상황
    const result = await fetchAllRows<number>(async (from) =>
      from === 0 ? { data: [1, 2], error: null, count: 5 } : { data: [], error: null },
      2,
    );

    expect(result.rows).toEqual([]);
    expect(result.error).toContain("2/5");
  });
});
