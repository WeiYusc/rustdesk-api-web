<script setup lang="ts">
defineOptions({ name: 'MyLoginLog' })
import { NCard, NH2, NDataTable, NButton, NSpace } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { list, deleteLoginLog, batchDelete } from '@/api/my/loginLog'
import { useAppStore } from '@/stores/app'
import type { LoginLog } from '@/types'

const appStore = useAppStore()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const data = ref<LoginLog[]>([])
const checkedRowKeys = ref<Array<string | number>>([])

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    pagination.page = page
    fetchData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchData()
  },
})

async function fetchData(): Promise<void> {
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      is_my: 1,
    })
    data.value = res.data.list
    pagination.itemCount = res.data.total
  } finally {
    loading.value = false
  }
}

function formatTime(t: string): string {
  if (!t) return ''
  return new Date(t).toLocaleString()
}

const columns = computed<DataTableColumns<LoginLog>>(() => [
  { type: 'selection' },
  { title: appStore.t('myLoginLog.ip'), key: 'ip' },
  { title: appStore.t('myLoginLog.client'), key: 'client' },
  { title: appStore.t('myLoginLog.type'), key: 'type' },
  { title: appStore.t('myLoginLog.platform'), key: 'platform' },
  {
    title: appStore.t('myLoginLog.createdAt'),
    key: 'created_at',
    render: (row: LoginLog) => formatTime(row.created_at),
  },
  {
    title: appStore.t('common.actions'),
    key: 'actions',
    render: (row: LoginLog) =>
      h(
        NButton,
        {
          size: 'small',
          type: 'error',
          onClick: () => handleDelete(row),
        },
        { default: () => appStore.t('common.delete') },
      ),
  },
])

function rowKey(row: LoginLog): number {
  return row.id
}

function handleDelete(row: LoginLog): void {
  dialog.warning({
    title: appStore.t('common.confirm'),
    content: appStore.t('myLoginLog.deleteConfirm'),
    positiveText: appStore.t('common.confirm'),
    negativeText: appStore.t('common.cancel'),
    onPositiveClick: async () => {
      await deleteLoginLog({ id: row.id })
      message.success(appStore.t('myLoginLog.deleteSuccess'))
      fetchData()
    },
  })
}

function handleBatchDelete(): void {
  if (checkedRowKeys.value.length === 0) return
  dialog.warning({
    title: appStore.t('common.confirm'),
    content: appStore.t('myLoginLog.batchDeleteConfirm'),
    positiveText: appStore.t('common.confirm'),
    negativeText: appStore.t('common.cancel'),
    onPositiveClick: async () => {
      await batchDelete({ ids: checkedRowKeys.value as number[] })
      message.success(appStore.t('myLoginLog.deleteSuccess'))
      checkedRowKeys.value = []
      fetchData()
    },
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <NCard>
    <NH2>{{ $t('myLoginLog.title') }}</NH2>
    <NSpace vertical>
      <NSpace justify="end">
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('myLoginLog.batchDelete') }}
        </NButton>
      </NSpace>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        remote
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :row-key="rowKey"
      />
    </NSpace>
  </NCard>
</template>
