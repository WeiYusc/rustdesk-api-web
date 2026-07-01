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
import { useIsMobile } from '@/composables/useIsMobile'
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n'

const appStore = useAppStore()
const userStore = useUserStore()
const routeStore = useRouteStore()
const tagsStore = useTagsStore()
const route = useRoute()
const router = useRouter()

const { isMobile } = useIsMobile()
const collapsed = ref(false)
const drawerVisible = ref(false)

watch(isMobile, (mobile) => {
  if (mobile) {
    collapsed.value = false
  }
})

const siderWidth = computed(() => {
  if (isMobile.value) return Math.min(window.innerWidth * 0.78, 280)
  return 220
})

import {
  PersonCircleOutline,
  HardwareChipOutline,
  FileTrayStackedOutline,
  BookOutline,
  PricetagsOutline,
  ShareSocialOutline,
  ListOutline,
  SettingsOutline,
  PeopleOutline,
  LinkOutline,
  TicketOutline,
  DocumentTextOutline,
  FolderOpenOutline,
  ServerOutline,
} from '@vicons/ionicons5'
import type { Component } from 'vue'

const iconMap: Record<string, Component> = {
  UserFilled: PersonCircleOutline,
  User: PersonCircleOutline,
  Userinfo: PersonCircleOutline,
  Monitor: HardwareChipOutline,
  MyPeer: HardwareChipOutline,
  PeerManage: HardwareChipOutline,
  Collection: FileTrayStackedOutline,
  AddressBookCollection: FileTrayStackedOutline,
  AddressBookCollectionManage: FileTrayStackedOutline,
  Notebook: BookOutline,
  AddressBooks: BookOutline,
  AddressBookManage: BookOutline,
  CollectionTag: PricetagsOutline,
  Tags: PricetagsOutline,
  TagsManage: PricetagsOutline,
  Share: ShareSocialOutline,
  ShareRecord: ShareSocialOutline,
  List: ListOutline,
  LoginLog: ListOutline,
  Setting: SettingsOutline,
  System: SettingsOutline,
  ChatRound: PeopleOutline,
  GroupManage: PeopleOutline,
  DeviceGroupManage: PeopleOutline,
  UserManage: PeopleOutline,
  Link: LinkOutline,
  OauthManage: LinkOutline,
  Ticket: TicketOutline,
  UserToken: TicketOutline,
  Tickets: DocumentTextOutline,
  AuditConnLog: DocumentTextOutline,
  AuditFileLog: FolderOpenOutline,
  Files: FolderOpenOutline,
  Tools: ServerOutline,
  ServerCmd: ServerOutline,
}

function renderIcon(icon: string): (() => VNodeChild) | undefined {
  if (!icon) return undefined
  const IconComp = iconMap[icon]
  if (!IconComp) return undefined
  return () => h(NIcon, null, { default: () => h(IconComp) })
}

function menuTitle(route: RouteRecordRaw): string {
  return route.meta?.title ? appStore.t(`menu.${route.meta.title}`) || (route.meta.title as string) : (route.name as string)
}

function menuPath(parent: RouteRecordRaw, child?: RouteRecordRaw): string {
  if (!child) return parent.path
  return child.path?.startsWith('/') ? child.path : `${parent.path === '/' ? '' : parent.path}/${child.path}`.replace('//', '/')
}

function renderMenuLink(path: string, label: string): () => VNodeChild {
  return () => h(
    'a',
    {
      href: router.resolve(path).href,
      class: 'menu-link',
      onClick: (event: MouseEvent) => {
        event.stopPropagation()
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return
        }
        event.preventDefault()
        router.push(path)
        if (isMobile.value) {
          drawerVisible.value = false
        }
      },
    },
    label,
  )
}

function buildMenuOptions(routes: RouteRecordRaw[]): MenuOption[] {
  return routes
    .filter((r) => !r.meta?.hide)
    .map((r) => {
      const children = r.children
        ? r.children.filter((c) => !c.meta?.hide)
        : []
      const parentPath = menuPath(r)
      if (children.length > 0) {
        return {
          label: menuTitle(r),
          key: parentPath,
          icon: renderIcon(r.meta?.icon as string),
          children: children.map((c) => {
            const childPath = menuPath(r, c)
            return {
              label: renderMenuLink(childPath, menuTitle(c)),
              key: childPath,
              icon: renderIcon(c.meta?.icon as string),
            }
          }),
        }
      }
      return {
        label: renderMenuLink(parentPath, menuTitle(r)),
        key: parentPath,
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

const userMenuOptions = computed(() => [
  { label: appStore.t('menu.MyInfo'), key: 'info' },
  { type: 'divider', key: 'd1' },
  { label: appStore.t('common.logout'), key: 'logout' },
])

function handleUserMenu(key: string): void {
  if (key === 'info') {
    router.push('/')
  } else if (key === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

const localeOptions = SUPPORTED_LOCALES.map((l) => ({
  label: l.label,
  key: l.value,
}))

const currentLocaleLabel = computed(() => {
  const found = SUPPORTED_LOCALES.find((l) => l.value === appStore.locale)
  return found ? found.label : appStore.locale
})

function handleLocale(key: string): void {
  appStore.changeLocale(key as AppLocale)
}

function handleCloseTag(path: string, index: number): void {
  if (path === activeKey.value) {
    const nextTag = tagsStore.tags[index + 1] || tagsStore.tags[index - 1]
    tagsStore.removeTag(path)
    if (nextTag) router.push(nextTag.path)
    else router.push(routeStore.firstAvailablePath())
  } else {
    tagsStore.removeTag(path)
  }
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
        cacheable: !!route.meta?.keepAlive,
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
            <div class="breadcrumb-wrap">
              <NBreadcrumb>
                <NBreadcrumbItem v-for="item in breadcrumbItems" :key="item">
                  {{ appStore.t(`menu.${item}`) || item }}
                </NBreadcrumbItem>
              </NBreadcrumb>
            </div>
          </NSpace>
          <NSpace align="center">
            <NDropdown :options="localeOptions" trigger="click" @select="handleLocale">
              <NButton quaternary size="small">{{ currentLocaleLabel }}</NButton>
            </NDropdown>
            <NButton quaternary size="small" @click="appStore.toggleDarkMode()">
              {{ appStore.darkMode ? '🌙' : '☀️' }}
            </NButton>
            <NDropdown :options="userMenuOptions" trigger="click" @select="handleUserMenu">
              <NSpace align="center" style="cursor: pointer">
                <NAvatar v-if="userStore.avatar" :src="userStore.avatar" round size="small" />
                <NAvatar v-else round size="small">{{ (userStore.username || '?').charAt(0).toUpperCase() || '?' }}</NAvatar>
                <NText v-if="!isMobile">{{ userStore.nickname || userStore.username }}</NText>
              </NSpace>
            </NDropdown>
          </NSpace>
        </NSpace>
      </NLayoutHeader>

      <div class="tags-bar">
        <NSpace :size="4">
          <a
            v-for="(tag, index) in tagsStore.tags"
            :key="tag.path"
            class="tag-link"
            :class="{ 'tag-link-active': tag.path === activeKey }"
            :href="router.resolve(tag.path).href"
            @click="(event: MouseEvent) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault()
              router.push(tag.path)
            }"
          >
            {{ appStore.t(`menu.${tag.title}`) || tag.title }}
            <span v-if="tagsStore.tags.length > 1" class="tag-close" @click.prevent.stop="handleCloseTag(tag.path, index)">×</span>
          </a>
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
.breadcrumb-wrap {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.menu-link {
  display: block;
  width: 100%;
  color: inherit;
  text-decoration: none;
}
.menu-link:hover {
  color: inherit;
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
.tag-link {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border: 1px solid var(--n-border-color, #efeff5);
  border-radius: 999px;
  color: inherit;
  text-decoration: none;
  font-size: 12px;
  line-height: 22px;
  background: var(--n-color, transparent);
}
.tag-link-active {
  color: #fff;
  border-color: var(--primary-color, #18a058);
  background: var(--primary-color, #18a058);
}
.tag-link:hover {
  text-decoration: none;
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
