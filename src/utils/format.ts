import { i18n } from '@/i18n'

export function formatTime(ts: number | string | undefined | null, locale?: string): string {
  if (!ts && ts !== 0) return ''

  let date: Date
  if (typeof ts === 'string') {
    const trimmed = ts.trim()
    if (!trimmed) return ''
    const numericValue = Number(trimmed)
    if (Number.isFinite(numericValue)) {
      if (numericValue === 0) return ''
      date = numericValue < 10000000000 ? new Date(numericValue * 1000) : new Date(numericValue)
    } else {
      date = new Date(trimmed.replace(' ', 'T'))
    }
  } else {
    if (isNaN(ts) || ts === 0) return ''
    date = ts < 10000000000 ? new Date(ts * 1000) : new Date(ts)
  }

  if (isNaN(date.getTime())) return ''
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
