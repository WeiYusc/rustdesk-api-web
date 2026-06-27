import { i18n } from '@/i18n'

export function formatTime(ts: number | string | undefined | null, locale?: string): string {
  if (!ts && ts !== 0) return ''
  const num = typeof ts === 'string' ? parseInt(ts, 10) : ts
  if (isNaN(num) || num === 0) return ''
  const date = num < 10000000000 ? new Date(num * 1000) : new Date(num)
  const loc = locale || i18n.global.locale.value
  return new Intl.DateTimeFormat(loc, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date)
}

export function formatTimeOrDash(ts: number | string | undefined | null, locale?: string): string {
  const result = formatTime(ts, locale)
  return result || '-'
}
