<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard, NForm, NFormItem, NInput, NInputNumber, NSelect,
  NSwitch, NButton, NSpace, NModal, NText, NTag, NAlert,
  useMessage,
} from 'naive-ui'
import { getSmtpSettings, saveSmtpSettings, testSmtpSend } from '@/api/settings'
import type { SmtpSettings } from '@/types'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const settings = reactive<SmtpSettings>({
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
  timeout_seconds: 30,
  insecure_skip_verify: false,
})

const securityOptions = computed(() => [
  { label: t('adminSettings.smtpSecurityNone'), value: 'none' },
  { label: 'STARTTLS', value: 'starttls' },
  { label: 'TLS/SSL', value: 'tls' },
])

const testModalShow = ref(false)
const testEmail = ref('')

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const res = await getSmtpSettings()
    Object.assign(settings, res.data)
    settings.password = ''
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleSave(): Promise<void> {
  saving.value = true
  try {
    const payload: Partial<SmtpSettings> = { ...settings }
    if (!payload.password) {
      delete payload.password
    }
    await saveSmtpSettings(payload as SmtpSettings)
    message.success(t('adminSettings.smtpSaveSuccess'))
    await loadSettings()
  } catch {
    // ignore
  } finally {
    saving.value = false
  }
}

async function handleClearPassword(): Promise<void> {
  saving.value = true
  try {
    await saveSmtpSettings({ ...settings, password: '', has_password: false } as SmtpSettings)
    message.success(t('adminSettings.smtpPasswordCleared'))
    await loadSettings()
  } catch {
    // ignore
  } finally {
    saving.value = false
  }
}

async function handleTestSend(): Promise<void> {
  if (!testEmail.value) return
  testing.value = true
  try {
    await testSmtpSend({ to: testEmail.value })
    message.success(t('adminSettings.smtpTestSuccess'))
    testModalShow.value = false
    testEmail.value = ''
  } catch {
    // ignore
  } finally {
    testing.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <NCard :title="t('adminSettings.smtpTitle')" :bordered="false" size="small">
    <NSpace vertical :size="16">
      <NForm label-placement="left" :label-width="140">
        <NFormItem :label="t('adminSettings.smtpEnabled')">
          <NSwitch v-model:value="settings.enabled" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpHost')">
          <NInput v-model:value="settings.host" placeholder="smtp.example.com" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpPort')">
          <NInputNumber v-model:value="settings.port" :min="1" :max="65535" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpSecurity')">
          <NSelect v-model:value="settings.security" :options="securityOptions" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpUsername')">
          <NInput v-model:value="settings.username" placeholder="user@example.com" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpPassword')">
          <NSpace align="center" :size="8">
            <NInput
              v-model:value="settings.password"
              type="password"
              show-password-on="click"
              :placeholder="settings.has_password ? t('adminSettings.smtpPasswordSet') : t('adminSettings.smtpPasswordPlaceholder')"
              style="width: 240px"
            />
            <NTag v-if="settings.has_password" type="success" size="small">{{ t('adminSettings.smtpPasswordSet') }}</NTag>
            <NButton v-if="settings.has_password" size="small" type="warning" ghost :loading="saving" @click="handleClearPassword">{{ t('adminSettings.smtpClearPassword') }}</NButton>
          </NSpace>
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpFromEmail')">
          <NInput v-model:value="settings.from_email" placeholder="noreply@example.com" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpFromName')">
          <NInput v-model:value="settings.from_name" placeholder="RustDesk API" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpReplyTo')">
          <NInput v-model:value="settings.reply_to" placeholder="support@example.com" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpTimeout')">
          <NInputNumber v-model:value="settings.timeout_seconds" :min="5" :max="300" />
          <NText depth="3" style="margin-left: 8px">{{ t('adminSettings.smtpSeconds') }}</NText>
        </NFormItem>
        <NFormItem :label="t('adminSettings.smtpInsecureSkipVerify')">
          <NSwitch v-model:value="settings.insecure_skip_verify" />
          <NText depth="3" style="margin-left: 8px; font-size: 12px">{{ t('adminSettings.smtpInsecureSkipVerifyHint') }}</NText>
        </NFormItem>
      </NForm>

      <NAlert v-if="settings.has_password" type="info" :show-icon="true">
        {{ t('adminSettings.smtpPasswordHint') }}
      </NAlert>

      <NSpace :size="8">
        <NButton type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</NButton>
        <NButton :loading="testing" :disabled="!settings.enabled" @click="testModalShow = true">{{ t('adminSettings.smtpTestSend') }}</NButton>
      </NSpace>
    </NSpace>

    <NModal v-model:show="testModalShow" preset="card" :title="t('adminSettings.smtpTestSend')" style="width: 420px; max-width: 90vw">
      <NForm label-placement="top">
        <NFormItem :label="t('adminSettings.smtpTestTo')">
          <NInput v-model:value="testEmail" placeholder="test@example.com" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="testModalShow = false">{{ t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="testing" :disabled="!testEmail" @click="handleTestSend">{{ t('adminSettings.smtpTestSend') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
