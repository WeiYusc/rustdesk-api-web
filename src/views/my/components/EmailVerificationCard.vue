<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import {
  NCard, NButton, NInput, NSpace, NText, NTag, NModal, NFormItem,
  useMessage,
} from 'naive-ui'
import { sendEmailVerification, confirmEmailVerification, beginEmailChange, confirmEmailChange } from '@/api/email'

const appStore = useAppStore()
const userStore = useUserStore()
const message = useMessage()

const sending = ref(false)
const confirming = ref(false)
const code = ref('')
const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const isVerified = computed(() => !!userStore.emailVerifiedAt)
const email = computed(() => userStore.email || '')

const changeModalShow = ref(false)
const changeEmail = ref('')
const changeCode = ref('')
const changeSending = ref(false)
const changeConfirming = ref(false)

async function handleSendCode(): Promise<void> {
  sending.value = true
  try {
    await sendEmailVerification({})
    message.success(appStore.t('mySecurity.verificationCodeSent'))
    startCooldown()
  } catch {
    // ignore
  } finally {
    sending.value = false
  }
}

function startCooldown(): void {
  cooldown.value = 60
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      if (cooldownTimer) clearInterval(cooldownTimer)
    }
  }, 1000)
}

async function handleConfirm(): Promise<void> {
  if (!code.value) return
  confirming.value = true
  try {
    await confirmEmailVerification({ code: code.value })
    message.success(appStore.t('mySecurity.emailVerified'))
    code.value = ''
    await userStore.info()
  } catch {
    // ignore
  } finally {
    confirming.value = false
  }
}

async function handleChangeBegin(): Promise<void> {
  if (!changeEmail.value) return
  changeSending.value = true
  try {
    await beginEmailChange({ email: changeEmail.value })
    message.success(appStore.t('mySecurity.verificationCodeSent'))
  } catch {
    // ignore
  } finally {
    changeSending.value = false
  }
}

async function handleChangeConfirm(): Promise<void> {
  if (!changeEmail.value || !changeCode.value) return
  changeConfirming.value = true
  try {
    await confirmEmailChange({ email: changeEmail.value, code: changeCode.value })
    message.success(appStore.t('mySecurity.emailChanged'))
    changeModalShow.value = false
    changeEmail.value = ''
    changeCode.value = ''
    await userStore.info()
  } catch {
    // ignore
  } finally {
    changeConfirming.value = false
  }
}

onMounted(() => {
  // cleanup on unmount handled by Vue
})
</script>

<template>
  <NCard :title="$t('mySecurity.emailVerification')" :bordered="false" size="small">
    <NSpace vertical :size="12">
      <NSpace align="center" :size="8">
        <NText>{{ $t('mySecurity.currentEmail') }}: {{ email || '-' }}</NText>
        <NTag v-if="isVerified" type="success" size="small">{{ $t('mySecurity.verified') }}</NTag>
        <NTag v-else type="warning" size="small">{{ $t('mySecurity.unverified') }}</NTag>
      </NSpace>

      <template v-if="!isVerified">
        <NSpace :size="8" align="center">
          <NButton size="small" type="primary" :loading="sending" :disabled="cooldown > 0" @click="handleSendCode">
            {{ cooldown > 0 ? `${$t('mySecurity.resendIn')} ${cooldown}s` : $t('mySecurity.sendVerificationCode') }}
          </NButton>
        </NSpace>
        <NSpace :size="8" align="center">
          <NInput v-model:value="code" :placeholder="$t('mySecurity.enterCode')" style="width: 200px" />
          <NButton size="small" :loading="confirming" :disabled="!code" @click="handleConfirm">{{ $t('mySecurity.confirmVerification') }}</NButton>
        </NSpace>
      </template>

      <NSpace :size="8">
        <NButton size="small" @click="changeModalShow = true">{{ $t('mySecurity.changeEmail') }}</NButton>
      </NSpace>
    </NSpace>

    <NModal v-model:show="changeModalShow" preset="card" :title="$t('mySecurity.changeEmail')" style="width: 420px; max-width: 90vw">
      <NSpace vertical :size="12">
        <NFormItem :label="$t('mySecurity.newEmail')">
          <NInput v-model:value="changeEmail" placeholder="new@example.com" />
        </NFormItem>
        <NSpace :size="8" align="center">
          <NButton size="small" :loading="changeSending" :disabled="!changeEmail" @click="handleChangeBegin">{{ $t('mySecurity.sendVerificationCode') }}</NButton>
        </NSpace>
        <NSpace :size="8" align="center">
          <NInput v-model:value="changeCode" :placeholder="$t('mySecurity.enterCode')" style="width: 200px" />
          <NButton size="small" type="primary" :loading="changeConfirming" :disabled="!changeEmail || !changeCode" @click="handleChangeConfirm">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </NSpace>
    </NModal>
  </NCard>
</template>
