import type { RouteRecordRaw } from 'vue-router'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    meta: { title: 'Login' },
    component: () => import('@/views/login/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    meta: { title: 'Register' },
    component: () => import('@/views/register/Register.vue'),
  },
  {
    path: '/404',
    name: 'NotFound',
    meta: { hide: true },
    component: () => import('@/views/NotFound.vue'),
  },
  {
    path: '/oauth/:code',
    name: 'OauthLogin',
    meta: { title: 'OauthLogin', hide: true },
    component: () => import('@/views/oauth/OauthLogin.vue'),
  },
  {
    path: '/oauth/bind/:code',
    name: 'OauthBind',
    meta: { title: 'OauthBind', hide: true },
    component: () => import('@/views/oauth/OauthBind.vue'),
  },
]

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/my',
    name: 'My',
    redirect: '/',
    meta: { title: 'My', icon: 'UserFilled' },
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      {
        path: '/',
        name: 'MyInfo',
        meta: { title: 'Userinfo', icon: 'User', keepAlive: true },
        component: () => import('@/views/my/Info.vue'),
      },
      {
        path: 'peer',
        name: 'MyPeer',
        meta: { title: 'MyPeer', icon: 'Monitor', keepAlive: true },
        component: () => import('@/views/my/Peer.vue'),
      },
      {
        path: 'address_book_collection',
        name: 'MyAddressBookCollection',
        meta: { title: 'AddressBookCollection', icon: 'Collection', keepAlive: true },
        component: () => import('@/views/my/AddressBookCollection.vue'),
      },
      {
        path: 'address_book',
        name: 'MyAddressBookList',
        meta: { title: 'AddressBooks', icon: 'Notebook', keepAlive: true },
        component: () => import('@/views/my/AddressBookList.vue'),
      },
      {
        path: 'tag',
        name: 'MyTagList',
        meta: { title: 'Tags', icon: 'CollectionTag', keepAlive: true },
        component: () => import('@/views/my/TagList.vue'),
      },
      {
        path: 'shareRecord',
        name: 'MyShareRecordList',
        meta: { title: 'ShareRecord', icon: 'Share', keepAlive: true },
        component: () => import('@/views/my/ShareRecord.vue'),
      },
      {
        path: 'loginLog',
        name: 'MyLoginLog',
        meta: { title: 'LoginLog', icon: 'List', keepAlive: true },
        component: () => import('@/views/my/LoginLog.vue'),
      },
    ],
  },
  {
    path: '/user',
    name: 'User',
    redirect: '/user/index',
    meta: { title: 'System', icon: 'Setting' },
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      {
        path: 'peer',
        name: 'Peer',
        meta: { title: 'PeerManage', icon: 'Monitor', keepAlive: true },
        component: () => import('@/views/peer/PeerManage.vue'),
      },
      {
        path: 'group',
        name: 'UserGroup',
        meta: { title: 'GroupManage', icon: 'ChatRound', keepAlive: true },
        component: () => import('@/views/group/GroupManage.vue'),
      },
      {
        path: 'deviceGroup',
        name: 'DeviceGroup',
        meta: { title: 'DeviceGroupManage', icon: 'ChatRound', keepAlive: true },
        component: () => import('@/views/group/DeviceGroupManage.vue'),
      },
      {
        path: 'index',
        name: 'UserList',
        meta: { title: 'UserManage', icon: 'User', keepAlive: true },
        component: () => import('@/views/user/UserList.vue'),
      },
      {
        path: 'add',
        name: 'UserAdd',
        meta: { title: 'UserAdd', hide: true },
        component: () => import('@/views/user/UserEdit.vue'),
      },
      {
        path: 'edit/:id',
        name: 'UserEdit',
        meta: { title: 'UserEdit', hide: true },
        component: () => import('@/views/user/UserEdit.vue'),
      },
      {
        path: 'addressBookName',
        name: 'UserAddressBookName',
        meta: { title: 'AddressBookCollectionManage', icon: 'Collection', keepAlive: true },
        component: () => import('@/views/address_book/AddressBookCollection.vue'),
      },
      {
        path: 'addressBook',
        name: 'UserAddressBook',
        meta: { title: 'AddressBookManage', icon: 'Notebook', keepAlive: true },
        component: () => import('@/views/address_book/AddressBookList.vue'),
      },
      {
        path: 'tag',
        name: 'UserTag',
        meta: { title: 'TagsManage', icon: 'CollectionTag', keepAlive: true },
        component: () => import('@/views/tag/TagList.vue'),
      },
      {
        path: 'oauth',
        name: 'Oauth',
        meta: { title: 'OauthManage', icon: 'Link', keepAlive: true },
        component: () => import('@/views/oauth/OauthManage.vue'),
      },
      {
        path: 'userToken',
        name: 'UserToken',
        meta: { title: 'UserToken', icon: 'Ticket', keepAlive: true },
        component: () => import('@/views/user/UserToken.vue'),
      },
      {
        path: 'loginLog',
        name: 'LoginLog',
        meta: { title: 'LoginLog', icon: 'List', keepAlive: true },
        component: () => import('@/views/login/LoginLog.vue'),
      },
      {
        path: 'auditConn',
        name: 'AuditConn',
        meta: { title: 'AuditConnLog', icon: 'Tickets', keepAlive: true },
        component: () => import('@/views/audit/ConnList.vue'),
      },
      {
        path: 'auditFile',
        name: 'AuditFile',
        meta: { title: 'AuditFileLog', icon: 'Files', keepAlive: true },
        component: () => import('@/views/audit/FileList.vue'),
      },
      {
        path: 'shareRecord',
        name: 'ShareRecord',
        meta: { title: 'ShareRecord', icon: 'Share', keepAlive: true },
        component: () => import('@/views/share_record/ShareRecord.vue'),
      },
      {
        path: 'serverCmd',
        name: 'ServerCmd',
        meta: { title: 'ServerCmd', icon: 'Tools', keepAlive: true },
        component: () => import('@/views/rustdesk/ServerControl.vue'),
      },
    ],
  },
]

export const lastRoutes: RouteRecordRaw[] = [
  { path: '/:catchAll(.*)', redirect: '/404', meta: { hide: true } },
]

function resolveRoutePath(parentPath: string, childPath: string): string {
  if (childPath.startsWith('/')) return childPath
  return `${parentPath.replace(/\/$/, '')}/${childPath}`
}

export function filterRoutes(
  routes: RouteRecordRaw[],
  enableNames: string[],
): RouteRecordRaw[] {
  return routes
    .map((route) => {
      if (route.children && route.children.length > 0) {
        return {
          ...route,
          children: filterRoutes(route.children, enableNames),
        }
      }
      return { ...route }
    })
    .filter((route) => {
      if (route.children && route.children.length > 0) {
        return route.children.length > 0
      }
      return enableNames.includes(route.name as string)
    })
}

export function getFirstAvailableRoutePath(routes: RouteRecordRaw[]): string {
  for (const route of routes) {
    const visibleChildren = route.children?.filter((child) => !child.meta?.hide) || []
    if (visibleChildren.length > 0) {
      return resolveRoutePath(route.path, visibleChildren[0].path)
    }
    if (!route.meta?.hide) return route.path
  }
  return '/404'
}
