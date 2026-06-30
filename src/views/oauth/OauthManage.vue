<script setup lang="ts">
defineOptions({ name: 'Oauth' })
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
  type SelectOption,
} from 'naive-ui'
import { create, deleteOauth, list, update, type OauthForm } from '@/api/oauth'
import type { Oauth } from '@/types'
import { formatTime } from '@/utils/format'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const oauthTypeOptions: SelectOption[] = [
  { label: 'github', value: 'github' },
  { label: 'google', value: 'google' },
  { label: 'oidc', value: 'oidc' },
  { label: 'webauth', value: 'webauth' },
]

const pkceMethodOptions: SelectOption[] = [
  { label: 'S256', value: 'S256' },
  { label: 'plain', value: 'plain' },
]

const loading = ref(false)
const saving = ref(false)
const dataList = ref<Oauth[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const columns = computed<DataTableColumns<Oauth>>(() => [
  { title: t('adminOauth.op'), key: 'op', ellipsis: { tooltip: true } },
  { title: t('adminOauth.oauthType'), key: 'oauth_type', ellipsis: { tooltip: true } },
  { title: t('adminOauth.issuer'), key: 'issuer', ellipsis: { tooltip: true } },
  { title: t('adminOauth.clientId'), key: 'client_id', ellipsis: { tooltip: true } },
  {
    title: t('adminOauth.autoRegister'),
    key: 'auto_register',
    render: (row) =>
      h(
        NTag,
        { type: row.auto_register ? 'success' : 'default', size: 'small' },
        () => (row.auto_register ? t('adminOauth.yes') : t('adminOauth.no')),
      ),
  },
  {
    title: t('adminOauth.pkceEnable'),
    key: 'pkce_enable',
    render: (row) =>
      h(
        NTag,
        { type: row.pkce_enable ? 'success' : 'default', size: 'small' },
        () => (row.pkce_enable ? t('adminOauth.yes') : t('adminOauth.no')),
      ),
  },
  { title: t('adminOauth.createdAt'), key: 'created_at', render: (row) => formatTime(row.created_at) },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 180,
    render: (row) =>
      h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NButton,
              { size: 'small', onClick: () => openEdit(row) },
              { default: () => t('common.edit') },
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                ghost: true,
                onClick: () => handleDelete(row),
              },
              { default: () => t('common.delete') },
            ),
          ],
        },
      ),
  },
])

const formRef = ref<FormInst | null>(null)
const modalShow = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formModel = reactive<{
  id?: number
  op: string
  oauth_type: string
  client_id: string
  client_secret: string
  issuer: string
  scopes: string
  auto_register: boolean
  pkce_enable: boolean
  pkce_method: string
}>({
  id: undefined,
  op: '',
  oauth_type: 'github',
  client_id: '',
  client_secret: '',
  issuer: '',
  scopes: '',
  auto_register: false,
  pkce_enable: false,
  pkce_method: 'S256',
})

const rules = computed<FormRules>(() => ({
  op: [
    { required: true, message: t('adminOauth.opRequired'), trigger: ['blur', 'input'] },
  ],
  oauth_type: [
    { required: true, message: t('adminOauth.oauthTypeRequired'), trigger: 'change' },
  ],
  client_id: [
    { required: true, message: t('adminOauth.clientIdRequired'), trigger: ['blur', 'input'] },
  ],
  client_secret: modalMode.value === 'create' ? [{ required: true, message: t('adminOauth.clientSecretRequired'), trigger: ['blur', 'input'] }] : [],
  issuer: [
    {
      validator: (_rule, value: string) => {
        if (formModel.oauth_type === 'oidc' && !value) {
          return new Error(t('adminOauth.issuerRequired'))
        }
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
}))

let latestRequestId = 0

async function loadData(): Promise<void> {
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const res = await list({ page: pagination.page, page_size: pagination.pageSize })
    if (requestId !== latestRequestId) return
    dataList.value = res.data.list ?? []
    pagination.itemCount = res.data.total ?? 0
  } catch {
    if (requestId !== latestRequestId) return
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

function handlePageChange(page: number): void {
  pagination.page = page
  loadData()
}

function handlePageSizeChange(pageSize: number): void {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

function resetForm(): void {
  formModel.id = undefined
  formModel.op = ''
  formModel.oauth_type = 'github'
  formModel.client_id = ''
  formModel.client_secret = ''
  formModel.issuer = ''
  formModel.scopes = ''
  formModel.auto_register = false
  formModel.pkce_enable = false
  formModel.pkce_method = 'S256'
}

function openCreate(): void {
  modalMode.value = 'create'
  resetForm()
  formRef.value?.restoreValidation()
  modalShow.value = true
}

function openEdit(row: Oauth): void {
  modalMode.value = 'edit'
  formModel.id = row.id
  formModel.op = row.op
  formModel.oauth_type = row.oauth_type
  formModel.client_id = row.client_id
  formModel.client_secret = ''
  formModel.issuer = row.issuer
  formModel.scopes = row.scopes
  formModel.auto_register = !!row.auto_register
  formModel.pkce_enable = !!row.pkce_enable
  formModel.pkce_method = row.pkce_method || 'S256'
  formRef.value?.restoreValidation()
  modalShow.value = true
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload: OauthForm = {
      op: formModel.op,
      oauth_type: formModel.oauth_type,
      client_id: formModel.client_id,
      client_secret: formModel.client_secret,
      issuer: formModel.issuer,
      scopes: formModel.scopes,
      auto_register: formModel.auto_register,
      pkce_enable: formModel.pkce_enable,
      pkce_method: formModel.pkce_enable ? formModel.pkce_method : '',
    }
    if (modalMode.value === 'edit' && !payload.client_secret) {
      delete payload.client_secret
    }
    if (modalMode.value === 'edit' && formModel.id != null) {
      payload.id = formModel.id
      await update(payload)
    } else {
      await create(payload)
    }
    message.success(t('common.success'))
    modalShow.value = false
    loadData()
  } catch {
    //ignore
  } finally {
    saving.value = false
  }
}

function handleDelete(row: Oauth): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminOauth.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteOauth({ id: row.id })
        message.success(t('common.success'))
        loadData()
      } catch {
        //ignore
      }
    },
  })
}

onMounted(loadData)
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminOauth.title') }}</template>
    <template #header-extra>
      <NButton type="primary" @click="openCreate">{{ $t('adminOauth.createOauth') }}</NButton>
    </template>
    <NDataTable
      remote
      :scroll-x="1100"
      :bordered="false"
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
    <NModal
      v-model:show="modalShow"
      preset="card"
      :title="modalMode === 'edit' ? $t('adminOauth.editOauth') : $t('adminOauth.createOauth')"
      style="width: 520px; max-width: 90vw"
    >
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="top">
        <NFormItem :label="$t('adminOauth.op')" path="op">
          <NInput v-model:value="formModel.op" :placeholder="$t('adminOauth.op')" />
        </NFormItem>
        <NFormItem :label="$t('adminOauth.oauthType')" path="oauth_type">
          <NSelect v-model:value="formModel.oauth_type" :options="oauthTypeOptions" />
        </NFormItem>
        <NFormItem :label="$t('adminOauth.clientId')" path="client_id">
          <NInput v-model:value="formModel.client_id" :placeholder="$t('adminOauth.clientId')" />
        </NFormItem>
        <NFormItem :label="$t('adminOauth.clientSecret')" path="client_secret">
          <NInput
            v-model:value="formModel.client_secret"
            type="password"
            show-password-on="click"
            :placeholder="modalMode === 'edit' ? $t('adminOauth.clientSecretKeepEmpty') : $t('adminOauth.clientSecret')"
          />
        </NFormItem>
        <NFormItem :label="$t('adminOauth.issuer')" path="issuer">
          <NInput v-model:value="formModel.issuer" :placeholder="$t('adminOauth.issuer')" />
        </NFormItem>
        <NFormItem :label="$t('adminOauth.scopes')" path="scopes">
          <NInput v-model:value="formModel.scopes" :placeholder="$t('adminOauth.scopes')" />
        </NFormItem>
        <NFormItem :label="$t('adminOauth.autoRegister')" path="auto_register">
          <NSwitch v-model:value="formModel.auto_register" />
        </NFormItem>
        <NFormItem :label="$t('adminOauth.pkceEnable')" path="pkce_enable">
          <NSwitch v-model:value="formModel.pkce_enable" />
        </NFormItem>
        <NFormItem
          v-if="formModel.pkce_enable"
          :label="$t('adminOauth.pkceMethod')"
          path="pkce_method"
        >
          <NSelect v-model:value="formModel.pkce_method" :options="pkceMethodOptions" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalShow = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
