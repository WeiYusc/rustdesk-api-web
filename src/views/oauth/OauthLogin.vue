<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NSpin, NText, NButton, NSpace, NForm, NFormItem, NInput, NAlert, NImage } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { confirm as confirmOauth } from '@/api/oauth'
import { loginOptions as fetchLoginOptions, captcha as fetchCaptcha } from '@/api/login'
import type { LoginOptionsResponse } from '@/types'
import { getToken } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const status = ref<'loading' | 'login' | 'confirming' | 'success' | 'error'>('loading')
const errorMsg = ref('')
const username = ref('')
const password = ref('')
const captcha = ref('')
const needCaptcha = ref(false)
const captchaLoading = ref(false)
const loginOptionsData = ref<LoginOptionsResponse | null>(null)
const captchaData = ref({ id: '', b64: '' })
const passwordLoading = ref(false)
const passkeyLoading = ref(false)
const confirmLoading = ref(false)

const code = computed(() => route.params.code as string)
const showPasswordForm = computed(() => !loginOptionsData.value?.disable_pwd)
const showPasskeyLogin = computed(() => !!(loginOptionsData.value?.passkey_enabled && loginOptionsData.value?.passkey_discoverable_login_enabled))
const hasLoginMethod = computed(() => showPasswordForm.value || showPasskeyLogin.value)

async function loadCaptcha(): Promise<void> {
  captchaLoading.value = true
  try {
    const res = await fetchCaptcha()
    captchaData.value = { id: res.data.captcha.id, b64: res.data.captcha.b64 }
  } catch {
    // ignore; login will surface the real error if captcha remains unavailable
  } finally {
    captchaLoading.value = false
  }
}

async function loadLoginOptions(): Promise<void> {
  try {
    const res = await fetchLoginOptions()
    loginOptionsData.value = res.data
    if (res.data.need_captcha) {
      needCaptcha.value = true
      await loadCaptcha()
    }
  } catch {
    loginOptionsData.value = {
      ops: [],
      register: false,
      need_captcha: false,
      disable_pwd: false,
      auto_oidc: false,
      passkey_enabled: false,
      passkey_discoverable_login_enabled: false,
    }
  }
}

async function ensureUserLoaded(): Promise<boolean> {
  if (userStore.username) return true
  if (!getToken()) return false
  const user = await userStore.info()
  return !!user
}

async function confirmClientAuth(): Promise<void> {
  if (!code.value) {
    status.value = 'error'
    errorMsg.value = appStore.t('oauth.missingCode')
    return
  }
  status.value = 'confirming'
  confirmLoading.value = true
  try {
    await confirmOauth({ code: code.value })
    status.value = 'success'
  } catch {
    status.value = 'error'
    errorMsg.value = appStore.t('login.noAccess')
  } finally {
    confirmLoading.value = false
  }
}

async function initialize(): Promise<void> {
  const loaded = await ensureUserLoaded()
  if (loaded) {
    await confirmClientAuth()
    return
  }
  await loadLoginOptions()
  status.value = 'login'
}

async function handlePasswordLogin(): Promise<void> {
  if (!showPasswordForm.value) {
    errorMsg.value = appStore.t('login.pwdLoginDisabled')
    return
  }
  if (!username.value || !password.value || (needCaptcha.value && !captcha.value)) {
    errorMsg.value = appStore.t('login.usernameOrPasswordError')
    return
  }
  passwordLoading.value = true
  errorMsg.value = ''
  try {
    await userStore.login({
      username: username.value,
      password: password.value,
      captcha_id: needCaptcha.value ? captchaData.value.id : undefined,
      captcha: needCaptcha.value ? captcha.value : undefined,
    })
    await confirmClientAuth()
  } catch (err: unknown) {
    const errRes = err as { code?: number }
    if (errRes.code === 110) {
      needCaptcha.value = true
      await loadCaptcha()
    }
    errorMsg.value = appStore.t('login.usernameOrPasswordError')
  } finally {
    passwordLoading.value = false
  }
}

async function handlePasskeyLogin(): Promise<void> {
  if (!showPasskeyLogin.value) {
    errorMsg.value = appStore.t('login.noLoginMethod')
    return
  }
  passkeyLoading.value = true
  errorMsg.value = ''
  try {
    const user = await userStore.passkeyLogin()
    if (!user) {
      errorMsg.value = appStore.t('login.noAccess')
      return
    }
    await confirmClientAuth()
  } catch {
    errorMsg.value = appStore.t('login.noAccess')
  } finally {
    passkeyLoading.value = false
  }
}

function backToLogin(): void {
  router.push('/login')
}

function backHome(): void {
  router.push('/')
}

onMounted(() => {
  initialize().catch(() => {
    status.value = 'error'
    errorMsg.value = appStore.t('login.noAccess')
  })
})
</script>

<template>
  <div class="oauth-container">
    <NCard class="oauth-card" :bordered="false">
      <div v-if="status === 'loading' || status === 'confirming'" class="oauth-content">
        <NSpin size="large" />
        <NText style="margin-top: 16px">
          {{ status === 'confirming' ? appStore.t('oauth.clientAuthConfirming') : appStore.t('common.loading') }}
        </NText>
      </div>

      <div v-else-if="status === 'login'" class="oauth-content oauth-login-content">
        <NText class="oauth-title">{{ appStore.t('oauth.clientAuthTitle') }}</NText>
        <NText depth="3" class="oauth-desc">
          {{ appStore.t('oauth.clientAuthDesc') }}
        </NText>
        <NAlert v-if="errorMsg" type="error" :show-icon="false" class="oauth-alert">
          {{ errorMsg }}
        </NAlert>
        <NAlert v-if="!hasLoginMethod" type="warning" :show-icon="false" class="oauth-alert">
          {{ appStore.t('login.noLoginMethod') }}
        </NAlert>
        <NForm v-if="showPasswordForm" class="oauth-form" label-placement="top" @submit.prevent="handlePasswordLogin">
          <NFormItem :label="appStore.t('login.username')">
            <NInput v-model:value="username" :placeholder="appStore.t('login.username')" />
          </NFormItem>
          <NFormItem :label="appStore.t('login.password')">
            <NInput
              v-model:value="password"
              type="password"
              show-password-on="click"
              :placeholder="appStore.t('login.password')"
              @keyup.enter="handlePasswordLogin"
            />
          </NFormItem>
          <NFormItem v-if="needCaptcha">
            <NSpace align="center">
              <NInput v-model:value="captcha" :placeholder="appStore.t('login.captcha')" @keyup.enter="handlePasswordLogin" />
              <div v-if="captchaLoading" class="captcha-img captcha-img-loading">...</div>
              <div v-else-if="captchaData.b64" class="captcha-img" @click="loadCaptcha">
                <NImage :src="captchaData.b64" width="120" height="40" object-fit="fill" preview-disabled />
              </div>
            </NSpace>
          </NFormItem>
          <NButton type="primary" block :loading="passwordLoading" @click="handlePasswordLogin">
            {{ appStore.t('oauth.clientAuthPasswordLogin') }}
          </NButton>
        </NForm>
        <NSpace v-if="showPasskeyLogin" vertical class="oauth-actions">
          <NButton block :loading="passkeyLoading" @click="handlePasskeyLogin">
            {{ appStore.t('oauth.clientAuthPasskeyLogin') }}
          </NButton>
        </NSpace>
      </div>

      <div v-else-if="status === 'success'" class="oauth-content">
        <NText type="success">{{ appStore.t('oauth.clientAuthSuccess') }}</NText>
        <NButton style="margin-top: 16px" @click="backHome">
          {{ appStore.t('common.backHome') }}
        </NButton>
      </div>

      <div v-else class="oauth-content">
        <NText type="error">{{ errorMsg || appStore.t('common.failed') }}</NText>
        <NButton style="margin-top: 16px" @click="backToLogin">
          {{ appStore.t('common.back') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.oauth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.oauth-card {
  width: 420px;
  max-width: 92vw;
  z-index: 1;
}
.oauth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}
.oauth-login-content {
  align-items: stretch;
}
.oauth-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}
.oauth-desc {
  margin-top: 8px;
  text-align: center;
  line-height: 1.6;
}
.oauth-alert {
  margin-top: 16px;
}
.oauth-form {
  margin-top: 18px;
}
.oauth-actions {
  margin-top: 10px;
}
.captcha-img {
  width: 120px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.captcha-img-loading {
  color: rgba(255, 255, 255, 0.7);
}
</style>
