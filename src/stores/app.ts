import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const darkMode = ref(false)
  const locale = ref('zh-CN')

  function toggleDarkMode(): void {
    darkMode.value = !darkMode.value
  }

  function setLocale(l: string): void {
    locale.value = l
  }

  return { darkMode, locale, toggleDarkMode, setLocale }
})
