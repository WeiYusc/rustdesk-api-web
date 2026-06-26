<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSpace,
  NDivider,
  NImage,
  NText,
  useMessage,
} from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { loginOptions as fetchLoginOptions, captcha as fetchCaptcha } from '@/api/login'
import { registerErrorHandler } from '@/utils/request'
import type { LoginOptionsResponse } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const message = useMessage()

registerErrorHandler({ error: (msg) => message.error(msg) })

const formRef = ref()
const loading = ref(false)
const captchaLoading = ref(false)
const needCaptcha = ref(false)
const loginOptionsData = ref<LoginOptionsResponse | null>(null)

const form = reactive({
  username: '',
  password: '',
  captcha: '',
})

const captchaData = reactive({
  id: '',
  b64: '',
})

const rules = {
  username: { required: true, message: appStore.t('login.username'), trigger: 'blur' },
  password: { required: true, message: appStore.t('login.password'), trigger: 'blur' },
}

const showPasswordForm = computed(() => !loginOptionsData.value?.disable_pwd)
const showRegisterLink = computed(() => loginOptionsData.value?.register)
const oidcProviders = computed(() => loginOptionsData.value?.ops || [])

async function loadLoginOptions(): Promise<void> {
  try {
    const res = await fetchLoginOptions()
    loginOptionsData.value = res.data
    if (res.data.need_captcha) {
      needCaptcha.value = true
      await loadCaptcha()
    }
    if (res.data.auto_oidc && oidcProviders.value.length === 1) {
      await userStore.oidc(oidcProviders.value[0])
    }
  } catch {
    // ignore
  }
}

async function loadCaptcha(): Promise<void> {
  captchaLoading.value = true
  try {
    const res = await fetchCaptcha()
    captchaData.id = res.data.captcha.id
    captchaData.b64 = res.data.captcha.b64
  } catch {
    // ignore
  } finally {
    captchaLoading.value = false
  }
}

async function handleLogin(e: Event): Promise<void> {
  e.preventDefault()
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await userStore.login({
      username: form.username,
      password: form.password,
      captcha_id: needCaptcha.value ? captchaData.id : undefined,
      captcha: needCaptcha.value ? form.captcha : undefined,
    })
    message.success(appStore.t('common.success'))
    router.push('/')
  } catch (err: unknown) {
    const errRes = err as { code?: number }
    if (errRes.code === 110) {
      needCaptcha.value = true
      await loadCaptcha()
    }
  } finally {
    loading.value = false
  }
}

async function handleOidc(provider: string): Promise<void> {
  try {
    await userStore.oidc(provider)
  } catch {
    // error handled by interceptor
  }
}

function goToRegister(): void {
  router.push('/register')
}

window.addEventListener('need-captcha', async () => {
  needCaptcha.value = true
  await loadCaptcha()
})

onMounted(() => {
  loadLoginOptions()
})
</script>

<template>
  <div class="login-container">
    <div class="login-bg" />
    <NCard class="login-card" :bordered="false" size="large">
      <div class="login-header">
        <h2 class="login-title">{{ appStore.adminConfig.title || 'RustDesk API' }}</h2>
      </div>

      <NForm
        v-if="showPasswordForm"
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @submit="handleLogin"
      >
        <NFormItem path="username">
          <NInput
            v-model:value="form.username"
            :placeholder="appStore.t('login.username')"
            clearable
          />
        </NFormItem>
        <NFormItem path="password">
          <NInput
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            :placeholder="appStore.t('login.password')"
            @keyup.enter="handleLogin"
          />
        </NFormItem>
        <NFormItem v-if="needCaptcha" path="captcha">
          <NSpace align="center" style="width: 100%">
            <NInput
              v-model:value="form.captcha"
              :placeholder="appStore.t('login.captcha')"
              style="flex: 1"
            />
            <div v-if="captchaData.b64" class="captcha-img" @click="loadCaptcha">
              <NImage :src="captchaData.b64" width="120" height="40" object-fit="fill" preview-disabled />
            </div>
          </NSpace>
        </NFormItem>
        <NButton
          type="primary"
          block
          size="large"
          :loading="loading"
          @click="handleLogin"
        >
          {{ appStore.t('login.login') }}
        </NButton>
      </NForm>

      <NButton
        v-if="showRegisterLink"
        text
        block
        style="margin-top: 12px"
        @click="goToRegister"
      >
        {{ appStore.t('login.register') }}
      </NButton>

      <template v-if="oidcProviders.length > 0">
        <NDivider v-if="showPasswordForm">{{ appStore.t('login.loginOptions') }}</NDivider>
        <NSpace vertical>
          <NButton
            v-for="provider in oidcProviders"
            :key="provider"
            block
            size="large"
            @click="handleOidc(provider)"
          >
            {{ provider }}
          </NButton>
        </NSpace>
      </template>
    </NCard>
    <NText class="login-footer" depth="3">
      RustDesk API Web · {{ appStore.locale }}
    </NText>
  </div>
</template>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.login-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}
.login-card {
  width: 400px;
  max-width: 90vw;
  z-index: 1;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.login-header {
  text-align: center;
  margin-bottom: 24px;
}
.login-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.captcha-img {
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--n-border-color, #efeff5);
}
.login-footer {
  position: relative;
  z-index: 1;
  margin-top: 16px;
}
</style>
