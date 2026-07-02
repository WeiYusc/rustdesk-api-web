<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NButton, NCard, NForm, NFormItem, NSpace, NSwitch, NText, useMessage } from 'naive-ui'
import { sendCmd } from '@/api/rustdesk'

const ID_SERVER = '21115'
const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const mustLogin = ref(false)
const lastResult = ref('')

const resultText = computed(() => lastResult.value || '-')

function parseMustLoginResult(result: string): boolean | null {
  const match = result.match(/MUST_LOGIN:\s*(true|false)/i)
  if (!match) return null
  return match[1].toLowerCase() === 'true'
}

async function runMustLoginCommand(option = ''): Promise<void> {
  const res = await sendCmd({ cmd: 'ml', option, target: ID_SERVER })
  lastResult.value = String(res.data || '').trim()
  const parsed = parseMustLoginResult(lastResult.value)
  if (parsed !== null) {
    mustLogin.value = parsed
  }
}

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    await runMustLoginCommand()
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleSave(): Promise<void> {
  saving.value = true
  const expected = mustLogin.value
  try {
    await runMustLoginCommand(expected ? 'Y' : 'N')
    if (mustLogin.value !== expected) {
      message.error(t('adminSettings.serverSecurityApplyFailed'))
      return
    }
    message.success(t('adminSettings.serverSecuritySaveSuccess'))
  } catch {
    // handled by interceptor
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <NCard :title="t('adminSettings.serverSecurityTitle')" :bordered="false" size="small">
    <NSpace vertical :size="16">
      <NAlert type="warning" :show-icon="true">
        {{ t('adminSettings.serverSecurityHint') }}
      </NAlert>
      <NAlert type="info" :show-icon="true">
        {{ t('adminSettings.serverSecurityClientHint') }}
      </NAlert>
      <NForm label-placement="left" :label-width="190" :disabled="loading">
        <NFormItem :label="t('adminSettings.mustLoginEnabled')">
          <NSwitch v-model:value="mustLogin" />
        </NFormItem>
        <NFormItem :label="t('adminSettings.mustLoginRuntimeState')">
          <NText code>{{ resultText }}</NText>
        </NFormItem>
      </NForm>
      <NSpace>
        <NButton type="primary" :loading="saving" @click="handleSave">{{ t('adminSettings.applyRuntime') }}</NButton>
        <NButton :loading="loading" @click="loadSettings">{{ t('common.refresh') }}</NButton>
      </NSpace>
    </NSpace>
  </NCard>
</template>
