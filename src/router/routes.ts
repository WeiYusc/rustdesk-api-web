import type { RouteRecordRaw } from 'vue-router'

export const constantRoutes: RouteRecordRaw[] = []

export const asyncRoutes: RouteRecordRaw[] = []

export function filterRoutes(
  routes: RouteRecordRaw[],
  enableNames: string[],
): RouteRecordRaw[] {
  return routes
    .filter((route) => {
      if (route.children && route.children.length > 0) {
        return (
          enableNames.includes(route.name as string) ||
          route.children.some((r) => enableNames.includes(r.name as string))
        )
      }
      return enableNames.includes(route.name as string)
    })
    .map((route) => {
      if (route.children && route.children.length > 0) {
        return {
          ...route,
          children: filterRoutes(route.children, enableNames),
        }
      }
      return { ...route }
    })
}
