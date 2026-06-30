import { i18n } from '@/i18n'

function validDateOrNull(date: Date): Date | null {
  return Number.isNaN(date.getTime()) ? null : date
}

export function parseTimeValue(ts: number | string | undefined | null): Date | null {
  if (ts === undefined || ts === null) return null

  if (typeof ts === 'number') {
    if (!Number.isFinite(ts) || ts === 0) return null
    const date = ts < 10000000000 ? new Date(ts * 1000) : new Date(ts)
    return validDateOrNull(date)
  }

  const trimmed = ts.trim()
  if (!trimmed) return null

  const numericValue = Number(trimmed)
  if (Number.isFinite(numericValue)) {
    if (numericValue === 0) return null
    const date = numericValue < 10000000000 ? new Date(numericValue * 1000) : new Date(numericValue)
    return validDateOrNull(date)
  }

  const isoDate = validDateOrNull(new Date(trimmed))
  if (isoDate) return isoDate

  const legacyDate = validDateOrNull(new Date(trimmed.replace(' ', 'T')))
  if (legacyDate) return legacyDate

  return null
}

export function formatTime(ts: number | string | undefined | null, locale?: string): string {
  const date = parseTimeValue(ts)
  if (!date) return ''

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
