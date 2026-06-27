<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  useMessage,
} from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { register as registerApi } from '@/api/user'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirm_password: '',
  email: '',
})

const rules = {
  username: { required: true, message: appStore.t('login.username'), trigger: 'blur' },
  password: { required: true, message: appStore.t('login.password'), trigger: 'blur' },
  confirm_password: {
    required: true,
    trigger: 'blur',
    validator: (_rule: unknown, value: string) => {
      if (value !== form.password) {
        return new Error(appStore.t('register.passwordMismatch'))
      }
      return true
    },
  },
}

async function handleRegister(e: Event): Promise<void> {
  e.preventDefault()
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
      <NForm ref="formRef" :model="form" :rules="rules" size="large" @submit="handleRegister">
        <NFormItem path="username">
          <NInput v-model:value="form.username" :placeholder="appStore.t('login.username')" clearable />
        </NFormItem>
        <NFormItem path="password">
          <NInput v-model:value="form.password" type="password" show-password-on="click" :placeholder="appStore.t('login.password')" />
        </NFormItem>
        <NFormItem path="confirm_password">
          <NInput v-model:value="form.confirm_password" type="password" show-password-on="click" :placeholder="appStore.t('register.confirmPassword')" />
        </NFormItem>
        <NFormItem path="email">
          <NInput v-model:value="form.email" :placeholder="appStore.t('register.emailOptional')" clearable />
        </NFormItem>
        <NButton type="primary" block size="large" :loading="loading" @click="handleRegister">
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
