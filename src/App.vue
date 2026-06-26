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
  enUS,
  dateEnUS,
} from 'naive-ui'
import { computed } from 'vue'
import { useAppStore } from './stores/app'
import GlobalSetup from './components/GlobalSetup.vue'

const appStore = useAppStore()
const theme = computed(() => (appStore.darkMode ? darkTheme : null))
const locale = computed(() => (appStore.locale === 'zh-CN' || appStore.locale === 'zh-TW' ? zhCN : enUS))
const dateLocale = computed(() => (appStore.locale === 'zh-CN' || appStore.locale === 'zh-TW' ? dateZhCN : dateEnUS))
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
