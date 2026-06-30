<script setup lang="ts">
defineOptions({ name: 'UserToken' })
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NSpace,
  useDialog,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { list, deleteUserToken, batchDelete } from '@/api/userToken'
import type { UserToken } from '@/types'
import { formatTime } from '@/utils/format'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dataList = ref<UserToken[]>([])
const checkedRowKeys = ref<Array<string | number>>([])
const filterUserId = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const columns = computed<DataTableColumns<UserToken>>(() => [
  { type: 'selection' },
  { title: t('adminUserToken.userId'), key: 'user_id', width: 80, render: (row) => '#' + row.user_id },
  { title: t('adminUserToken.deviceUuid'), key: 'device_uuid', ellipsis: { tooltip: true } },
  { title: t('adminUserToken.deviceId'), key: 'device_id', ellipsis: { tooltip: true } },
  {
    title: t('adminUserToken.token'),
    key: 'token',
    render: (row) => {
      const token = row.token
      if (!token) return '-'
      if (token.length <= 12) return '••••••'
      return `${token.slice(0, 6)}••••••••${token.slice(-4)}`
    },
  },
  {
    title: t('adminUserToken.expiredAt'),
    key: 'expired_at',
    render: (row) => formatTime(row.expired_at),
  },
  {
    title: t('adminUserToken.createdAt'),
    key: 'created_at',
    render: (row) => formatTime(row.created_at),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 120,
    render: (row) =>
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
  },
])

function rowKey(row: UserToken): number {
  return row.id
}

let latestRequestId = 0

async function loadData(): Promise<void> {
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      user_id: filterUserId.value ? Number(filterUserId.value) : undefined,
    })
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

function handleSearch(): void {
  pagination.page = 1
  loadData()
}

function handleDelete(row: UserToken): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminUserToken.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteUserToken({ id: row.id })
        message.success(t('adminUserToken.deleteSuccess'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

function handleBatchDelete(): void {
  if (checkedRowKeys.value.length === 0) return
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminUserToken.batchDeleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await batchDelete({ ids: checkedRowKeys.value as number[] })
        message.success(t('adminUserToken.deleteSuccess'))
        checkedRowKeys.value = []
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

onMounted(loadData)
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminUserToken.title') }}</template>
    <template #header-extra>
      <NSpace align="center" wrap>
        <NInput
          v-model:value="filterUserId"
          :placeholder="$t('adminUserToken.filterUserId')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">{{ $t('common.search') }}</NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('adminUserToken.batchDelete') }}
        </NButton>
      </NSpace>
    </template>
    <NDataTable
      v-model:checked-row-keys="checkedRowKeys"
      remote
      :scroll-x="1000"
      :bordered="false"
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      :row-key="rowKey"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </NCard>
</template>
