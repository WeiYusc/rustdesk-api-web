import { createI18n, type I18nOptions } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export type AppLocale = 'en' | 'zh-CN' | 'zh-TW' | 'fr' | 'ko' | 'ru' | 'es'

export const SUPPORTED_LOCALES: { value: AppLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'fr', label: 'Français' },
  { value: 'ko', label: '한국어' },
  { value: 'ru', label: 'Русский' },
  { value: 'es', label: 'Español' },
]

const messages: I18nOptions['messages'] = {
  en,
  'zh-CN': zhCN,
}

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages,
})

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}
