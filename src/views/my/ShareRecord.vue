<script setup lang="ts">
defineOptions({ name: 'MyShareRecordList' })
import { NCard, NH2, NDataTable, NButton, NSpace } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { list, deleteShareRecord, batchDelete } from '@/api/my/shareRecord'
import { useAppStore } from '@/stores/app'
import type { ShareRecord } from '@/types'
import { formatTime } from '@/utils/format'

const appStore = useAppStore()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const data = ref<ShareRecord[]>([])
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

let latestRequestId = 0

async function fetchData(): Promise<void> {
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
    })
    if (requestId !== latestRequestId) return
    data.value = res.data.list ?? []
    pagination.itemCount = res.data.total ?? 0
  } catch {
    if (requestId !== latestRequestId) return
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

function formatExpire(expire: number): string {
  if (!expire) return appStore.t('myShareRecord.neverExpires')
  const ms = expire < 1e12 ? expire * 1000 : expire
  return new Date(ms).toLocaleString()
}

const columns = computed<DataTableColumns<ShareRecord>>(() => [
  { type: 'selection' },
  { title: appStore.t('myShareRecord.peerId'), key: 'peer_id' },
  { title: appStore.t('myShareRecord.shareToken'), key: 'share_token' },
  {
    title: appStore.t('myShareRecord.password'),
    key: 'password',
    render: () => '•••••',
  },
  {
    title: appStore.t('myShareRecord.expire'),
    key: 'expire',
    render: (row: ShareRecord) => formatExpire(row.expire),
  },
  {
    title: appStore.t('myShareRecord.createdAt'),
    key: 'created_at',
    render: (row: ShareRecord) => formatTime(row.created_at),
  },
  {
    title: appStore.t('common.actions'),
    key: 'actions',
    render: (row: ShareRecord) =>
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

function rowKey(row: ShareRecord): number {
  return row.id
}

function handleDelete(row: ShareRecord): void {
  dialog.warning({
    title: appStore.t('common.confirm'),
    content: appStore.t('myShareRecord.deleteConfirm'),
    positiveText: appStore.t('common.delete'),
    negativeText: appStore.t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteShareRecord({ id: row.id })
        message.success(appStore.t('myShareRecord.deleteSuccess'))
        const currentPage = pagination.page ?? 1
        if (data.value.length === 1 && currentPage > 1) {
          pagination.page = currentPage - 1
        }
        fetchData()
      } catch {
        // ignore
      }
    },
  })
}

function handleBatchDelete(): void {
  if (checkedRowKeys.value.length === 0) {
    message.warning(appStore.t('common.pleaseSelect'))
    return
  }
  dialog.warning({
    title: appStore.t('common.confirm'),
    content: appStore.t('myShareRecord.batchDeleteConfirm'),
    positiveText: appStore.t('common.delete'),
    negativeText: appStore.t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await batchDelete({ ids: checkedRowKeys.value as number[] })
        message.success(appStore.t('myShareRecord.deleteSuccess'))
        checkedRowKeys.value = []
        fetchData()
      } catch {
        // ignore
      }
    },
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <NCard>
    <NH2>{{ $t('myShareRecord.title') }}</NH2>
    <NSpace vertical>
      <NSpace justify="end">
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('myShareRecord.batchDelete') }}
        </NButton>
      </NSpace>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        remote
        :scroll-x="900"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :row-key="rowKey"
      />
    </NSpace>
  </NCard>
</template>
