<script setup lang="ts">
defineOptions({ name: 'MyAddressBookList' })
import { ref, reactive, computed, h, onMounted } from 'vue'
import {
  NCard,
  NDataTable,
  NButton,
  NSpace,
  NInput,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NSwitch,
  NTag,
  useMessage,
  useDialog,
  type DataTableColumns,
  type FormRules,
} from 'naive-ui'
import { useAppStore } from '@/stores/app'
import {
  list,
  create,
  update,
  deleteAddressBook,
  batchUpdateTags,
} from '@/api/my/addressBook'
import { list as listTags } from '@/api/my/tag'
import type { AddressBook } from '@/types'

interface AddressBookFormData {
  row_id?: number
  id: string
  username: string
  password: string
  hostname: string
  alias: string
  platform: string
  tags: string[]
  forceAlwaysRelay: boolean
  rdpPort: string
  rdpUsername: string
}

const appStore = useAppStore()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dataList = ref<AddressBook[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onUpdatePage: (p: number) => {
    pagination.page = p
    loadData()
  },
  onUpdatePageSize: (ps: number) => {
    pagination.pageSize = ps
    pagination.page = 1
    loadData()
  },
})

const searchId = ref('')
const searchHostname = ref('')
const searchAlias = ref('')

const checkedRowKeys = ref<Array<string | number>>([])

const tagOptions = ref<{ label: string; value: string }[]>([])

const modalVisible = ref(false)
const modalTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref()

const form = reactive<AddressBookFormData>({
  row_id: undefined,
  id: '',
  username: '',
  password: '',
  hostname: '',
  alias: '',
  platform: '',
  tags: [],
  forceAlwaysRelay: false,
  rdpPort: '',
  rdpUsername: '',
})

const batchTagModalVisible = ref(false)
const batchTags = ref<string[]>([])
const batchSaving = ref(false)

const formRules: FormRules = {
  id: {
    required: true,
    message: appStore.t('myAddressBook.required'),
    trigger: 'blur',
  },
}

const columns = computed<DataTableColumns<AddressBook>>(() => [
  { type: 'selection' },
  { title: appStore.t('myAddressBook.id'), key: 'id', width: 180 },
  { title: appStore.t('myAddressBook.alias'), key: 'alias' },
  { title: appStore.t('myAddressBook.hostname'), key: 'hostname' },
  { title: appStore.t('myAddressBook.username'), key: 'username' },
  {
    title: appStore.t('myAddressBook.tags'),
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
    title: appStore.t('myAddressBook.online'),
    key: 'online',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.online ? 'success' : 'default', size: 'small' },
        () =>
          row.online
            ? appStore.t('myAddressBook.onlineStatus')
            : appStore.t('myAddressBook.offlineStatus'),
      )
    },
  },
  {
    title: appStore.t('common.actions'),
    key: 'actions',
    width: 160,
    render(row) {
      return h(NSpace, null, () => [
        h(
          NButton,
          { size: 'small', onClick: () => openEdit(row) },
          () => appStore.t('common.edit'),
        ),
        h(
          NButton,
          { size: 'small', type: 'error', onClick: () => handleDelete(row) },
          () => appStore.t('common.delete'),
        ),
      ])
    },
  },
])

function rowKey(row: AddressBook): number {
  return row.row_id
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      is_my: 1,
      id: searchId.value || undefined,
      hostname: searchHostname.value || undefined,
      alias: searchAlias.value || undefined,
    })
    dataList.value = res.data.list || []
    pagination.itemCount = res.data.total || 0
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function loadTags(): Promise<void> {
  try {
    const res = await listTags({ is_my: 1, page: 1, page_size: 1000 })
    tagOptions.value = (res.data.list || []).map((t) => ({
      label: t.name,
      value: t.name,
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

function handleReset(): void {
  searchId.value = ''
  searchHostname.value = ''
  searchAlias.value = ''
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
  form.forceAlwaysRelay = false
  form.rdpPort = ''
  form.rdpUsername = ''
}

function openCreate(): void {
  isEdit.value = false
  modalTitle.value = appStore.t('myAddressBook.create')
  resetForm()
  modalVisible.value = true
}

function openEdit(row: AddressBook): void {
  isEdit.value = true
  modalTitle.value = appStore.t('myAddressBook.edit')
  form.row_id = row.row_id
  form.id = row.id
  form.username = row.username || ''
  form.password = row.password || ''
  form.hostname = row.hostname || ''
  form.alias = row.alias || ''
  form.platform = row.platform || ''
  form.tags = row.tags ? [...row.tags] : []
  form.forceAlwaysRelay = row.forceAlwaysRelay || false
  form.rdpPort = row.rdpPort || ''
  form.rdpUsername = row.rdpUsername || ''
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
    if (isEdit.value) {
      await update({ ...form })
      message.success(appStore.t('myAddressBook.updateSuccess'))
    } else {
      await create({ ...form })
      message.success(appStore.t('myAddressBook.createSuccess'))
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
    title: appStore.t('common.confirm'),
    content: appStore.t('myAddressBook.confirmDelete'),
    positiveText: appStore.t('common.delete'),
    negativeText: appStore.t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteAddressBook({ row_id: row.row_id })
        message.success(appStore.t('myAddressBook.deleteSuccess'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

function handleBatchDelete(): void {
  if (checkedRowKeys.value.length === 0) {
    message.warning(appStore.t('myAddressBook.noSelection'))
    return
  }
  dialog.warning({
    title: appStore.t('common.confirm'),
    content: appStore.t('myAddressBook.confirmBatchDelete'),
    positiveText: appStore.t('common.delete'),
    negativeText: appStore.t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await Promise.all(
          (checkedRowKeys.value as number[]).map((rid) =>
            deleteAddressBook({ row_id: rid }),
          ),
        )
        message.success(appStore.t('myAddressBook.deleteSuccess'))
        checkedRowKeys.value = []
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

function openBatchTags(): void {
  if (checkedRowKeys.value.length === 0) {
    message.warning(appStore.t('myAddressBook.noSelection'))
    return
  }
  batchTags.value = []
  batchTagModalVisible.value = true
}

async function handleBatchUpdateTags(): Promise<void> {
  batchSaving.value = true
  try {
    await batchUpdateTags({
      row_ids: checkedRowKeys.value as number[],
      tags: batchTags.value,
    })
    message.success(appStore.t('myAddressBook.batchUpdateSuccess'))
    batchTagModalVisible.value = false
    checkedRowKeys.value = []
    loadData()
  } catch {
    // ignore
  } finally {
    batchSaving.value = false
  }
}

onMounted(() => {
  loadData()
  loadTags()
})
</script>

<template>
  <NCard :bordered="false">
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
      <NSpace>
        <NButton type="primary" @click="openCreate">
          {{ $t('myAddressBook.create') }}
        </NButton>
        <NButton
          :disabled="checkedRowKeys.length === 0"
          @click="openBatchTags"
        >
          {{ $t('myAddressBook.batchUpdateTags') }}
        </NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('myAddressBook.batchDelete') }}
        </NButton>
      </NSpace>
    </NSpace>

    <NSpace align="center" style="margin-bottom: 16px">
      <NInput
        v-model:value="searchId"
        :placeholder="$t('myAddressBook.searchId')"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchHostname"
        :placeholder="$t('myAddressBook.searchHostname')"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <NInput
        v-model:value="searchAlias"
        :placeholder="$t('myAddressBook.searchAlias')"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <NButton type="primary" @click="handleSearch">{{ $t('common.search') }}</NButton>
      <NButton @click="handleReset">{{ $t('myAddressBook.reset') }}</NButton>
    </NSpace>

    <NDataTable
      remote
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      :row-key="rowKey"
      :checked-row-keys="checkedRowKeys"
      @update:checked-row-keys="handleCheck"
    />
  </NCard>

  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="modalTitle"
    style="width: 600px"
  >
    <NForm
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-placement="left"
      label-width="140"
    >
      <NFormItem :label="$t('myAddressBook.id')" path="id">
        <NInput v-model:value="form.id" :disabled="isEdit" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.username')" path="username">
        <NInput v-model:value="form.username" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.password')" path="password">
        <NInput v-model:value="form.password" type="password" show-password-on="click" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.hostname')" path="hostname">
        <NInput v-model:value="form.hostname" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.alias')" path="alias">
        <NInput v-model:value="form.alias" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.platform')" path="platform">
        <NInput v-model:value="form.platform" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.tags')" path="tags">
        <NSelect
          v-model:value="form.tags"
          multiple
          tag
          :options="tagOptions"
        />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.forceAlwaysRelay')" path="forceAlwaysRelay">
        <NSwitch v-model:value="form.forceAlwaysRelay" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.rdpPort')" path="rdpPort">
        <NInput v-model:value="form.rdpPort" />
      </NFormItem>
      <NFormItem :label="$t('myAddressBook.rdpUsername')" path="rdpUsername">
        <NInput v-model:value="form.rdpUsername" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="modalVisible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal
    v-model:show="batchTagModalVisible"
    preset="card"
    :title="$t('myAddressBook.batchUpdateTags')"
    style="width: 500px"
  >
    <NForm label-placement="top">
      <NFormItem :label="$t('myAddressBook.selectTags')">
        <NSelect v-model:value="batchTags" multiple tag :options="tagOptions" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="batchTagModalVisible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="batchSaving" @click="handleBatchUpdateTags">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
