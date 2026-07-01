import type { UserSummary } from '@/types'

export function formatUserSummary(userId: number, user?: UserSummary | null): string {
  if (!user || !user.id) return `#${userId}`
  const displayName = user.nickname || user.username || `#${user.id}`
  const username = user.username && user.username !== displayName ? ` / ${user.username}` : ''
  return `${displayName}${username} (#${user.id})`
}
