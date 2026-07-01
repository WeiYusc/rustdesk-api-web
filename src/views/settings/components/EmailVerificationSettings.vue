<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard, NForm, NFormItem, NSwitch, NInputNumber, NButton, NSpace,
  NText, NAlert, useMessage,
} from 'naive-ui'
import { getEmailVerificationSettings, saveEmailVerificationSettings } from '@/api/settings'
import type { EmailVerificationSettings } from '@/types'

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

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const res = await getEmailVerificationSettings()
    Object.assign(settings, res.data)
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
