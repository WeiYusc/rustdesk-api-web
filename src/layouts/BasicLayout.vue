<script setup lang="ts">
import { computed, h, ref, watch, type VNodeChild } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NIcon,
  NButton,
  NSpace,
  NDropdown,
  NAvatar,
  NText,
  NBreadcrumb,
  NBreadcrumbItem,
  NDrawer,
  type MenuOption,
} from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useRouteStore } from '@/stores/router'
import { useTagsStore } from '@/stores/tags'
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n'

const appStore = useAppStore()
const userStore = useUserStore()
const routeStore = useRouteStore()
const tagsStore = useTagsStore()
const route = useRoute()
const router = useRouter()

const collapsed = ref(false)
const drawerVisible = ref(false)
const isMobile = ref(window.innerWidth < 768)

function checkMobile(): void {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    collapsed.value = false
  }
}
window.addEventListener('resize', checkMobile)

const siderWidth = computed(() => {
  if (appStore.locale === 'fr') return 240
  return 210
})

function renderIcon(icon: string): (() => VNodeChild) | undefined {
  if (!icon) return undefined
  return () => h(NIcon, null, { default: () => icon })
}

function buildMenuOptions(routes: RouteRecordRaw[]): MenuOption[] {
  return routes
    .filter((r) => !r.meta?.hide)
    .map((r) => {
      const children = r.children
        ? r.children.filter((c) => !c.meta?.hide)
        : []
      if (children.length > 0) {
        return {
          label: r.meta?.title ? appStore.t(`menu.${r.meta.title}`) || (r.meta.title as string) : (r.name as string),
          key: r.path,
          icon: renderIcon(r.meta?.icon as string),
          children: children.map((c) => ({
            label: c.meta?.title ? appStore.t(`menu.${c.meta.title}`) || (c.meta.title as string) : (c.name as string),
            key: c.path?.startsWith('/') ? c.path : `${r.path === '/' ? '' : r.path}/${c.path}`.replace('//', '/'),
            icon: renderIcon(c.meta?.icon as string),
          })),
        }
      }
      return {
        label: r.meta?.title ? appStore.t(`menu.${r.meta.title}`) || (r.meta.title as string) : (r.name as string),
        key: r.path,
        icon: renderIcon(r.meta?.icon as string),
      }
    })
}

const menuOptions = computed(() => buildMenuOptions(routeStore.routes))
const activeKey = computed(() => route.path)

function handleMenuUpdate(key: string): void {
  router.push(key)
  if (isMobile.value) {
    drawerVisible.value = false
  }
}

const breadcrumbItems = computed(() => {
  const items: string[] = []
  const matched = route.matched
  matched.forEach((m) => {
    if (m.meta?.title && !m.meta?.hide) {
      items.push(m.meta.title as string)
    }
  })
  return items
})

const userMenuOptions = [
  { label: appStore.t('common.logout'), key: 'logout' },
]

function handleUserMenu(key: string): void {
  if (key === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

const localeOptions = SUPPORTED_LOCALES.map((l) => ({
  label: l.label,
  key: l.value,
}))

function handleLocale(key: string): void {
  appStore.changeLocale(key as AppLocale)
}

const includeRoutes = computed(() => tagsStore.cachedViews)

const title = computed(() => appStore.adminConfig.title || 'RustDesk API Admin')

watch(
  () => route.path,
  (path) => {
    if (path && !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/oauth') && path !== '/404') {
      tagsStore.addTag({
        name: route.name as string,
        path: route.path,
        title: (route.meta?.title as string) || (route.name as string),
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <NLayout has-sider position="absolute">
    <NLayoutSider
      v-if="!isMobile"
      bordered
      :collapsed="collapsed"
      collapse-mode="width"
      :collapsed-width="64"
      :width="siderWidth"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo-area" :class="{ 'logo-collapsed': collapsed }">
        <span v-if="!collapsed" class="logo-text">{{ title }}</span>
        <span v-else class="logo-text">R</span>
      </div>
      <NMenu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </NLayoutSider>

    <NDrawer v-if="isMobile" v-model:show="drawerVisible" :width="siderWidth" placement="left">
      <div class="logo-area">
        <span class="logo-text">{{ title }}</span>
      </div>
      <NMenu
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
      />
    </NDrawer>

    <NLayout>
      <NLayoutHeader bordered class="app-header">
        <NSpace align="center" justify="space-between" class="header-inner">
          <NSpace align="center">
            <NButton
              v-if="isMobile"
              quaternary
              circle
              @click="drawerVisible = true"
            >
              <template #icon><NIcon>☰</NIcon></template>
            </NButton>
            <NBreadcrumb>
              <NBreadcrumbItem v-for="item in breadcrumbItems" :key="item">
                {{ appStore.t(`menu.${item}`) || item }}
              </NBreadcrumbItem>
            </NBreadcrumb>
          </NSpace>
          <NSpace align="center">
            <NDropdown :options="localeOptions" trigger="click" @select="handleLocale">
              <NButton quaternary size="small">{{ appStore.locale }}</NButton>
            </NDropdown>
            <NButton quaternary size="small" @click="appStore.toggleDarkMode()">
              {{ appStore.darkMode ? '🌙' : '☀️' }}
            </NButton>
            <NDropdown :options="userMenuOptions" trigger="click" @select="handleUserMenu">
              <NSpace align="center" style="cursor: pointer">
                <NAvatar v-if="userStore.avatar" :src="userStore.avatar" round size="small" />
                <NAvatar v-else round size="small">{{ userStore.username.charAt(0).toUpperCase() }}</NAvatar>
                <NText>{{ userStore.nickname || userStore.username }}</NText>
              </NSpace>
            </NDropdown>
          </NSpace>
        </NSpace>
      </NLayoutHeader>

      <div class="tags-bar">
        <NSpace :size="4">
          <NButton
            v-for="tag in tagsStore.tags"
            :key="tag.path"
            :type="tag.path === activeKey ? 'primary' : 'default'"
            size="tiny"
            round
            @click="router.push(tag.path)"
          >
            {{ appStore.t(`menu.${tag.title}`) || tag.title }}
            <span v-if="tagsStore.tags.length > 1" class="tag-close" @click.stop="tagsStore.removeTag(tag.path)">×</span>
          </NButton>
        </NSpace>
      </div>

      <NLayoutContent class="app-content" :native-scrollbar="false">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="includeRoutes">
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped lang="scss">
.app-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}
.header-inner {
  width: 100%;
}
.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--n-border-color, #efeff5);
  overflow: hidden;
}
.logo-text {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.logo-collapsed .logo-text {
  font-size: 20px;
}
.tags-bar {
  padding: 6px 16px;
  border-bottom: 1px solid var(--n-border-color, #efeff5);
  overflow-x: auto;
}
.tag-close {
  margin-left: 4px;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
}
.tag-close:hover {
  opacity: 1;
}
.app-content {
  padding: 16px;
  min-height: calc(100vh - 56px - 37px);
}
</style>
