<script setup lang="ts">
defineOptions({ name: 'MyInfo' })
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
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
  NRadioGroup,
  NRadioButton,
  type FormInst,
  type FormRules,
  useMessage,
} from 'naive-ui'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { changeCurPwd, changeCurInfo, myOauth } from '@/api/user'
import { unbind } from '@/api/oauth'
import { uploadFile } from '@/api/file'
import type { UserOauthItem } from '@/types'
import clipboard from 'clipboard'

const userStore = useUserStore()
const appStore = useAppStore()
const message = useMessage()

const oauthLoading = ref(false)
const oauthList = ref<UserOauthItem[]>([])

const pwdForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const helloText = computed(() => {
  return appStore.adminConfig.hello || ''
})

function resetPwdForm(): void {
  pwdForm.old_password = ''
  pwdForm.new_password = ''
  pwdForm.confirm_password = ''
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

const serverConfigImportText = computed(() => {
  const cfg = appStore.serverConfig
  if (!cfg) return ''
  const parts: string[] = []
  if (cfg.id_server) parts.push(cfg.id_server)
  if (cfg.relay_server) parts.push(cfg.relay_server)
  if (cfg.api_server) parts.push(cfg.api_server)
  if (cfg.key) parts.push(cfg.key)
  return parts.join(',')
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
const editFormRef = ref<FormInst | null>(null)
const editFormModel = computed(() => ({ ...editForm, ...pwdForm }))
const avatarMode = ref<'upload' | 'external'>('upload')
const avatarPreviewUrl = ref('')
const cropperImageRef = ref<HTMLImageElement | null>(null)
let cropperInstance: Cropper | null = null
let avatarObjectUrl = ''

const editRules = computed<FormRules>(() => {
  const passwordValidator = (_rule: unknown, value: string): boolean | Error => {
    const hasAnyPassword = Boolean(pwdForm.old_password || pwdForm.new_password || pwdForm.confirm_password)
    if (!hasAnyPassword) return true
    if (!value) return new Error(appStore.t('login.password'))
    if (pwdForm.new_password && pwdForm.confirm_password && pwdForm.new_password !== pwdForm.confirm_password) {
      return new Error(appStore.t('register.passwordMismatch'))
    }
    return true
  }

  return {
    nickname: [
      { required: true, message: appStore.t('myInfo.nicknameRequired'), trigger: ['blur', 'input'] },
    ],
    old_password: [{ validator: passwordValidator, trigger: ['blur', 'input'] }],
    new_password: [{ validator: passwordValidator, trigger: ['blur', 'input'] }],
    confirm_password: [{ validator: passwordValidator, trigger: ['blur', 'input'] }],
  }
})

function revokeAvatarObjectUrl(): void {
  if (avatarObjectUrl) {
    URL.revokeObjectURL(avatarObjectUrl)
    avatarObjectUrl = ''
  }
}

function destroyCropper(): void {
  if (cropperInstance) {
    cropperInstance.destroy()
    cropperInstance = null
  }
}

function resetAvatarEditor(): void {
  destroyCropper()
  revokeAvatarObjectUrl()
  avatarPreviewUrl.value = editForm.avatar || ''
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
  destroyCropper()
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
  if (file.size > 10 * 1024 * 1024) {
    message.error(appStore.t('myInfo.avatarTooLarge'))
    input.value = ''
    return
  }
  destroyCropper()
  revokeAvatarObjectUrl()
  avatarObjectUrl = URL.createObjectURL(file)
  avatarPreviewUrl.value = avatarObjectUrl
  avatarMode.value = 'upload'
  nextTick(() => initCropper())
}

function handleExternalAvatarInput(value: string): void {
  editForm.avatar = value.trim()
  avatarPreviewUrl.value = editForm.avatar
}

function initCropper(): void {
  if (!cropperImageRef.value || !avatarPreviewUrl.value) return
  destroyCropper()
  cropperInstance = new Cropper(cropperImageRef.value, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.9,
    cropBoxResizable: true,
    cropBoxMovable: true,
    background: false,
    responsive: true,
    checkCrossOrigin: false,
  })
}

watch(avatarMode, (mode) => {
  if (mode === 'upload' && avatarPreviewUrl.value) {
    nextTick(() => initCropper())
  } else {
    destroyCropper()
  }
})

watch(avatarPreviewUrl, () => {
  if (avatarMode.value === 'upload' && avatarPreviewUrl.value) {
    nextTick(() => initCropper())
  }
})

async function renderCroppedAvatarBlob(): Promise<Blob | null> {
  if (avatarMode.value === 'external' || !cropperInstance) {
    return null
  }
  return new Promise((resolve) => {
    const canvas = cropperInstance!.getCroppedCanvas({
      width: 512,
      height: 512,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })
    if (!canvas) {
      resolve(null)
      return
    }
    canvas.toBlob(
      (blob: Blob | null) => resolve(blob),
      'image/webp',
      0.9,
    )
  })
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
    if (pwdForm.old_password && pwdForm.new_password) {
      await changeCurPwd({
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      })
    }
    message.success(appStore.t('myInfo.profileUpdated'))
    editModalShow.value = false
    destroyCropper()
    revokeAvatarObjectUrl()
    resetPwdForm()
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
        <NButton size="small" type="primary" ghost @click="openEditProfile">{{ $t('common.edit') }}</NButton>
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
      @after-leave="destroyCropper"
    >
      <NForm ref="editFormRef" :model="editFormModel" :rules="editRules" label-placement="top">
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
            <NSpace v-if="avatarMode === 'upload' && avatarPreviewUrl" vertical :size="12">
              <NText depth="3" style="font-size: 13px">{{ $t('myInfo.avatarCropHelp') }}</NText>
              <div class="avatar-cropper-wrapper">
                <img
                  ref="cropperImageRef"
                  :src="avatarPreviewUrl"
                  alt="avatar"
                  style="max-width: 100%; display: block"
                />
              </div>
            </NSpace>
            <NText v-else-if="avatarMode === 'upload'" depth="3">{{ $t('myInfo.avatarEmptyHelp') }}</NText>
          </NSpace>
        </NFormItem>
        <NFormItem :label="$t('myInfo.changePassword')">
          <NSpace vertical style="width: 100%">
            <NFormItem path="old_password" :show-label="false">
              <NInput
                v-model:value="pwdForm.old_password"
                type="password"
                show-password-on="click"
                :placeholder="$t('myInfo.oldPassword')"
              />
            </NFormItem>
            <NFormItem path="new_password" :show-label="false">
              <NInput
                v-model:value="pwdForm.new_password"
                type="password"
                show-password-on="click"
                :placeholder="$t('myInfo.newPassword')"
              />
            </NFormItem>
            <NFormItem path="confirm_password" :show-label="false">
              <NInput
                v-model:value="pwdForm.confirm_password"
                type="password"
                show-password-on="click"
                :placeholder="$t('myInfo.confirmPassword')"
              />
            </NFormItem>
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
.avatar-cropper-wrapper {
  width: 100%;
  max-width: 400px;
  height: 300px;
  border: 1px solid var(--n-border-color, #efeff5);
  border-radius: 8px;
  overflow: hidden;
}

.avatar-cropper-wrapper img {
  display: block;
  max-width: 100%;
}
</style>
