<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NForm,
  NFormItem,
  NSwitch,
  NInput,
  NSelect,
  NButton,
  NSpace,
  NText,
  NAlert,
  useMessage,
} from 'naive-ui'
import { getPasskeySettings, savePasskeySettings } from '@/api/settings'
import type { PasskeySettings } from '@/types'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const originsText = ref('')

const settings = reactive<PasskeySettings>({
  enabled: false,
  rp_name: 'RustDesk API Admin',
  rp_id: '',
  allowed_origins: [],
  user_verification: 'preferred',
  discoverable_login_enabled: true,
  resident_key_requirement: 'required',
})

const userVerificationOptions = [
  { label: 'Preferred', value: 'preferred' },
  { label: 'Required', value: 'required' },
]

function syncOriginsText(): void {
  originsText.value = (settings.allowed_origins || []).join('\n')
}

function parseOrigins(): string[] {
  return originsText.value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const res = await getPasskeySettings()
    Object.assign(settings, res.data)
    syncOriginsText()
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleSave(): Promise<void> {
  saving.value = true
  try {
    const payload: PasskeySettings = {
      ...settings,
      allowed_origins: parseOrigins(),
      resident_key_requirement: 'required',
    }
    await savePasskeySettings(payload)
    message.success(t('adminSettings.passkeySaveSuccess'))
    Object.assign(settings, payload)
    syncOriginsText()
  } catch {
    // handled by interceptor
  } finally {
    saving.value = false
  }
}

function fillCurrentOrigin(): void {
  settings.rp_id = window.location.hostname
  originsText.value = window.location.origin
}

onMounted(loadSettings)
</script>

<template>
  <NCard :title="t('adminSettings.passkeyTitle')" :bordered="false" size="small">
    <NSpace vertical :size="16">
      <NAlert type="info" :show-icon="true">
        {{ t('adminSettings.passkeyHttpsHint') }}
      </NAlert>

      <NForm label-placement="left" :label-width="190" :disabled="loading">
        <NFormItem :label="t('adminSettings.passkeyEnabled')">
          <NSwitch v-model:value="settings.enabled" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.passkeyRpName')">
          <NInput v-model:value="settings.rp_name" placeholder="RustDesk API Admin" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.passkeyRpId')">
          <NSpace style="width: 100%" align="center">
            <NInput v-model:value="settings.rp_id" placeholder="rd.example.com" style="flex: 1" />
            <NButton size="small" @click="fillCurrentOrigin">{{ t('adminSettings.passkeyUseCurrentOrigin') }}</NButton>
          </NSpace>
        </NFormItem>
        <NFormItem :label="t('adminSettings.passkeyAllowedOrigins')">
          <NInput
            v-model:value="originsText"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder="https://rd.example.com"
          />
        </NFormItem>
        <NFormItem :label="t('adminSettings.passkeyUserVerification')">
          <NSelect v-model:value="settings.user_verification" :options="userVerificationOptions" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.passkeyDiscoverableLogin')">
          <NSwitch v-model:value="settings.discoverable_login_enabled" />
          <NText depth="3" style="margin-left: 8px; font-size: 12px">
            {{ t('adminSettings.passkeyDiscoverableLoginHint') }}
          </NText>
        </NFormItem>
      </NForm>

      <NButton type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</NButton>
    </NSpace>
  </NCard>
</template>
