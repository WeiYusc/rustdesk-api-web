export function formatTime(ts: number | string | undefined | null): string {
  if (!ts && ts !== 0) return ''
  const num = typeof ts === 'string' ? parseInt(ts, 10) : ts
  if (isNaN(num) || num === 0) return ''
  if (num < 10000000000) {
    return new Date(num * 1000).toLocaleString()
  }
  return new Date(num).toLocaleString()
}

export function formatTimeOrDash(ts: number | string | undefined | null): string {
  const result = formatTime(ts)
  return result || '-'
}
