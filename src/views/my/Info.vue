<script setup lang="ts">
defineOptions({ name: 'MyInfo' })
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSpace,
  NAvatar,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NEmpty,
  NSpin,
  NText,
  type FormRules,
  useMessage,
} from 'naive-ui'

import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { changeCurPwd, myOauth } from '@/api/user'
import { unbind } from '@/api/oauth'
import type { UserOauthItem } from '@/types'

const userStore = useUserStore()
const appStore = useAppStore()
const message = useMessage()

const pwdFormRef = ref()
const pwdLoading = ref(false)
const oauthLoading = ref(false)
const oauthList = ref<UserOauthItem[]>([])

const pwdForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const pwdRules = computed<FormRules>(() => ({
  old_password: {
    required: true,
    message: appStore.t('myInfo.oldPassword'),
    trigger: 'blur',
  },
  new_password: {
    required: true,
    message: appStore.t('myInfo.newPassword'),
    trigger: 'blur',
  },
  confirm_password: {
    required: true,
    trigger: 'blur',
    validator: (_rule, value: string) => {
      if (!value) {
        return new Error(appStore.t('myInfo.confirmPassword'))
      }
      if (value !== pwdForm.new_password) {
        return new Error(appStore.t('myInfo.passwordMismatch'))
      }
      return true
    },
  },
}))

const helloText = computed(() => {
  return appStore.adminConfig.hello || ''
})

function resetPwdForm(): void {
  pwdForm.old_password = ''
  pwdForm.new_password = ''
  pwdForm.confirm_password = ''
}

async function handleChangePwd(e: Event): Promise<void> {
  e.preventDefault()
  try {
    await pwdFormRef.value?.validate()
  } catch {
    return
  }
  pwdLoading.value = true
  try {
    await changeCurPwd({
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password,
    })
    message.success(appStore.t('myInfo.passwordChanged'))
    resetPwdForm()
  } catch {
    // handled by interceptor
  } finally {
    pwdLoading.value = false
  }
}

async function loadOauth(): Promise<void> {
  oauthLoading.value = true
  try {
    const res = await myOauth()
    oauthList.value = res.data || []
  } catch {
    // ignore
  } finally {
    oauthLoading.value = false
  }
}

const unbindLoading = ref(false)

async function handleUnbind(op: string): Promise<void> {
  unbindLoading.value = true
  try {
    await unbind({ op })
    message.success(appStore.t('common.success'))
    await loadOauth()
  } catch {
    // ignore
  } finally {
    unbindLoading.value = false
  }
}

function oauthStatusText(status: number): string {
  return status === 1
    ? appStore.t('myInfo.bound')
    : appStore.t('myInfo.unbound')
}

onMounted(() => {
  if (!userStore.username) {
    userStore.info()
  }
  loadOauth()
})
</script>

<template>
  <NSpace vertical size="large">
    <NCard v-if="helloText" :bordered="false">
      <NText>{{ helloText }}</NText>
    </NCard>

    <NCard :title="$t('myInfo.profile')" :bordered="false">
      <NSpace align="center" :size="24">
        <NAvatar
          round
          :size="80"
          :src="userStore.avatar || undefined"
        >
          {{ userStore.nickname?.charAt(0) || userStore.username?.charAt(0) }}
        </NAvatar>
        <NDescriptions label-placement="left" :column="1" size="large">
          <NDescriptionsItem :label="$t('myInfo.username')">
            {{ userStore.username }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('myInfo.nickname')">
            {{ userStore.nickname }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('myInfo.email')">
            {{ userStore.email }}
          </NDescriptionsItem>
        </NDescriptions>
      </NSpace>
    </NCard>

    <NCard :title="$t('myInfo.changePassword')" :bordered="false">
      <NForm
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-placement="left"
        style="max-width: 480px"
        @submit="handleChangePwd"
      >
        <NFormItem :label="$t('myInfo.oldPassword')" path="old_password">
          <NInput
            v-model:value="pwdForm.old_password"
            type="password"
            show-password-on="click"
          />
        </NFormItem>
        <NFormItem :label="$t('myInfo.newPassword')" path="new_password">
          <NInput
            v-model:value="pwdForm.new_password"
            type="password"
            show-password-on="click"
          />
        </NFormItem>
        <NFormItem :label="$t('myInfo.confirmPassword')" path="confirm_password">
          <NInput
            v-model:value="pwdForm.confirm_password"
            type="password"
            show-password-on="click"
          />
        </NFormItem>
        <NButton type="primary" :loading="pwdLoading" @click="handleChangePwd">
          {{ $t('common.save') }}
        </NButton>
      </NForm>
    </NCard>

    <NCard :title="$t('myInfo.oauthBindings')" :bordered="false">
      <NSpin :show="oauthLoading">
        <NEmpty v-if="oauthList.length === 0" :description="$t('myInfo.noOauth')" />
        <NSpace v-else>
          <NSpace
            v-for="item in oauthList"
            :key="item.op"
            align="center"
          >
            <NTag :type="item.status === 1 ? 'success' : 'default'">
              {{ item.op }} - {{ oauthStatusText(item.status) }}
            </NTag>
            <NButton
              v-if="item.status === 1"
              size="small"
              type="warning"
              ghost
              :loading="unbindLoading"
              @click="handleUnbind(item.op)"
            >
              {{ $t('myInfo.unbind') }}
            </NButton>
          </NSpace>
        </NSpace>
      </NSpin>
    </NCard>
  </NSpace>
</template>
