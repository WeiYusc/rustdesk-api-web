<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  useMessage,
} from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { register as registerApi } from '@/api/user'
import { loginOptions as fetchLoginOptions } from '@/api/login'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const registerEmailRequired = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirm_password: '',
  email: '',
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailPlaceholder = computed(() =>
  registerEmailRequired.value ? appStore.t('register.emailRequired') : appStore.t('register.emailOptional')
)

const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: appStore.t('login.username'), trigger: ['blur', 'input'] },
    {
      trigger: ['blur', 'input'],
      validator: (_rule: unknown, value: string) => {
        if (!value || value.length < 2 || value.length > 32) {
          return new Error(appStore.t('register.usernameLength'))
        }
        return true
      },
    },
  ],
  password: [
    { required: true, message: appStore.t('login.password'), trigger: ['blur', 'input'] },
    {
      trigger: ['blur', 'input'],
      validator: (_rule: unknown, value: string) => {
        if (!value || value.length < 4 || value.length > 32) {
          return new Error(appStore.t('register.passwordLength'))
        }
        return true
      },
    },
  ],
  confirm_password: [
    { required: true, message: appStore.t('register.confirmPassword'), trigger: ['blur', 'input'] },
    {
      trigger: ['blur', 'input'],
      validator: (_rule: unknown, value: string) => {
        if (!value || value.length < 4 || value.length > 32) {
          return new Error(appStore.t('register.passwordLength'))
        }
        if (value !== form.password) {
          return new Error(appStore.t('register.passwordMismatch'))
        }
        return true
      },
    },
  ],
  email: [
    {
      trigger: ['blur', 'input'],
      validator: (_rule: unknown, value: string) => {
        if (!value) {
          if (registerEmailRequired.value) {
            return new Error(appStore.t('register.emailRequiredMessage'))
          }
          return true
        }
        if (!emailPattern.test(value)) {
          return new Error(appStore.t('register.emailInvalid'))
        }
        return true
      },
    },
  ],
}))

onMounted(async () => {
  try {
    const res = await fetchLoginOptions()
    registerEmailRequired.value = !!(
      res.data.email_verification_enabled && res.data.email_verification_require_for_register
    )
  } catch {
    registerEmailRequired.value = false
  }
})

async function handleRegister(e?: Event): Promise<void> {
  e?.preventDefault()
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await registerApi({
      username: form.username,
      password: form.password,
      confirm_password: form.confirm_password,
      email: form.email || undefined,
    })
    message.success(appStore.t('common.success'))
    router.push('/login')
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-bg" />
    <NCard class="register-card" :bordered="false" size="large">
      <div class="register-header">
        <h2 class="register-title">{{ appStore.t('login.register') }}</h2>
      </div>
      <NForm ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="handleRegister">
        <NFormItem path="username">
          <NInput v-model:value="form.username" :placeholder="appStore.t('login.username')" clearable />
        </NFormItem>
        <NFormItem path="password">
          <NInput v-model:value="form.password" type="password" show-password-on="click" :placeholder="appStore.t('login.password')" />
        </NFormItem>
        <NFormItem path="confirm_password">
          <NInput v-model:value="form.confirm_password" type="password" show-password-on="click" :placeholder="appStore.t('register.confirmPassword')" />
        </NFormItem>
        <NFormItem path="email" :show-require-mark="registerEmailRequired">
          <NInput v-model:value="form.email" :placeholder="emailPlaceholder" clearable />
        </NFormItem>
        <NButton type="primary" block size="large" :loading="loading" attr-type="submit">
          {{ appStore.t('login.register') }}
        </NButton>
        <NButton text block style="margin-top: 12px" @click="router.push('/login')">
          {{ appStore.t('common.back') }}
        </NButton>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.register-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}
.register-card {
  width: 400px;
  max-width: 90vw;
  z-index: 1;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.register-header {
  text-align: center;
  margin-bottom: 24px;
}
.register-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
</style>
