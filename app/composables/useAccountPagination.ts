export function useAccountPagination(pageSize = 5) {
  const currentPages = reactive<Record<string, number>>({})

  function resetAll() {
    Object.keys(currentPages).forEach((k) => delete currentPages[k])
  }

  function getCurrentPage(key: string): number {
    return currentPages[key] ?? 1
  }

  function setCurrentPage(key: string, page: number) {
    currentPages[key] = page
  }

  function getTotalPages(count: number): number {
    return Math.max(1, Math.ceil(count / pageSize))
  }

  function getDisplayItems<T>(items: T[], key: string): T[] {
    const page = getCurrentPage(key)
    return items.slice((page - 1) * pageSize, page * pageSize)
  }

  function getPageNumbers(count: number, key: string): number[] {
    const total = getTotalPages(count)
    const current = getCurrentPage(key)
    const start = total <= 5 ? 1 : Math.max(1, Math.min(current - 2, total - 4))
    const end = Math.min(total, start + 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  return { resetAll, getCurrentPage, setCurrentPage, getTotalPages, getDisplayItems, getPageNumbers }
}
