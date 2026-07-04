<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NText,
  useMessage,
  type FormRules,
} from 'naive-ui'
import { resetForgotPassword } from '@/api/login'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const message = useMessage()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  token: String(route.query.token || ''),
  password: '',
  confirm_password: '',
})

const rules = computed<FormRules>(() => ({
  token: { required: true, message: appStore.t('login.resetTokenRequired'), trigger: 'blur' },
  password: { required: true, message: appStore.t('login.password'), trigger: 'blur' },
  confirm_password: {
    required: true,
    validator: (_rule, value: string) => {
      if (!value) return new Error(appStore.t('login.confirmPasswordRequired'))
      if (value !== form.password) return new Error(appStore.t('login.passwordMismatch'))
      return true
    },
    trigger: ['blur', 'input'],
  },
}))

async function submitReset(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await resetForgotPassword({
      token: form.token.trim(),
      password: form.password,
      confirm_password: form.confirm_password,
    })
    message.success(appStore.t('login.resetPasswordSuccess'))
    router.push('/login')
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-container">
    <div class="reset-bg" />
    <NCard class="reset-card" :bordered="false" size="large">
      <div class="reset-header">
        <h2 class="reset-title">{{ appStore.t('login.resetPassword') }}</h2>
        <NText depth="3">{{ appStore.t('login.resetPasswordDesc') }}</NText>
      </div>
      <NForm ref="formRef" :model="form" :rules="rules" size="large" @submit="submitReset">
        <NFormItem path="token" :label="appStore.t('login.resetToken')">
          <NInput v-model:value="form.token" clearable />
        </NFormItem>
        <NFormItem path="password" :label="appStore.t('login.newPassword')">
          <NInput
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            @keyup.enter="submitReset"
          />
        </NFormItem>
        <NFormItem path="confirm_password" :label="appStore.t('login.confirmPassword')">
          <NInput
            v-model:value="form.confirm_password"
            type="password"
            show-password-on="click"
            @keyup.enter="submitReset"
          />
        </NFormItem>
        <NButton type="primary" block size="large" :loading="loading" @click="submitReset">
          {{ appStore.t('login.resetPassword') }}
        </NButton>
        <NButton text block style="margin-top: 12px" @click="router.push('/login')">
          {{ appStore.t('common.back') }}
        </NButton>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.reset-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.reset-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}
.reset-card {
  width: 420px;
  max-width: 90vw;
  z-index: 1;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.reset-header {
  text-align: center;
  margin-bottom: 24px;
}
.reset-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}
</style>
