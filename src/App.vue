<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  darkTheme,
  zhCN,
  dateZhCN,
  zhTW,
  dateZhTW,
  enUS,
  dateEnUS,
  frFR,
  dateFrFR,
  koKR,
  dateKoKR,
  ruRU,
  dateRuRU,
  esAR,
  dateEsAR,
} from 'naive-ui'
import { computed } from 'vue'
import { useAppStore } from './stores/app'
import GlobalSetup from './components/GlobalSetup.vue'

const appStore = useAppStore()
const theme = computed(() => (appStore.darkMode ? darkTheme : null))
const locale = computed(() => {
  switch (appStore.locale) {
    case 'zh-CN':
      return zhCN
    case 'zh-TW':
      return zhTW
    case 'fr':
      return frFR
    case 'ko':
      return koKR
    case 'ru':
      return ruRU
    case 'es':
      return esAR
    default:
      return enUS
  }
})
const dateLocale = computed(() => {
  switch (appStore.locale) {
    case 'zh-CN':
      return dateZhCN
    case 'zh-TW':
      return dateZhTW
    case 'fr':
      return dateFrFR
    case 'ko':
      return dateKoKR
    case 'ru':
      return dateRuRU
    case 'es':
      return dateEsAR
    default:
      return dateEnUS
  }
})
</script>

<template>
  <NConfigProvider :theme="theme" :locale="locale" :date-locale="dateLocale">
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <GlobalSetup>
              <RouterView />
            </GlobalSetup>
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
