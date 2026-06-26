<script setup lang="ts">
defineOptions({ name: 'AuditConn' })
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
import { connList, connDelete, connBatchDelete } from '@/api/audit'
import type { AuditConn } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dataList = ref<AuditConn[]>([])
const checkedRowKeys = ref<Array<string | number>>([])
const filterPeerId = ref('')
const filterFromPeer = ref('')

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

const columns = computed<DataTableColumns<AuditConn>>(() => [
  { type: 'selection' },
  { title: t('adminAuditConn.action'), key: 'action' },
  { title: t('adminAuditConn.connId'), key: 'conn_id' },
  { title: t('adminAuditConn.peerId'), key: 'peer_id' },
  { title: t('adminAuditConn.fromPeer'), key: 'from_peer' },
  { title: t('adminAuditConn.fromName'), key: 'from_name' },
  { title: t('adminAuditConn.ip'), key: 'ip' },
  {
    title: t('adminAuditConn.sessionId'),
    key: 'session_id',
    ellipsis: { tooltip: true },
  },
  { title: t('adminAuditConn.type'), key: 'type' },
  {
    title: t('adminAuditConn.createdAt'),
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

function rowKey(row: AuditConn): number {
  return row.id
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await connList({
      page: pagination.page,
      page_size: pagination.pageSize,
      peer_id: filterPeerId.value || undefined,
      from_peer: filterFromPeer.value || undefined,
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
  filterPeerId.value = ''
  filterFromPeer.value = ''
  pagination.page = 1
  loadData()
}

function handleDelete(row: AuditConn): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminAuditConn.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await connDelete({ id: row.id })
        message.success(t('adminAuditConn.deleteSuccess'))
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
    content: t('adminAuditConn.batchDeleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await connBatchDelete({ ids: checkedRowKeys.value as number[] })
        message.success(t('adminAuditConn.deleteSuccess'))
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
    <template #header>{{ $t('adminAuditConn.title') }}</template>
    <template #header-extra>
      <NSpace align="center">
        <NInput
          v-model:value="filterPeerId"
          :placeholder="$t('adminAuditConn.filterPeerId')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filterFromPeer"
          :placeholder="$t('adminAuditConn.filterFromPeer')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">{{
          $t('common.search')
        }}</NButton>
        <NButton @click="handleReset">{{ $t('adminAuditConn.reset') }}</NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('adminAuditConn.batchDelete') }}
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
