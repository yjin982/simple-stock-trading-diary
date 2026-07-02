export function paginateGroups<T extends { trades: unknown[] }>(groups: T[], limit: number): T[] {
  let count = 0
  const result: T[] = []
  for (const group of groups) {
    if (count >= limit) break
    result.push(group)
    count += group.trades.length
  }
  return result
}
