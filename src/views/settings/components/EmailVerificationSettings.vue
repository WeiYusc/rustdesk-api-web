<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard, NForm, NFormItem, NSwitch, NInputNumber, NButton, NSpace,
  NText, NAlert, useMessage,
} from 'naive-ui'
import { getEmailVerificationSettings, getSmtpSettings, saveEmailVerificationSettings } from '@/api/settings'
import type { EmailVerificationSettings, SmtpSettings } from '@/types'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const settings = reactive<EmailVerificationSettings>({
  enabled: false,
  require_for_register: false,
  require_for_email_change: false,
  require_for_login: false,
  code_ttl_minutes: 10,
  resend_cooldown_seconds: 60,
  daily_send_limit_per_user: 10,
})
const smtpSettings = reactive<SmtpSettings>({
  enabled: false,
  host: '',
  port: 587,
  security: 'starttls',
  username: '',
  password: '',
  has_password: false,
  from_email: '',
  from_name: '',
  reply_to: '',
  timeout_seconds: 10,
  insecure_skip_verify: false,
})
const emailCodeRequired = computed(() => settings.enabled && (settings.require_for_register || settings.require_for_email_change || settings.require_for_login))
const smtpReady = computed(() => (
  smtpSettings.enabled
  && !!smtpSettings.host
  && !!smtpSettings.port
  && !!smtpSettings.from_email
  && (!smtpSettings.username || smtpSettings.has_password || !!smtpSettings.password)
))

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const [emailRes, smtpRes] = await Promise.allSettled([getEmailVerificationSettings(), getSmtpSettings()])
    if (emailRes.status === 'fulfilled') {
      Object.assign(settings, emailRes.value.data)
    }
    if (smtpRes.status === 'fulfilled') {
      Object.assign(smtpSettings, smtpRes.value.data)
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleSave(): Promise<void> {
  saving.value = true
  try {
    await saveEmailVerificationSettings(settings)
    message.success(t('adminSettings.emailVerificationSaveSuccess'))
  } catch {
    // ignore
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <NCard :title="t('adminSettings.emailVerificationTitle')" :bordered="false" size="small">
    <NSpace vertical :size="16">
      <NAlert v-if="emailCodeRequired && !smtpReady" type="warning" :show-icon="true">
        {{ t('adminSettings.emailVerificationSmtpRequiredHint') }}
      </NAlert>
      <NAlert v-else-if="emailCodeRequired && smtpReady" type="info" :show-icon="true">
        {{ t('adminSettings.emailVerificationSmtpTestHint') }}
      </NAlert>
      <NForm label-placement="left" :label-width="180">
        <NFormItem :label="t('adminSettings.emailVerificationEnabled')">
          <NSwitch v-model:value="settings.enabled" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.emailVerificationRequireRegister')">
          <NSwitch v-model:value="settings.require_for_register" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.emailVerificationRequireEmailChange')">
          <NSwitch v-model:value="settings.require_for_email_change" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.emailVerificationRequireLogin')">
          <NSwitch v-model:value="settings.require_for_login" />
          <NText depth="3" style="margin-left: 8px; font-size: 12px">{{ t('adminSettings.emailVerificationRequireLoginHint') }}</NText>
        </NFormItem>
        <NFormItem :label="t('adminSettings.emailVerificationCodeTtl')">
          <NInputNumber v-model:value="settings.code_ttl_minutes" :min="1" :max="60" />
          <NText depth="3" style="margin-left: 8px">{{ t('adminSettings.emailVerificationMinutes') }}</NText>
        </NFormItem>
        <NFormItem :label="t('adminSettings.emailVerificationCooldown')">
          <NInputNumber v-model:value="settings.resend_cooldown_seconds" :min="10" :max="600" />
          <NText depth="3" style="margin-left: 8px">{{ t('adminSettings.emailVerificationSeconds') }}</NText>
        </NFormItem>
        <NFormItem :label="t('adminSettings.emailVerificationDailyLimit')">
          <NInputNumber v-model:value="settings.daily_send_limit_per_user" :min="1" :max="100" />
        </NFormItem>
      </NForm>

      <NAlert v-if="settings.require_for_login" type="warning" :show-icon="true">
        {{ t('adminSettings.emailVerificationRequireLoginWarning') }}
      </NAlert>

      <NButton type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</NButton>
    </NSpace>
  </NCard>
</template>
