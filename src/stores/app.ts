import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n, setLocale, type AppLocale } from '@/i18n'
import { setWcConfig } from '@/utils/auth'
import { adminConfig as getAdminConfig, serverConfig as getServerConfig } from '@/api/config'
import type { AdminConfig, ServerConfig } from '@/types'

const DARK_KEY = 'app_dark_mode'
const LOCALE_KEY = 'app_locale'

function loadDarkMode(): boolean {
  const stored = localStorage.getItem(DARK_KEY)
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function loadLocale(): AppLocale {
  return (localStorage.getItem(LOCALE_KEY) as AppLocale) || 'zh-CN'
}

export const useAppStore = defineStore('app', () => {
  const darkMode = ref(loadDarkMode())
  const locale = ref<AppLocale>(loadLocale())
  const adminConfig = ref<AdminConfig>({ title: 'RustDesk API Admin' })
  const serverConfig = ref<ServerConfig | null>(null)
  const configLoaded = ref(false)

  function applyDarkMode(): void {
    document.documentElement.classList.toggle('dark', darkMode.value)
  }

  function toggleDarkMode(): void {
    darkMode.value = !darkMode.value
    localStorage.setItem(DARK_KEY, String(darkMode.value))
    applyDarkMode()
  }

  function changeLocale(l: AppLocale): void {
    locale.value = l
    localStorage.setItem(LOCALE_KEY, l)
    setLocale(l)
  }

  async function loadAdminConfig(): Promise<void> {
    try {
      const res = await getAdminConfig()
      adminConfig.value = res.data
    } catch {
      // ignore on error
    }
  }

  async function loadRustdeskConfig(): Promise<void> {
    try {
      const res = await getServerConfig()
      serverConfig.value = res.data
      setWcConfig({
        id_server: res.data.id_server,
        key: res.data.key,
        api_server: res.data.api_server,
      })
    } catch {
      // ignore on error
    }
  }

  async function initConfig(): Promise<void> {
    if (configLoaded.value) return
    configLoaded.value = true
    await Promise.all([loadAdminConfig(), loadRustdeskConfig()])
  }

  applyDarkMode()

  return {
    darkMode,
    locale,
    adminConfig,
    serverConfig,
    configLoaded,
    toggleDarkMode,
    changeLocale,
    loadAdminConfig,
    loadRustdeskConfig,
    initConfig,
    t: i18n.global.t,
  }
})
