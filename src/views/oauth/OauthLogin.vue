<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NSpin, NText } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMsg = ref('')

async function handleOidcCallback(): Promise<void> {
  const code = route.params.code as string
  if (!code) {
    status.value = 'error'
    errorMsg.value = 'Missing code'
    return
  }

  const storedCode = userStore.getStoredOidcCode()
  if (storedCode && storedCode !== code) {
    status.value = 'error'
    errorMsg.value = 'Code mismatch'
    return
  }

  try {
    const result = await userStore.queryOidc(code)
    if (result) {
      status.value = 'success'
      router.push('/')
    } else {
      status.value = 'error'
      errorMsg.value = appStore.t('login.noAccess')
    }
  } catch {
    status.value = 'error'
    errorMsg.value = appStore.t('login.noAccess')
  }
}

onMounted(() => {
  handleOidcCallback()
})
</script>

<template>
  <div class="oauth-container">
    <NCard class="oauth-card" :bordered="false">
      <div v-if="status === 'loading'" class="oauth-content">
        <NSpin size="large" />
        <NText style="margin-top: 16px">{{ appStore.t('common.loading') }}</NText>
      </div>
      <div v-else-if="status === 'error'" class="oauth-content">
        <NText type="error">{{ errorMsg }}</NText>
        <NText style="margin-top: 12px; cursor: pointer" @click="router.push('/login')">
          {{ appStore.t('common.back') }}
        </NText>
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
  width: 360px;
  z-index: 1;
}
.oauth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}
</style>
