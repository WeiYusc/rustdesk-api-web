<script setup lang="ts">
defineOptions({ name: 'AuditFile' })
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
import { fileList, fileDelete, fileBatchDelete } from '@/api/audit'
import type { AuditFile } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dataList = ref<AuditFile[]>([])
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

const columns = computed<DataTableColumns<AuditFile>>(() => [
  { type: 'selection' },
  { title: t('adminAuditFile.fromPeer'), key: 'from_peer' },
  { title: t('adminAuditFile.fromName'), key: 'from_name' },
  { title: t('adminAuditFile.peerId'), key: 'peer_id' },
  { title: t('adminAuditFile.path'), key: 'path', ellipsis: { tooltip: true } },
  { title: t('adminAuditFile.info'), key: 'info', ellipsis: { tooltip: true } },
  {
    title: t('adminAuditFile.isFile'),
    key: 'is_file',
    render: (row) => (row.is_file ? t('adminAuditFile.yes') : t('adminAuditFile.no')),
  },
  { title: t('adminAuditFile.num'), key: 'num' },
  { title: t('adminAuditFile.ip'), key: 'ip' },
  { title: t('adminAuditFile.type'), key: 'type' },
  {
    title: t('adminAuditFile.createdAt'),
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

function rowKey(row: AuditFile): number {
  return row.id
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await fileList({
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

function handleDelete(row: AuditFile): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminAuditFile.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await fileDelete({ id: row.id })
        message.success(t('adminAuditFile.deleteSuccess'))
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
    content: t('adminAuditFile.batchDeleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await fileBatchDelete({ ids: checkedRowKeys.value as number[] })
        message.success(t('adminAuditFile.deleteSuccess'))
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
    <template #header>{{ $t('adminAuditFile.title') }}</template>
    <template #header-extra>
      <NSpace align="center">
        <NInput
          v-model:value="filterPeerId"
          :placeholder="$t('adminAuditFile.filterPeerId')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filterFromPeer"
          :placeholder="$t('adminAuditFile.filterFromPeer')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">{{
          $t('common.search')
        }}</NButton>
        <NButton @click="handleReset">{{ $t('adminAuditFile.reset') }}</NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('adminAuditFile.batchDelete') }}
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
