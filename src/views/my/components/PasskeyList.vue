<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard, NButton, NSpace, NDataTable, NModal, NForm, NFormItem,
  NInput, NAlert,
  useDialog, useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { passkeyList, passkeyRegisterBegin, passkeyRegisterFinish, passkeyRename, passkeyDelete } from '@/api/passkey'
import { getPasskeySupport, parseCreationOptions, serializeCredential, type PasskeySupport } from '@/utils/webauthn'
import type { PasskeyItem } from '@/types'
import { formatTime } from '@/utils/format'
import { h } from 'vue'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dataList = ref<PasskeyItem[]>([])
const support = ref<PasskeySupport>({ secure: false, api: false, platformAuthenticator: false, conditionalMediation: false })

const addModalShow = ref(false)
const newName = ref('')
const adding = ref(false)
const renameModalShow = ref(false)
const renameId = ref(0)
const renameName = ref('')
const renaming = ref(false)

const columns: DataTableColumns<PasskeyItem> = [
  { title: t('mySecurity.passkeyName'), key: 'name', ellipsis: { tooltip: true } },
  {
    title: t('mySecurity.passkeyCreatedAt'),
    key: 'created_at',
    render: (row) => formatTime(row.created_at),
  },
  {
    title: t('mySecurity.passkeyLastUsed'),
    key: 'last_used_at',
    render: (row) => row.last_used_at ? formatTime(row.last_used_at) : '-',
  },
  {
    title: t('mySecurity.passkeyTransports'),
    key: 'transports',
    render: (row) => row.transports ? row.transports.join(', ') : '-',
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 180,
    render: (row) =>
      h(NSpace, { size: 8 }, () => [
        h(
          NButton,
          { size: 'small', onClick: () => openRename(row) },
          () => t('common.edit'),
        ),
        h(
          NButton,
          { size: 'small', type: 'error', ghost: true, onClick: () => handleDelete(row) },
          () => t('common.delete'),
        ),
      ]),
  },
]

async function loadSupport(): Promise<void> {
  support.value = await getPasskeySupport()
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await passkeyList()
    dataList.value = (res.data || []) as PasskeyItem[]
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleAdd(): Promise<void> {
  if (!newName.value) return
  if (!support.value.secure || !support.value.api) {
    message.error(t('mySecurity.passkeyUnsupported'))
    return
  }
  adding.value = true
  try {
    const beginRes = await passkeyRegisterBegin({ name: newName.value })
    const publicKey = parseCreationOptions(beginRes.data.public_key as never)
    const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential
    if (!credential) {
      message.error(t('mySecurity.passkeyCancelled'))
      return
    }
    const serialized = serializeCredential(credential)
    await passkeyRegisterFinish({
      challenge_id: beginRes.data.challenge_id,
      name: newName.value,
      credential: serialized,
    })
    message.success(t('mySecurity.passkeyAdded'))
    addModalShow.value = false
    newName.value = ''
    loadData()
  } catch {
    // ignore
  } finally {
    adding.value = false
  }
}

function openRename(row: PasskeyItem): void {
  renameId.value = row.id
  renameName.value = row.name
  renameModalShow.value = true
}

async function handleRename(): Promise<void> {
  if (!renameName.value) return
  renaming.value = true
  try {
    await passkeyRename({ id: renameId.value, name: renameName.value })
    message.success(t('common.success'))
    renameModalShow.value = false
    loadData()
  } catch {
    // ignore
  } finally {
    renaming.value = false
  }
}

function handleDelete(row: PasskeyItem): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('mySecurity.passkeyDeleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await passkeyDelete({ id: row.id })
        message.success(t('common.success'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

onMounted(() => {
  loadSupport()
  loadData()
})
</script>

<template>
  <NCard :title="t('mySecurity.passkeyManagement')" :bordered="false" size="small">
    <NSpace vertical :size="12">
      <NAlert v-if="!support.secure" type="warning" :show-icon="true">
        {{ t('mySecurity.passkeyNotSecureContext') }}
      </NAlert>
      <NAlert v-else-if="!support.api" type="warning" :show-icon="true">
        {{ t('mySecurity.passkeyUnsupported') }}
      </NAlert>

      <NSpace justify="space-between" align="center">
        <NButton type="primary" size="small" @click="addModalShow = true">{{ t('mySecurity.passkeyAdd') }}</NButton>
      </NSpace>

      <NDataTable
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :bordered="false"
        :scroll-x="600"
      />
    </NSpace>

    <NModal v-model:show="addModalShow" preset="card" :title="t('mySecurity.passkeyAdd')" style="width: 420px; max-width: 90vw">
      <NForm label-placement="top">
        <NFormItem :label="t('mySecurity.passkeyName')">
          <NInput v-model:value="newName" :placeholder="t('mySecurity.passkeyNamePlaceholder')" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="addModalShow = false">{{ t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="adding" :disabled="!newName" @click="handleAdd">{{ t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="renameModalShow" preset="card" :title="t('mySecurity.passkeyRename')" style="width: 420px; max-width: 90vw">
      <NForm label-placement="top">
        <NFormItem :label="t('mySecurity.passkeyName')">
          <NInput v-model:value="renameName" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="renameModalShow = false">{{ t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="renaming" :disabled="!renameName" @click="handleRename">{{ t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
