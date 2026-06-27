<script setup lang="ts">
defineOptions({ name: 'UserAddressBook' })
import { ref, reactive, computed, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NDataTable,
  NButton,
  NSpace,
  NInput,
  NInputNumber,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NSwitch,
  NTag,
  useMessage,
  useDialog,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  list,
  create,
  update,
  deleteAddressBook,
  batchCreate,
  batchCreateFromPeers,
  shareByWebClient,
} from '@/api/addressBook'
import { list as listTags } from '@/api/tag'
import { list as listUsers } from '@/api/user'
import { list as listPeers } from '@/api/peer'
import type { AddressBook, Peer } from '@/types'
import { useIsMobile } from '@/composables/useIsMobile'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const { isMobile } = useIsMobile()

interface AddressBookFormData {
  row_id?: number
  id: string
  username: string
  password: string
  hostname: string
  alias: string
  platform: string
  tags: string[]
  user_id: number | null
  forceAlwaysRelay: boolean
  rdpPort: string
  rdpUsername: string
}

interface BatchCreateFormData {
  id: string
  username: string
  password: string
  hostname: string
  alias: string
  platform: string
  tags: string[]
  user_ids: number[]
  forceAlwaysRelay: boolean
  rdpPort: string
  rdpUsername: string
}

interface ShareFormData {
  id: string
  password_type: string
  password: string
  expire: number | null
}

const loading = ref(false)
const dataList = ref<AddressBook[]>([])

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
const filterUserId = ref<number | null>(null)

const checkedRowKeys = ref<Array<string | number>>([])

const tagOptions = ref<{ label: string; value: string }[]>([])
const userOptions = ref<{ label: string; value: number }[]>([])

const modalVisible = ref(false)
const modalTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)

const form = reactive<AddressBookFormData>({
  row_id: undefined,
  id: '',
  username: '',
  password: '',
  hostname: '',
  alias: '',
  platform: '',
  tags: [],
  user_id: null,
  forceAlwaysRelay: false,
  rdpPort: '',
  rdpUsername: '',
})

const formRules = computed<FormRules>(() => ({
  id: {
    required: true,
    message: t('adminAddressBook.required'),
    trigger: 'blur',
  },
}))

const batchCreateModalVisible = ref(false)
const batchCreateSaving = ref(false)
const batchCreateForm = reactive<BatchCreateFormData>({
  id: '',
  username: '',
  password: '',
  hostname: '',
  alias: '',
  platform: '',
  tags: [],
  user_ids: [],
  forceAlwaysRelay: false,
  rdpPort: '',
  rdpUsername: '',
})

const peerModalVisible = ref(false)
const peerLoading = ref(false)
const peerList = ref<Peer[]>([])
const peerCheckedRowKeys = ref<Array<string | number>>([])
const peerImportTags = ref<string[]>([])
const peerImportSaving = ref(false)
const peerImportUserId = ref<number | null>(null)
const peerSearchId = ref('')
const peerSearchHostname = ref('')
const peerSearchAlias = ref('')
const peerPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const shareModalVisible = ref(false)
const shareSaving = ref(false)
const shareForm = reactive<ShareFormData>({
  id: '',
  password_type: 'permanent',
  password: '',
  expire: 0,
})
const shareTokenModalVisible = ref(false)
const shareToken = ref('')

const passwordTypeOptions = computed(() => [
  { label: t('adminAddressBook.passwordTypePermanent'), value: 'permanent' },
  { label: t('adminAddressBook.passwordTypeTemporary'), value: 'temporary' },
])

const columns = computed<DataTableColumns<AddressBook>>(() => [
  { type: 'selection' },
  { title: t('adminAddressBook.id'), key: 'id', width: 180 },
  { title: t('adminAddressBook.alias'), key: 'alias' },
  { title: t('adminAddressBook.hostname'), key: 'hostname' },
  { title: t('adminAddressBook.username'), key: 'username' },
  {
    title: t('adminAddressBook.tags'),
    key: 'tags',
    render(row) {
      if (!row.tags || row.tags.length === 0) return '-'
      return h(
        NSpace,
        { size: 4 },
        () => row.tags.map((tag) => h(NTag, { size: 'small' }, () => tag)),
      )
    },
  },
  {
    title: t('adminAddressBook.online'),
    key: 'online',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.online ? 'success' : 'default', size: 'small' },
        () =>
          row.online
            ? t('adminAddressBook.onlineStatus')
            : t('adminAddressBook.offlineStatus'),
      )
    },
  },
  {
    title: t('adminAddressBook.userId'),
    key: 'user_id',
    render: (row) => '#' + row.user_id,
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 240,
    render(row) {
      return h(NSpace, null, () => [
        h(
          NButton,
          { size: 'small', onClick: () => openEdit(row) },
          () => t('common.edit'),
        ),
        h(
          NButton,
          { size: 'small', type: 'info', onClick: () => openShare(row) },
          () => t('adminAddressBook.shareByWebClient'),
        ),
        h(
          NButton,
          { size: 'small', type: 'error', onClick: () => handleDelete(row) },
          () => t('common.delete'),
        ),
      ])
    },
  },
])

function rowKey(row: AddressBook): number {
  return row.row_id
}

const peerColumns = computed<DataTableColumns<Peer>>(() => [
  { type: 'selection' },
  { title: t('adminPeer.id'), key: 'id', width: 180 },
  { title: t('adminPeer.hostname'), key: 'hostname' },
  { title: t('adminPeer.alias'), key: 'alias' },
  { title: t('adminPeer.os'), key: 'os' },
  { title: t('adminPeer.username'), key: 'username' },
])

function peerRowKey(row: Peer): number {
  return row.row_id
}

let latestRequestId = 0

async function loadData(): Promise<void> {
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      user_id: filterUserId.value ?? undefined,
      id: searchId.value || undefined,
      hostname: searchHostname.value || undefined,
      alias: searchAlias.value || undefined,
    })
    if (requestId !== latestRequestId) return
    dataList.value = res.data.list || []
    pagination.itemCount = res.data.total || 0
  } catch {
    if (requestId !== latestRequestId) return
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

async function loadTags(): Promise<void> {
  try {
    const res = await listTags({ page: 1, page_size: 1000 })
    tagOptions.value = (res.data.list || []).map((tag) => ({
      label: tag.name,
      value: tag.name,
    }))
  } catch {
    // ignore
  }
}

async function loadUsers(): Promise<void> {
  try {
    const res = await listUsers({ page: 1, page_size: 1000 })
    userOptions.value = (res.data.list || []).map((u) => ({
      label: `${u.username} (${u.id})`,
      value: u.id,
    }))
  } catch {
    // ignore
  }
}

function handleCheck(keys: Array<string | number>): void {
  checkedRowKeys.value = keys
}

function handleSearch(): void {
  pagination.page = 1
  loadData()
}

function handlePageChange(page: number): void {
  pagination.page = page
  checkedRowKeys.value = []
  loadData()
}

function handlePageSizeChange(pageSize: number): void {
  pagination.pageSize = pageSize
  pagination.page = 1
  checkedRowKeys.value = []
  loadData()
}

function handleReset(): void {
  searchId.value = ''
  searchHostname.value = ''
  searchAlias.value = ''
  filterUserId.value = null
  pagination.page = 1
  loadData()
}

function resetForm(): void {
  form.row_id = undefined
  form.id = ''
  form.username = ''
  form.password = ''
  form.hostname = ''
  form.alias = ''
  form.platform = ''
  form.tags = []
  form.user_id = null
  form.forceAlwaysRelay = false
  form.rdpPort = ''
  form.rdpUsername = ''
}

function openCreate(): void {
  isEdit.value = false
  modalTitle.value = t('adminAddressBook.create')
  resetForm()
  formRef.value?.restoreValidation()
  modalVisible.value = true
}

function openEdit(row: AddressBook): void {
  isEdit.value = true
  modalTitle.value = t('adminAddressBook.edit')
  form.row_id = row.row_id
  form.id = row.id
  form.username = row.username || ''
  form.password = row.password || ''
  form.hostname = row.hostname || ''
  form.alias = row.alias || ''
  form.platform = row.platform || ''
  form.tags = row.tags ? [...row.tags] : []
  form.user_id = row.user_id || null
  form.forceAlwaysRelay = row.forceAlwaysRelay || false
  form.rdpPort = row.rdpPort || ''
  form.rdpUsername = row.rdpUsername || ''
  formRef.value?.restoreValidation()
  modalVisible.value = true
}

async function handleSave(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload = {
      row_id: form.row_id,
      id: form.id,
      username: form.username,
      password: form.password,
      hostname: form.hostname,
      alias: form.alias,
      platform: form.platform,
      tags: form.tags,
      user_id: form.user_id ?? undefined,
      forceAlwaysRelay: form.forceAlwaysRelay,
      rdpPort: form.rdpPort,
      rdpUsername: form.rdpUsername,
    }
    if (isEdit.value) {
      await update(payload)
      message.success(t('adminAddressBook.updateSuccess'))
    } else {
      await create(payload)
      message.success(t('adminAddressBook.createSuccess'))
    }
    modalVisible.value = false
    loadData()
  } catch {
    // ignore
  } finally {
    saving.value = false
  }
}

function handleDelete(row: AddressBook): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminAddressBook.confirmDelete'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteAddressBook({ row_id: row.row_id })
        message.success(t('adminAddressBook.deleteSuccess'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

function handleBatchDelete(): void {
  if (checkedRowKeys.value.length === 0) {
    message.warning(t('adminAddressBook.noSelection'))
    return
  }
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminAddressBook.confirmBatchDelete'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await Promise.all(
          (checkedRowKeys.value as number[]).map((rid) =>
            deleteAddressBook({ row_id: rid }),
          ),
        )
        message.success(t('adminAddressBook.deleteSuccess'))
        checkedRowKeys.value = []
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

function openBatchCreate(): void {
  batchCreateForm.id = ''
  batchCreateForm.username = ''
  batchCreateForm.password = ''
  batchCreateForm.hostname = ''
  batchCreateForm.alias = ''
  batchCreateForm.platform = ''
  batchCreateForm.tags = []
  batchCreateForm.user_ids = []
  batchCreateForm.forceAlwaysRelay = false
  batchCreateForm.rdpPort = ''
  batchCreateForm.rdpUsername = ''
  batchCreateModalVisible.value = true
}

async function handleBatchCreate(): Promise<void> {
  if (batchCreateForm.user_ids.length === 0) {
    message.warning(t('adminAddressBook.noSelection'))
    return
  }
  if (!batchCreateForm.id) {
    message.warning(t('adminAddressBook.required'))
    return
  }
  batchCreateSaving.value = true
  try {
    await batchCreate({
      id: batchCreateForm.id,
      username: batchCreateForm.username,
      password: batchCreateForm.password,
      hostname: batchCreateForm.hostname,
      alias: batchCreateForm.alias,
      platform: batchCreateForm.platform,
      tags: batchCreateForm.tags,
      user_ids: batchCreateForm.user_ids,
      forceAlwaysRelay: batchCreateForm.forceAlwaysRelay,
      rdpPort: batchCreateForm.rdpPort,
      rdpUsername: batchCreateForm.rdpUsername,
    })
    message.success(t('adminAddressBook.batchCreateSuccess'))
    batchCreateModalVisible.value = false
    loadData()
  } catch {
    // ignore
  } finally {
    batchCreateSaving.value = false
  }
}

async function loadPeers(): Promise<void> {
  peerLoading.value = true
  try {
    const res = await listPeers({
      page: peerPagination.page,
      page_size: peerPagination.pageSize,
      id: peerSearchId.value || undefined,
      hostname: peerSearchHostname.value || undefined,
      alias: peerSearchAlias.value || undefined,
    })
    peerList.value = res.data.list || []
    peerPagination.itemCount = res.data.total || 0
  } catch {
    // ignore
  } finally {
    peerLoading.value = false
  }
}

function openPeerImport(): void {
  peerImportUserId.value = null
  peerSearchId.value = ''
  peerSearchHostname.value = ''
  peerSearchAlias.value = ''
  peerCheckedRowKeys.value = []
  peerImportTags.value = []
  peerPagination.page = 1
  peerModalVisible.value = true
  loadPeers()
}

function handlePeerCheck(keys: Array<string | number>): void {
  peerCheckedRowKeys.value = keys
}

function handlePeerSearch(): void {
  peerPagination.page = 1
  loadPeers()
}

function handlePeerReset(): void {
  peerSearchId.value = ''
  peerSearchHostname.value = ''
  peerSearchAlias.value = ''
  peerPagination.page = 1
  loadPeers()
}

function handlePeerPageChange(page: number): void {
  peerPagination.page = page
  loadPeers()
}

function handlePeerPageSizeChange(pageSize: number): void {
  peerPagination.pageSize = pageSize
  peerPagination.page = 1
  loadPeers()
}

async function handleImportFromPeers(): Promise<void> {
  if (peerImportUserId.value == null) {
    message.warning(t('adminAddressBook.userIdRequired'))
    return
  }
  if (peerCheckedRowKeys.value.length === 0) {
    message.warning(t('adminAddressBook.noPeerSelection'))
    return
  }
  peerImportSaving.value = true
  try {
    await batchCreateFromPeers({
      user_id: peerImportUserId.value,
      peer_ids: peerCheckedRowKeys.value as number[],
      tags: peerImportTags.value,
    })
    message.success(t('adminAddressBook.importFromPeersSuccess'))
    peerModalVisible.value = false
    loadData()
  } catch {
    // ignore
  } finally {
    peerImportSaving.value = false
  }
}

function openShare(row: AddressBook): void {
  shareForm.id = row.id
  shareForm.password_type = 'permanent'
  shareForm.password = ''
  shareForm.expire = 0
  shareModalVisible.value = true
}

async function handleShare(): Promise<void> {
  shareSaving.value = true
  try {
    const res = await shareByWebClient({
      id: shareForm.id,
      password_type: shareForm.password_type,
      password: shareForm.password,
      expire: shareForm.expire ?? undefined,
    })
    shareToken.value = res.data.share_token
    shareModalVisible.value = false
    shareTokenModalVisible.value = true
  } catch {
    // ignore
  } finally {
    shareSaving.value = false
  }
}

async function copyShareToken(): Promise<void> {
  if (!shareToken.value) return
  try {
    await navigator.clipboard.writeText(shareToken.value)
    message.success(t('adminAddressBook.shareTokenCopied'))
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadData()
  loadTags()
  loadUsers()
})
</script>

<template>
  <NCard :bordered="false">
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
      <NSpace wrap>
        <NButton type="primary" @click="openCreate">
          {{ $t('adminAddressBook.create') }}
        </NButton>
        <NButton @click="openBatchCreate">
          {{ $t('adminAddressBook.batchCreate') }}
        </NButton>
        <NButton @click="openPeerImport">
          {{ $t('adminAddressBook.batchCreateFromPeers') }}
        </NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('adminAddressBook.batchDelete') }}
        </NButton>
      </NSpace>
    </NSpace>

    <NSpace align="center" style="margin-bottom: 16px" wrap>
      <NSelect
        v-model:value="filterUserId"
        :options="userOptions"
        :placeholder="$t('adminAddressBook.userIdFilter')"
        clearable
        filterable
        style="width: 200px"
      />
      <NInput
        v-model:value="searchId"
        :placeholder="$t('adminAddressBook.searchId')"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchHostname"
        :placeholder="$t('adminAddressBook.searchHostname')"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchAlias"
        :placeholder="$t('adminAddressBook.searchAlias')"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <NButton type="primary" @click="handleSearch">
        {{ $t('common.search') }}
      </NButton>
      <NButton @click="handleReset">
        {{ $t('adminAddressBook.reset') }}
      </NButton>
    </NSpace>

    <NDataTable
      remote
      :scroll-x="1200"
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
  </NCard>

  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="modalTitle"
    style="width: 600px; max-width: 90vw"
  >
    <NForm
      ref="formRef"
      :model="form"
      :rules="formRules"
      :label-placement="isMobile ? 'top' : 'left'"
      :label-width="isMobile ? undefined : 140"
    >
      <NFormItem :label="$t('adminAddressBook.id')" path="id">
        <NInput v-model:value="form.id" :disabled="isEdit" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.userId')" path="user_id">
        <NSelect
          v-model:value="form.user_id"
          :options="userOptions"
          :placeholder="$t('adminAddressBook.userIdFilter')"
          clearable
          filterable
        />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.username')" path="username">
        <NInput v-model:value="form.username" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.password')" path="password">
        <NInput
          v-model:value="form.password"
          type="password"
          show-password-on="click"
        />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.hostname')" path="hostname">
        <NInput v-model:value="form.hostname" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.alias')" path="alias">
        <NInput v-model:value="form.alias" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.platform')" path="platform">
        <NInput v-model:value="form.platform" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.tags')" path="tags">
        <NSelect
          v-model:value="form.tags"
          multiple
          tag
          :options="tagOptions"
        />
      </NFormItem>
      <NFormItem
        :label="$t('adminAddressBook.forceAlwaysRelay')"
        path="forceAlwaysRelay"
      >
        <NSwitch v-model:value="form.forceAlwaysRelay" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.rdpPort')" path="rdpPort">
        <NInput v-model:value="form.rdpPort" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.rdpUsername')" path="rdpUsername">
        <NInput v-model:value="form.rdpUsername" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="modalVisible = false">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal
    v-model:show="batchCreateModalVisible"
    preset="card"
    :title="$t('adminAddressBook.batchCreate')"
    style="width: 600px; max-width: 90vw"
  >
    <NForm :label-placement="isMobile ? 'top' : 'left'" :label-width="isMobile ? undefined : 140">
      <NFormItem :label="$t('adminAddressBook.selectUsers')">
        <NSelect
          v-model:value="batchCreateForm.user_ids"
          :options="userOptions"
          multiple
          filterable
          :placeholder="$t('adminAddressBook.selectUsers')"
        />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.id')">
        <NInput v-model:value="batchCreateForm.id" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.hostname')">
        <NInput v-model:value="batchCreateForm.hostname" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.alias')">
        <NInput v-model:value="batchCreateForm.alias" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.username')">
        <NInput v-model:value="batchCreateForm.username" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.password')">
        <NInput
          v-model:value="batchCreateForm.password"
          type="password"
          show-password-on="click"
        />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.platform')">
        <NInput v-model:value="batchCreateForm.platform" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.tags')">
        <NSelect
          v-model:value="batchCreateForm.tags"
          multiple
          tag
          :options="tagOptions"
        />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.forceAlwaysRelay')">
        <NSwitch v-model:value="batchCreateForm.forceAlwaysRelay" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.rdpPort')">
        <NInput v-model:value="batchCreateForm.rdpPort" />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.rdpUsername')">
        <NInput v-model:value="batchCreateForm.rdpUsername" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="batchCreateModalVisible = false">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="batchCreateSaving"
          @click="handleBatchCreate"
        >
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal
    v-model:show="peerModalVisible"
    preset="card"
    :title="$t('adminAddressBook.batchCreateFromPeers')"
    style="width: 800px; max-width: 90vw"
  >
    <NForm :label-placement="isMobile ? 'top' : 'left'" :label-width="isMobile ? undefined : 100" style="margin-bottom: 16px">
      <NFormItem :label="$t('adminAddressBook.userId')" required>
        <NSelect
          v-model:value="peerImportUserId"
          :options="userOptions"
          :placeholder="$t('adminAddressBook.userIdFilter')"
          clearable
          filterable
        />
      </NFormItem>
    </NForm>
    <NSpace align="center" style="margin-bottom: 16px" wrap>
      <NInput
        v-model:value="peerSearchId"
        :placeholder="$t('adminPeer.searchId')"
        clearable
        style="width: 160px"
        @keyup.enter="handlePeerSearch"
      />
      <NInput
        v-model:value="peerSearchHostname"
        :placeholder="$t('adminPeer.searchHostname')"
        clearable
        style="width: 160px"
        @keyup.enter="handlePeerSearch"
      />
      <NInput
        v-model:value="peerSearchAlias"
        :placeholder="$t('adminPeer.searchAlias')"
        clearable
        style="width: 160px"
        @keyup.enter="handlePeerSearch"
      />
      <NButton type="primary" @click="handlePeerSearch">
        {{ $t('common.search') }}
      </NButton>
      <NButton @click="handlePeerReset">
        {{ $t('adminAddressBook.reset') }}
      </NButton>
    </NSpace>
    <NDataTable
      remote
      :columns="peerColumns"
      :data="peerList"
      :loading="peerLoading"
      :pagination="peerPagination"
      :row-key="peerRowKey"
      :checked-row-keys="peerCheckedRowKeys"
      @update:checked-row-keys="handlePeerCheck"
      @update:page="handlePeerPageChange"
      @update:page-size="handlePeerPageSizeChange"
    />
    <NForm label-placement="top" style="margin-top: 16px">
      <NFormItem :label="$t('adminAddressBook.tags')">
        <NSelect
          v-model:value="peerImportTags"
          multiple
          tag
          :options="tagOptions"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="peerModalVisible = false">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="peerImportSaving"
          @click="handleImportFromPeers"
        >
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal
    v-model:show="shareModalVisible"
    preset="card"
    :title="$t('adminAddressBook.shareByWebClient')"
    style="width: 480px; max-width: 90vw"
  >
    <NForm label-placement="top">
      <NFormItem :label="$t('adminAddressBook.id')">
        <NInput v-model:value="shareForm.id" disabled />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.passwordType')">
        <NSelect
          v-model:value="shareForm.password_type"
          :options="passwordTypeOptions"
          tag
        />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.password')">
        <NInput
          v-model:value="shareForm.password"
          type="password"
          show-password-on="click"
        />
      </NFormItem>
      <NFormItem :label="$t('adminAddressBook.expire')">
        <NInputNumber
          v-model:value="shareForm.expire"
          style="width: 100%"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="shareModalVisible = false">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton type="primary" :loading="shareSaving" @click="handleShare">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal
    v-model:show="shareTokenModalVisible"
    preset="card"
    :title="$t('adminAddressBook.shareToken')"
    style="width: 480px; max-width: 90vw"
  >
    <NSpace vertical>
      <NInput :value="shareToken" readonly />
      <NButton type="primary" block @click="copyShareToken">
        {{ $t('adminAddressBook.copyToken') }}
      </NButton>
    </NSpace>
  </NModal>
</template>
