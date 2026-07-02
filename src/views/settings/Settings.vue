<script setup lang="ts">
defineOptions({ name: 'Settings' })
import { NCard, NTabs, NTabPane } from 'naive-ui'
import RegisterSettings from './components/RegisterSettings.vue'
import SmtpSettings from './components/SmtpSettings.vue'
import EmailVerificationSettings from './components/EmailVerificationSettings.vue'
import PasskeySettings from './components/PasskeySettings.vue'
import AuthPolicySettings from './components/AuthPolicySettings.vue'
import ServerSecuritySettings from './components/ServerSecuritySettings.vue'
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminSettings.title') }}</template>
    <NTabs type="line">
      <NTabPane name="register" :tab="$t('adminSettings.register')">
        <RegisterSettings />
      </NTabPane>
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
      <NTabPane name="serverSecurity" :tab="$t('adminSettings.serverSecurity')">
        <ServerSecuritySettings />
      </NTabPane>
    </NTabs>
  </NCard>
</template>
