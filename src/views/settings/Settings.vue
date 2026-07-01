<script setup lang="ts">
defineOptions({ name: 'Settings' })
import { NCard, NTabs, NTabPane } from 'naive-ui'
import SmtpSettings from './components/SmtpSettings.vue'
import EmailVerificationSettings from './components/EmailVerificationSettings.vue'
import PasskeySettings from './components/PasskeySettings.vue'
import AuthPolicySettings from './components/AuthPolicySettings.vue'
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminSettings.title') }}</template>
    <NTabs type="line">
      <NTabPane name="smtp" :tab="$t('adminSettings.smtp')">
        <SmtpSettings />
      </NTabPane>
      <NTabPane name="emailVerification" :tab="$t('adminSettings.emailVerification')">
        <EmailVerificationSettings />
      </NTabPane>
      <NTabPane name="passkey" :tab="$t('adminSettings.passkey')">
        <PasskeySettings />
      </NTabPane>
      <NTabPane name="auth" :tab="$t('adminSettings.auth')">
        <AuthPolicySettings />
      </NTabPane>
    </NTabs>
  </NCard>
</template>
