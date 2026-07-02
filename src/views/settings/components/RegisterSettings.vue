<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NButton, NCard, NForm, NFormItem, NSelect, NSpace, NSwitch, useMessage } from 'naive-ui'
import { getRegisterPolicySettings, saveRegisterPolicySettings } from '@/api/settings'
import type { RegisterPolicySettings } from '@/types'

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)

const settings = reactive<RegisterPolicySettings>({
  enabled: false,
  default_status: 1,
})

const statusOptions = [
  { label: t('adminSettings.registerStatusEnabled'), value: 1 },
  { label: t('adminSettings.registerStatusDisabled'), value: 2 },
]

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const res = await getRegisterPolicySettings()
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
    const res = await saveRegisterPolicySettings(settings)
    Object.assign(settings, res.data)
    message.success(t('adminSettings.registerSaveSuccess'))
  } catch {
    // handled by interceptor
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <NCard :title="t('adminSettings.registerTitle')" :bordered="false" size="small">
    <NSpace vertical :size="16">
      <NAlert type="info" :show-icon="true">
        {{ t('adminSettings.registerHint') }}
      </NAlert>
      <NForm label-placement="left" :label-width="190" :disabled="loading">
        <NFormItem :label="t('adminSettings.registerEnabled')">
          <NSwitch v-model:value="settings.enabled" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.registerDefaultStatus')">
          <NSelect v-model:value="settings.default_status" :options="statusOptions" style="max-width: 320px" />
        </NFormItem>
      </NForm>
      <NButton type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</NButton>
    </NSpace>
  </NCard>
</template>
