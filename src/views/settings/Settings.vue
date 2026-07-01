<script setup lang="ts">
defineOptions({ name: 'Settings' })
import { NCard, NTabs, NTabPane, NText } from 'naive-ui'
import SmtpSettings from './components/SmtpSettings.vue'
import EmailVerificationSettings from './components/EmailVerificationSettings.vue'
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
        <NText depth="3">{{ $t('adminSettings.passkeyPlaceholder') }}</NText>
      </NTabPane>
      <NTabPane name="auth" :tab="$t('adminSettings.auth')">
        <NText depth="3">{{ $t('adminSettings.authPlaceholder') }}</NText>
      </NTabPane>
    </NTabs>
  </NCard>
</template>
