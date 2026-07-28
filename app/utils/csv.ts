import type { Trade } from '~/types'
import { todayKST } from './date'

const CSV_HEADERS = [
  '거래일', '종목명', '종목코드', '시장', '거래소',
  '거래구분', '단가', '수량', '거래금액', '통화', '계좌', '메모',
]

function escapeCell(value: string | number | undefined | null): string {
  const str = value == null ? '' : String(value)
  // 쉼표, 큰따옴표, 줄바꿈이 포함된 경우 큰따옴표로 감쌈
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function tradeToRow(trade: Trade): string {
  const cells = [
    trade.tradeDate,
    trade.stockName,
    trade.stockCode,
    trade.market,
    trade.exchange ?? '',
    trade.type === 'BUY' ? '매수' : '매도',
    trade.price,
    trade.quantity,
    trade.price * trade.quantity,
    trade.currency,
    trade.accountName ?? '',
    trade.memo ?? '',
  ]
  return cells.map(escapeCell).join(',')
}

export function buildCsv(trades: Trade[]): string {
  const rows = [CSV_HEADERS.join(','), ...trades.map(tradeToRow)]
  // UTF-8 BOM — Excel에서 한글 깨짐 방지
  return '﻿' + rows.join('\r\n')
}

export function downloadCsv(trades: Trade[], startDate: string, endDate: string, isAllPeriod: boolean) {
  const today = todayKST()
  const filename = isAllPeriod
    ? `매매이력_전체_${today}.csv`
    : `매매이력_${startDate}_${endDate}.csv`

  const csv = buildCsv(trades)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
