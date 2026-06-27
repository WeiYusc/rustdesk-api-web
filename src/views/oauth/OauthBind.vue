<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NSpin, NText, NButton } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { bindConfirm } from '@/api/oauth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMsg = ref('')
const timedOut = ref(false)

async function doBind(): Promise<void> {
  const code = route.params.code as string
  if (!code) {
    status.value = 'error'
    return
  }
  status.value = 'loading'
  timedOut.value = false
  try {
    const timeout = setTimeout(() => {
      timedOut.value = true
      status.value = 'error'
      errorMsg.value = appStore.t('common.timeout')
    }, 15000)
    await bindConfirm({ code })
    clearTimeout(timeout)
    if (timedOut.value) return
    status.value = 'success'
  } catch {
    if (timedOut.value) return
    status.value = 'error'
  }
}

onMounted(() => {
  doBind()
})
</script>

<template>
  <div class="oauth-container">
    <NCard class="oauth-card" :bordered="false">
      <div class="oauth-content">
        <template v-if="status === 'loading'">
          <NSpin size="large" />
          <NText style="margin-top: 16px">{{ appStore.t('common.loading') }}</NText>
        </template>
        <template v-else-if="status === 'success'">
          <NText>{{ appStore.t('common.success') }}</NText>
          <NButton style="margin-top: 16px" @click="router.push('/')">
            {{ appStore.t('common.backHome') }}
          </NButton>
        </template>
        <template v-else>
          <NText type="error">{{ errorMsg || appStore.t('common.failed') }}</NText>
          <NButton style="margin-top: 16px" @click="router.push('/login')">
            {{ appStore.t('common.back') }}
          </NButton>
        </template>
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
  max-width: 90vw;
}
.oauth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}
</style>
