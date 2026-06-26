<script setup lang="ts">
defineOptions({ name: 'LoginLog' })
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
import { list, deleteLoginLog, batchDelete } from '@/api/loginLog'
import type { LoginLog } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dataList = ref<LoginLog[]>([])
const checkedRowKeys = ref<Array<string | number>>([])
const filterUserId = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

function formatTime(ts: number | string): string {
  if (!ts) return ''
  const num =
    typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(ts)
  if (!num) return ''
  return new Date(num).toLocaleString()
}

const columns = computed<DataTableColumns<LoginLog>>(() => [
  { type: 'selection' },
  { title: t('adminLoginLog.userId'), key: 'user_id' },
  { title: t('adminLoginLog.client'), key: 'client' },
  { title: t('adminLoginLog.deviceId'), key: 'device_id' },
  { title: t('adminLoginLog.uuid'), key: 'uuid', ellipsis: { tooltip: true } },
  { title: t('adminLoginLog.ip'), key: 'ip' },
  { title: t('adminLoginLog.type'), key: 'type' },
  { title: t('adminLoginLog.platform'), key: 'platform' },
  {
    title: t('adminLoginLog.createdAt'),
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

function rowKey(row: LoginLog): number {
  return row.id
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      user_id: filterUserId.value ? Number(filterUserId.value) : undefined,
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

function handleSearch(): void {
  pagination.page = 1
  loadData()
}

function handleReset(): void {
  filterUserId.value = ''
  pagination.page = 1
  loadData()
}

function handleDelete(row: LoginLog): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminLoginLog.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteLoginLog({ id: row.id })
        message.success(t('adminLoginLog.deleteSuccess'))
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
    content: t('adminLoginLog.batchDeleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await batchDelete({ ids: checkedRowKeys.value as number[] })
        message.success(t('adminLoginLog.deleteSuccess'))
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
    <template #header>{{ $t('adminLoginLog.title') }}</template>
    <template #header-extra>
      <NSpace align="center">
        <NInput
          v-model:value="filterUserId"
          :placeholder="$t('adminLoginLog.filterUserId')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">{{
          $t('common.search')
        }}</NButton>
        <NButton @click="handleReset">{{ $t('adminLoginLog.reset') }}</NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('adminLoginLog.batchDelete') }}
        </NButton>
      </NSpace>
    </template>
    <NDataTable
      v-model:checked-row-keys="checkedRowKeys"
      remote
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
