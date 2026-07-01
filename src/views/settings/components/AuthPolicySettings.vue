<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NForm, NFormItem, NSwitch, NButton, NSpace, NAlert, useMessage } from 'naive-ui'
import { getAuthPolicySettings, saveAuthPolicySettings } from '@/api/settings'
import type { AuthPolicySettings } from '@/types'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)

const settings = reactive<AuthPolicySettings>({
  disable_password_login: false,
})

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const res = await getAuthPolicySettings()
    Object.assign(settings, res.data)
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleSave(): Promise<void> {
  saving.value = true
  try {
    await saveAuthPolicySettings(settings)
    message.success(t('adminSettings.authSaveSuccess'))
  } catch {
    // handled by interceptor
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <NCard :title="t('adminSettings.authTitle')" :bordered="false" size="small">
    <NSpace vertical :size="16">
      <NAlert v-if="settings.disable_password_login" type="warning" :show-icon="true">
        {{ t('adminSettings.authDisablePasswordWarning') }}
      </NAlert>
      <NForm label-placement="left" :label-width="190" :disabled="loading">
        <NFormItem :label="t('adminSettings.authDisablePasswordLogin')">
          <NSwitch v-model:value="settings.disable_password_login" />
        </NFormItem>
      </NForm>
      <NButton type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</NButton>
    </NSpace>
  </NCard>
</template>
