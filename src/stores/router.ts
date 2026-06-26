import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { asyncRoutes, lastRoutes, filterRoutes } from '@/router/routes'
import { router } from '@/router'

export const useRouteStore = defineStore('router', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const loaded = ref(false)

  function addRoutes(accessRouteNames: string[]): void {
    if (accessRouteNames.includes('*')) {
      routes.value = asyncRoutes
    } else {
      routes.value = filterRoutes(asyncRoutes, accessRouteNames)
    }
    routes.value.forEach((route) => {
      router.addRoute(route)
    })
    lastRoutes.forEach((route) => {
      router.addRoute(route)
    })
    loaded.value = true
  }

  function clearRoutes(): void {
    routes.value = []
    loaded.value = false
  }

  return { routes, loaded, addRoutes, clearRoutes }
})
