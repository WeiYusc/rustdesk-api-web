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
  NModal,
  NRadioButton,
  NRadioGroup,
  NSlider,
  type FormInst,
  type FormRules,
  useMessage,
} from 'naive-ui'

import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { changeCurInfo, changeCurPwd, myOauth } from '@/api/user'
import { uploadFile } from '@/api/file'
import { unbind } from '@/api/oauth'
import type { UserOauthItem } from '@/types'
import clipboard from 'clipboard'

const userStore = useUserStore()
const appStore = useAppStore()
const message = useMessage()

const pwdFormRef = ref()
const editFormRef = ref<FormInst | null>(null)
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

const editRules = computed<FormRules>(() => ({
  nickname: {
    required: true,
    message: appStore.t('myInfo.nicknameRequired'),
    trigger: ['blur', 'input'],
  },
}))

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

const serverConfigText = computed(() => {
  const cfg = appStore.serverConfig
  if (!cfg) return ''
  const lines: string[] = []
  if (cfg.id_server) lines.push(`ID Server: ${cfg.id_server}`)
  if (cfg.relay_server) lines.push(`Relay Server: ${cfg.relay_server}`)
  if (cfg.api_server) lines.push(`API Server: ${cfg.api_server}`)
  if (cfg.key) lines.push(`Key: ${cfg.key}`)
  return lines.join('\n')
})

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

const serverConfigImportText = computed(() => {
  const cfg = appStore.serverConfig
  if (!cfg) return ''
  const config = {
    host: cfg.id_server?.trim() || '',
    relay: cfg.relay_server?.trim() || '',
    api: cfg.api_server?.trim() || '',
    key: cfg.key?.trim() || '',
  }
  if (!config.host) return ''
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(config)))
    .split('')
    .reverse()
    .join('')
})

function copyCredentials(): void {
  if (!serverConfigText.value) {
    message.warning(appStore.t('myInfo.noServerConfig'))
    return
  }
  try {
    clipboard.copy(serverConfigText.value)
    message.success(appStore.t('myInfo.copied'))
  } catch {
    message.error(appStore.t('myInfo.copyFailed'))
  }
}

function copyClientImportConfig(): void {
  if (!serverConfigImportText.value) {
    message.warning(appStore.t('myInfo.noServerConfig'))
    return
  }
  try {
    clipboard.copy(serverConfigImportText.value)
    message.success(appStore.t('myInfo.clientConfigCopied'))
  } catch {
    message.error(appStore.t('myInfo.copyFailed'))
  }
}

const editModalShow = ref(false)
const editForm = reactive({
  nickname: '',
  email: '',
  avatar: '',
})
const editLoading = ref(false)
const avatarMode = ref<'upload' | 'external'>('upload')
const avatarPreviewUrl = ref('')
const avatarScale = ref(1)
const avatarOffsetX = ref(0)
const avatarOffsetY = ref(0)
const avatarCanvasRef = ref<HTMLCanvasElement | null>(null)
let avatarObjectUrl = ''

function revokeAvatarObjectUrl(): void {
  if (avatarObjectUrl) {
    URL.revokeObjectURL(avatarObjectUrl)
    avatarObjectUrl = ''
  }
}

function resetAvatarEditor(): void {
  revokeAvatarObjectUrl()
  avatarPreviewUrl.value = editForm.avatar || ''
  avatarScale.value = 1
  avatarOffsetX.value = 0
  avatarOffsetY.value = 0
}

function openEditProfile(): void {
  editForm.nickname = userStore.nickname || ''
  editForm.email = userStore.email || ''
  editForm.avatar = userStore.avatar || ''
  avatarMode.value = editForm.avatar ? 'external' : 'upload'
  resetAvatarEditor()
  editModalShow.value = true
}

function closeEditProfile(): void {
  editModalShow.value = false
  revokeAvatarObjectUrl()
}

function handleAvatarFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    message.error(appStore.t('myInfo.avatarInvalidType'))
    input.value = ''
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    message.error(appStore.t('myInfo.avatarTooLarge'))
    input.value = ''
    return
  }
  revokeAvatarObjectUrl()
  avatarObjectUrl = URL.createObjectURL(file)
  avatarPreviewUrl.value = avatarObjectUrl
  avatarMode.value = 'upload'
  avatarScale.value = 1
  avatarOffsetX.value = 0
  avatarOffsetY.value = 0
}

function handleExternalAvatarInput(value: string): void {
  editForm.avatar = value.trim()
  avatarPreviewUrl.value = editForm.avatar
}

async function renderCroppedAvatarBlob(): Promise<Blob | null> {
  if (!avatarPreviewUrl.value) return null
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = avatarPreviewUrl.value
  try {
    await image.decode()
  } catch {
    return null
  }
  const canvas = avatarCanvasRef.value || document.createElement('canvas')
  const size = 512
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight)
  const scale = baseScale * avatarScale.value
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const x = (size - width) / 2 + avatarOffsetX.value
  const y = (size - height) / 2 + avatarOffsetY.value
  ctx.drawImage(image, x, y, width, height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9))
}

async function uploadEditedAvatar(): Promise<string> {
  const blob = await renderCroppedAvatarBlob()
  if (!blob) {
    if (avatarMode.value === 'external') return editForm.avatar
    throw new Error(appStore.t('myInfo.avatarPreviewFailed'))
  }
  const file = new File([blob], 'avatar.webp', { type: 'image/webp' })
  const res = await uploadFile(file)
  return res.data.url
}

async function handleSaveProfile(): Promise<void> {
  try {
    await editFormRef.value?.validate()
  } catch {
    return
  }
  editLoading.value = true
  try {
    const avatar = avatarPreviewUrl.value ? await uploadEditedAvatar() : ''
    await changeCurInfo({
      nickname: editForm.nickname,
      email: editForm.email,
      avatar,
    })
    message.success(appStore.t('myInfo.profileUpdated'))
    editModalShow.value = false
    revokeAvatarObjectUrl()
    await userStore.info()
  } catch (error) {
    if (error instanceof Error) {
      message.error(error.message)
    }
  } finally {
    editLoading.value = false
  }
}
</script>

<template>
  <NSpace vertical size="large">
    <NCard v-if="helloText" :bordered="false">
      <NText>{{ helloText }}</NText>
    </NCard>

    <NCard :title="$t('myInfo.profile')" :bordered="false">
      <template #header-extra>
        <NButton size="small" @click="openEditProfile">{{ $t('common.edit') }}</NButton>
      </template>
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

    <NCard :title="$t('myInfo.serverCredentials')" :bordered="false">
      <NSpace vertical :size="12">
        <NText depth="3" style="font-size: 13px">{{ $t('myInfo.credentialsDesc') }}</NText>
        <NText depth="3" style="font-size: 13px">{{ $t('myInfo.clientConfigDesc') }}</NText>
        <NDescriptions v-if="appStore.serverConfig" label-placement="left" :column="1" bordered size="small">
          <NDescriptionsItem :label="$t('myInfo.idServer')">
            {{ appStore.serverConfig.id_server || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('myInfo.relayServer')">
            {{ appStore.serverConfig.relay_server || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('myInfo.apiServer')">
            {{ appStore.serverConfig.api_server || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('myInfo.key')">
            <NText code>{{ appStore.serverConfig.key ? appStore.serverConfig.key.slice(0, 8) + '••••' : '-' }}</NText>
          </NDescriptionsItem>
        </NDescriptions>
        <NSpace>
          <NButton type="primary" @click="copyCredentials">
            {{ $t('myInfo.copyCredentials') }}
          </NButton>
          <NButton type="success" @click="copyClientImportConfig">
            {{ $t('myInfo.copyClientConfig') }}
          </NButton>
        </NSpace>
      </NSpace>
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

    <NModal
      v-model:show="editModalShow"
      preset="card"
      :title="$t('myInfo.editProfile')"
      style="width: 680px; max-width: 94vw"
    >
      <NForm ref="editFormRef" :model="editForm" :rules="editRules" label-placement="top">
        <NFormItem :label="$t('myInfo.nickname')" path="nickname">
          <NInput v-model:value="editForm.nickname" :placeholder="$t('myInfo.nickname')" />
        </NFormItem>
        <NFormItem :label="$t('myInfo.email')" path="email">
          <NInput v-model:value="editForm.email" :placeholder="$t('myInfo.email')" />
        </NFormItem>
        <NFormItem :label="$t('myInfo.avatar')">
          <NSpace vertical style="width: 100%">
            <NRadioGroup v-model:value="avatarMode" size="small">
              <NRadioButton value="upload">
                {{ $t('myInfo.avatarUpload') }}
              </NRadioButton>
              <NRadioButton value="external">
                {{ $t('myInfo.avatarExternal') }}
              </NRadioButton>
            </NRadioGroup>
            <input
              v-if="avatarMode === 'upload'"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="handleAvatarFileChange"
            />
            <NInput
              v-else
              :value="editForm.avatar"
              :placeholder="$t('myInfo.avatarUrlPlaceholder')"
              @update:value="handleExternalAvatarInput"
            />
            <NSpace v-if="avatarPreviewUrl" align="start" :size="20" wrap>
              <div class="avatar-crop-preview">
                <img
                  :src="avatarPreviewUrl"
                  :style="{
                    transform: `translate(${avatarOffsetX / 8}px, ${avatarOffsetY / 8}px) scale(${avatarScale})`,
                  }"
                  alt="avatar preview"
                />
              </div>
              <NSpace vertical style="min-width: 220px; flex: 1">
                <NText depth="3">{{ $t('myInfo.avatarPreviewHelp') }}</NText>
                <div>
                  <NText depth="3">{{ $t('myInfo.avatarScale') }}</NText>
                  <NSlider v-model:value="avatarScale" :min="1" :max="3" :step="0.05" />
                </div>
                <div>
                  <NText depth="3">{{ $t('myInfo.avatarOffsetX') }}</NText>
                  <NSlider v-model:value="avatarOffsetX" :min="-180" :max="180" :step="1" />
                </div>
                <div>
                  <NText depth="3">{{ $t('myInfo.avatarOffsetY') }}</NText>
                  <NSlider v-model:value="avatarOffsetY" :min="-180" :max="180" :step="1" />
                </div>
              </NSpace>
            </NSpace>
            <NText v-else depth="3">{{ $t('myInfo.avatarEmptyHelp') }}</NText>
            <canvas ref="avatarCanvasRef" style="display: none"></canvas>
          </NSpace>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeEditProfile">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="editLoading" @click="handleSaveProfile">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>

<style scoped>
.avatar-crop-preview {
  align-items: center;
  background: linear-gradient(45deg, #eee 25%, transparent 25%),
    linear-gradient(-45deg, #eee 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eee 75%),
    linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-color: #fff;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 50%;
  display: flex;
  height: 180px;
  justify-content: center;
  overflow: hidden;
  width: 180px;
}

.avatar-crop-preview img {
  height: 100%;
  object-fit: cover;
  transform-origin: center;
  width: 100%;
}
</style>
