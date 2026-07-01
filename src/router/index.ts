import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { constantRoutes } from './routes'
import { getToken, removeToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { useRouteStore } from '@/stores/router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes as RouteRecordRaw[],
})

const WHITE_LIST = ['/login', '/register', '/404', '/oauth']

router.beforeEach(async (to, _from, next) => {
  const token = getToken()
  if (!token) {
    if (WHITE_LIST.some((p) => to.path.startsWith(p))) {
      next()
    } else {
      next('/login')
    }
    return
  }

  const userStore = useUserStore()
  const routeStore = useRouteStore()

  if (!userStore.username) {
    const ok = await userStore.info()
    if (!ok) {
      if (WHITE_LIST.some((p) => to.path.startsWith(p))) {
        removeToken()
        next()
        return
      }
      userStore.logout()
      next('/login')
      return
    }
    next({ ...to, replace: true })
    return
  }

  if (!routeStore.loaded && userStore.routeNames.length === 0) {
    next('/login')
    return
  }

  if (to.path === '/login') {
    next(routeStore.firstAvailablePath())
    return
  }

  next()
})
