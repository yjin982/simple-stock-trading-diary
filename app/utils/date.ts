export const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function parseDateStr(dateStr: string): [number, number, number] {
  const parts = dateStr.split('-').map(Number)
  return [parts[0]!, parts[1]!, parts[2]!]
}

function toDateStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getDayOfWeek(dateStr: string): string {
  const [y, m, d] = parseDateStr(dateStr)
  return DAYS[new Date(y, m - 1, d).getDay()]
}

export function formatDateKo(dateStr: string): string {
  const [y, m, d] = parseDateStr(dateStr)
  return `${y}년 ${m}월 ${d}일`
}

export function formatTradeDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const [y, m, d] = parseDateStr(dateStr)
  const dow = DAYS[new Date(y, m - 1, d).getDay()]
  return `${m}/${String(d).padStart(2, '0')} (${dow})`
}

export function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = parseDateStr(dateStr)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - days)
  return toDateStr(dt)
}
