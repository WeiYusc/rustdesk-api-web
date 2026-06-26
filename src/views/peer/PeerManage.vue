<script setup lang="ts">
defineOptions({ name: 'Peer' })
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
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  list,
  create,
  update,
  deletePeer,
  batchDelete,
  type PeerForm,
} from '@/api/peer'
import { list as listGroups } from '@/api/deviceGroup'
import type { Peer } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const saving = ref(false)
const dataList = ref<Peer[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const searchId = ref('')
const searchHostname = ref('')
const searchAlias = ref('')
const searchUsername = ref('')
const searchIp = ref('')

const checkedRowKeys = ref<Array<string | number>>([])

const groupOptions = ref<{ label: string; value: number }[]>([])

async function loadGroups(): Promise<void> {
  try {
    const res = await listGroups({ page: 1, page_size: 1000 })
    groupOptions.value = (res.data.list || []).map((g) => ({
      label: g.name,
      value: g.id,
    }))
  } catch {
    // ignore
  }
}

function formatTime(ts: number): string {
  if (!ts) return '-'
  const ms = ts < 1e12 ? ts * 1000 : ts
  return new Date(ms).toLocaleString()
}

const columns = computed<DataTableColumns<Peer>>(() => [
  { type: 'selection' },
  { title: t('adminPeer.id'), key: 'id', width: 180 },
  { title: t('adminPeer.hostname'), key: 'hostname' },
  { title: t('adminPeer.alias'), key: 'alias' },
  { title: t('adminPeer.os'), key: 'os' },
  { title: t('adminPeer.username'), key: 'username' },
  { title: t('adminPeer.lastOnlineIp'), key: 'last_online_ip' },
  {
    title: t('adminPeer.lastOnlineTime'),
    key: 'last_online_time',
    render: (row) => formatTime(row.last_online_time),
  },
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

function rowKey(row: Peer): number {
  return row.row_id
}

const formRef = ref<FormInst | null>(null)
const modalShow = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formModel = reactive<{
  row_id: number | undefined
  id: string
  hostname: string
  alias: string
  os: string
  username: string
  cpu: string
  memory: string
  uuid: string
  version: string
  group_id: number | null
}>({
  row_id: undefined,
  id: '',
  hostname: '',
  alias: '',
  os: '',
  username: '',
  cpu: '',
  memory: '',
  uuid: '',
  version: '',
  group_id: null,
})
const rules = computed<FormRules>(() => ({
  id: [{ required: true, message: t('adminPeer.required'), trigger: ['blur', 'input'] }],
}))

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      id: searchId.value || undefined,
      hostname: searchHostname.value || undefined,
      alias: searchAlias.value || undefined,
      username: searchUsername.value || undefined,
      ip: searchIp.value || undefined,
    })
    dataList.value = res.data.list ?? []
    pagination.itemCount = res.data.total ?? 0
  } catch {
    // ignore
  } finally {
    loading.value = false
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

function handleCheck(keys: Array<string | number>): void {
  checkedRowKeys.value = keys
}

function handleSearch(): void {
  pagination.page = 1
  loadData()
}

function handleReset(): void {
  searchId.value = ''
  searchHostname.value = ''
  searchAlias.value = ''
  searchUsername.value = ''
  searchIp.value = ''
  pagination.page = 1
  loadData()
}

function resetForm(): void {
  formModel.row_id = undefined
  formModel.id = ''
  formModel.hostname = ''
  formModel.alias = ''
  formModel.os = ''
  formModel.username = ''
  formModel.cpu = ''
  formModel.memory = ''
  formModel.uuid = ''
  formModel.version = ''
  formModel.group_id = null
}

function openCreate(): void {
  modalMode.value = 'create'
  resetForm()
  formRef.value?.restoreValidation()
  modalShow.value = true
}

function openEdit(row: Peer): void {
  modalMode.value = 'edit'
  formModel.row_id = row.row_id
  formModel.id = row.id || ''
  formModel.hostname = row.hostname || ''
  formModel.alias = row.alias || ''
  formModel.os = row.os || ''
  formModel.username = row.username || ''
  formModel.cpu = row.cpu || ''
  formModel.memory = row.memory || ''
  formModel.uuid = row.uuid || ''
  formModel.version = row.version || ''
  formModel.group_id = row.group_id || null
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
    const payload: PeerForm = {
      id: formModel.id,
      hostname: formModel.hostname,
      alias: formModel.alias,
      os: formModel.os,
      username: formModel.username,
      cpu: formModel.cpu,
      memory: formModel.memory,
      uuid: formModel.uuid,
      version: formModel.version,
      group_id: formModel.group_id ?? undefined,
    }
    if (modalMode.value === 'edit' && formModel.row_id != null) {
      payload.row_id = formModel.row_id
      await update(payload)
    } else {
      await create(payload)
    }
    message.success(t('common.success'))
    modalShow.value = false
    loadData()
  } catch {
    // ignore
  } finally {
    saving.value = false
  }
}

function handleDelete(row: Peer): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminPeer.confirmDelete'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deletePeer({ row_id: row.row_id })
        message.success(t('adminPeer.deleteSuccess'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

function handleBatchDelete(): void {
  if (checkedRowKeys.value.length === 0) {
    message.warning(t('adminPeer.noSelection'))
    return
  }
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminPeer.confirmBatchDelete'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await batchDelete({ row_ids: checkedRowKeys.value as number[] })
        message.success(t('adminPeer.batchDeleteSuccess'))
        checkedRowKeys.value = []
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

onMounted(() => {
  loadData()
  loadGroups()
})
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminPeer.title') }}</template>
    <template #header-extra>
      <NSpace>
        <NButton type="primary" @click="openCreate">
          {{ $t('adminPeer.create') }}
        </NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('adminPeer.batchDelete') }}
        </NButton>
      </NSpace>
    </template>
    <NSpace align="center" style="margin-bottom: 16px">
      <NInput
        v-model:value="searchId"
        :placeholder="$t('adminPeer.searchId')"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchHostname"
        :placeholder="$t('adminPeer.searchHostname')"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchAlias"
        :placeholder="$t('adminPeer.searchAlias')"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchUsername"
        :placeholder="$t('adminPeer.searchUsername')"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchIp"
        :placeholder="$t('adminPeer.searchIp')"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <NButton type="primary" @click="handleSearch">
        {{ $t('common.search') }}
      </NButton>
      <NButton @click="handleReset">
        {{ $t('adminPeer.reset') }}
      </NButton>
    </NSpace>
    <NDataTable
      remote
      :bordered="false"
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      :row-key="rowKey"
      :checked-row-keys="checkedRowKeys"
      @update:checked-row-keys="handleCheck"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
    <NModal
      v-model:show="modalShow"
      preset="card"
      :title="modalMode === 'edit' ? $t('adminPeer.edit') : $t('adminPeer.create')"
      style="width: 600px"
    >
      <NForm
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="left"
        label-width="120"
      >
        <NFormItem :label="$t('adminPeer.id')" path="id">
          <NInput v-model:value="formModel.id" :disabled="modalMode === 'edit'" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.hostname')" path="hostname">
          <NInput v-model:value="formModel.hostname" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.alias')" path="alias">
          <NInput v-model:value="formModel.alias" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.groupId')" path="group_id">
          <NSelect
            v-model:value="formModel.group_id"
            :options="groupOptions"
            clearable
            filterable
          />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.username')" path="username">
          <NInput v-model:value="formModel.username" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.os')" path="os">
          <NInput v-model:value="formModel.os" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.cpu')" path="cpu">
          <NInput v-model:value="formModel.cpu" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.memory')" path="memory">
          <NInput v-model:value="formModel.memory" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.version')" path="version">
          <NInput v-model:value="formModel.version" />
        </NFormItem>
        <NFormItem :label="$t('adminPeer.uuid')" path="uuid">
          <NInput v-model:value="formModel.uuid" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalShow = false">
            {{ $t('common.cancel') }}
          </NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
