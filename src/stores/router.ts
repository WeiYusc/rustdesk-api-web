import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { asyncRoutes, lastRoutes, filterRoutes, getFirstAvailableRoutePath } from '@/router/routes'
import { router } from '@/router'

export const useRouteStore = defineStore('router', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const loaded = ref(false)
  const removeCallbacks: Array<() => void> = []

  function resetDynamicRoutes(): void {
    while (removeCallbacks.length > 0) {
      removeCallbacks.pop()?.()
    }
  }

  function addRoutes(accessRouteNames: string[]): void {
    resetDynamicRoutes()
    if (accessRouteNames.includes('*')) {
      routes.value = asyncRoutes
    } else {
      routes.value = filterRoutes(asyncRoutes, accessRouteNames)
    }
    routes.value.forEach((route) => {
      removeCallbacks.push(router.addRoute(route))
    })
    lastRoutes.forEach((route) => {
      removeCallbacks.push(router.addRoute(route))
    })
    loaded.value = true
  }

  function firstAvailablePath(): string {
    return getFirstAvailableRoutePath(routes.value)
  }

  function clearRoutes(): void {
    resetDynamicRoutes()
    routes.value = []
    loaded.value = false
  }

  return { routes, loaded, addRoutes, firstAvailablePath, clearRoutes }
})
