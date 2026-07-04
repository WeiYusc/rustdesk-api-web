<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NButton, NCard, NDescriptions, NDescriptionsItem, NSpace, NTag } from 'naive-ui'
import {
  getAuthPolicySettings,
  getEmailVerificationSettings,
  getPasskeySettings,
  getRegisterPolicySettings,
  getSmtpSettings,
} from '@/api/settings'
import type {
  AuthPolicySettings,
  EmailVerificationSettings,
  PasskeySettings,
  RegisterPolicySettings,
  SmtpSettings,
} from '@/types'

const { t } = useI18n()
const loading = ref(false)

const registerSettings = reactive<RegisterPolicySettings>({
  enabled: false,
  default_status: 1,
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
  timeout_seconds: 30,
  insecure_skip_verify: false,
})
const emailSettings = reactive<EmailVerificationSettings>({
  enabled: false,
  require_for_register: false,
  require_for_email_change: false,
  require_for_login: false,
  code_ttl_minutes: 10,
  resend_cooldown_seconds: 60,
  daily_send_limit_per_user: 10,
})
const passkeySettings = reactive<PasskeySettings>({
  enabled: false,
  rp_name: 'RustDesk API Admin',
  rp_id: '',
  allowed_origins: [],
  user_verification: 'preferred',
  discoverable_login_enabled: true,
  resident_key_requirement: 'required',
})
const authSettings = reactive<AuthPolicySettings>({
  disable_password_login: false,
})

const smtpReady = computed(() => (
  smtpSettings.enabled
  && !!smtpSettings.host
  && !!smtpSettings.port
  && !!smtpSettings.from_email
  && (smtpSettings.has_password || !!smtpSettings.password || !smtpSettings.username)
))

const registerEmailRequiresSmtp = computed(() => (
  registerSettings.enabled
  && emailSettings.enabled
  && emailSettings.require_for_register
))
const emailVerificationRequiresSmtp = computed(() => (
  emailSettings.enabled
  && (emailSettings.require_for_register || emailSettings.require_for_email_change || emailSettings.require_for_login)
))
const passwordlessReady = computed(() => passkeySettings.enabled && passkeySettings.discoverable_login_enabled)
const hasWarnings = computed(() => emailVerificationRequiresSmtp.value && !smtpReady.value)

async function loadSettings(): Promise<void> {
  loading.value = true
  try {
    const [registerRes, smtpRes, emailRes, passkeyRes, authRes] = await Promise.all([
      getRegisterPolicySettings(),
      getSmtpSettings(),
      getEmailVerificationSettings(),
      getPasskeySettings(),
      getAuthPolicySettings(),
    ])
    Object.assign(registerSettings, registerRes.data)
    Object.assign(smtpSettings, smtpRes.data)
    Object.assign(emailSettings, emailRes.data)
    Object.assign(passkeySettings, passkeyRes.data)
    Object.assign(authSettings, authRes.data)
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

function tagType(enabled: boolean): 'success' | 'warning' | 'default' {
  return enabled ? 'success' : 'default'
}

onMounted(loadSettings)
</script>

<template>
  <NCard :title="t('adminSettings.authOverviewTitle')" size="small">
    <NSpace vertical :size="12">
      <NAlert v-if="hasWarnings" type="warning" :show-icon="true">
        {{ registerEmailRequiresSmtp ? t('adminSettings.authOverviewSmtpRequiredWarning') : t('adminSettings.authOverviewSmtpAnyRequiredWarning') }}
      </NAlert>
      <NAlert v-if="smtpReady" type="info" :show-icon="true">
        {{ t('adminSettings.authOverviewSmtpTestHint') }}
      </NAlert>
      <NAlert v-if="authSettings.disable_password_login && !passwordlessReady" type="error" :show-icon="true">
        {{ t('adminSettings.authOverviewPasswordLockoutWarning') }}
      </NAlert>
      <NDescriptions bordered :column="2" size="small">
        <NDescriptionsItem :label="t('adminSettings.authOverviewRegister')">
          <NTag :type="tagType(registerSettings.enabled)">
            {{ registerSettings.enabled ? t('common.enabled') : t('common.disabled') }}
          </NTag>
          <NTag size="small" style="margin-left: 8px">
            {{ registerSettings.default_status === 1 ? t('adminSettings.registerStatusEnabled') : t('adminSettings.registerStatusDisabled') }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem :label="t('adminSettings.authOverviewSmtp')">
          <NTag :type="smtpReady ? 'success' : (smtpSettings.enabled ? 'warning' : 'default')">
            {{ smtpReady ? t('adminSettings.authOverviewConfigured') : (smtpSettings.enabled ? t('adminSettings.authOverviewIncomplete') : t('common.disabled')) }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem :label="t('adminSettings.authOverviewEmailVerification')">
          <NTag :type="tagType(emailSettings.enabled)">
            {{ emailSettings.enabled ? t('common.enabled') : t('common.disabled') }}
          </NTag>
          <NTag v-if="emailSettings.require_for_register" size="small" style="margin-left: 8px" type="info">
            {{ t('adminSettings.emailVerificationRequireRegister') }}
          </NTag>
          <NTag v-if="emailSettings.require_for_email_change" size="small" style="margin-left: 8px" type="info">
            {{ t('adminSettings.emailVerificationRequireEmailChange') }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem :label="t('adminSettings.authOverviewPasskey')">
          <NTag :type="tagType(passkeySettings.enabled)">
            {{ passkeySettings.enabled ? t('common.enabled') : t('common.disabled') }}
          </NTag>
          <NTag v-if="passkeySettings.discoverable_login_enabled" size="small" style="margin-left: 8px" type="info">
            {{ t('adminSettings.passkeyDiscoverableLogin') }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem :label="t('adminSettings.authOverviewPasswordLogin')">
          <NTag :type="authSettings.disable_password_login ? 'warning' : 'success'">
            {{ authSettings.disable_password_login ? t('adminSettings.authOverviewPasswordDisabled') : t('adminSettings.authOverviewPasswordEnabled') }}
          </NTag>
        </NDescriptionsItem>
      </NDescriptions>
      <NButton size="small" :loading="loading" @click="loadSettings">
        {{ t('common.refresh') }}
      </NButton>
    </NSpace>
  </NCard>
</template>
