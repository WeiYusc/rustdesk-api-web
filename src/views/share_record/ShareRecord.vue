<script setup lang="ts">
defineOptions({ name: 'ShareRecord' })
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
import { list, deleteShareRecord, batchDelete } from '@/api/shareRecord'
import type { ShareRecord } from '@/types'
import { formatTime } from '@/utils/format'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const dataList = ref<ShareRecord[]>([])
const checkedRowKeys = ref<Array<string | number>>([])
const filterUserId = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

function formatExpire(expire: number): string {
  if (!expire) return t('adminShareRecord.neverExpires')
  const ms = expire < 1e12 ? expire * 1000 : expire
  return new Date(ms).toLocaleString()
}

const columns = computed<DataTableColumns<ShareRecord>>(() => [
  { type: 'selection' },
  { title: t('adminShareRecord.userId'), key: 'user_id' },
  { title: t('adminShareRecord.peerId'), key: 'peer_id' },
  {
    title: t('adminShareRecord.shareToken'),
    key: 'share_token',
    ellipsis: { tooltip: true },
  },
  {
    title: t('adminShareRecord.password'),
    key: 'password',
    render: () => '•••••',
  },
  {
    title: t('adminShareRecord.passwordType'),
    key: 'password_type',
    render: (row) => {
      const map: Record<string, string> = {
        permanent: t('adminShareRecord.typePermanent'),
        temporary: t('adminShareRecord.typeTemporary'),
      }
      return map[row.password_type] || String(row.password_type)
    },
  },
  {
    title: t('adminShareRecord.expire'),
    key: 'expire',
    render: (row) => formatExpire(row.expire),
  },
  {
    title: t('adminShareRecord.createdAt'),
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

function rowKey(row: ShareRecord): number {
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

function handleDelete(row: ShareRecord): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminShareRecord.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteShareRecord({ id: row.id })
        message.success(t('adminShareRecord.deleteSuccess'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

function handleBatchDelete(): void {
  if (checkedRowKeys.value.length === 0) {
    message.warning(t('common.pleaseSelect'))
    return
  }
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminShareRecord.batchDeleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await batchDelete({ ids: checkedRowKeys.value as number[] })
        message.success(t('adminShareRecord.deleteSuccess'))
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
    <template #header>{{ $t('adminShareRecord.title') }}</template>
    <template #header-extra>
      <NSpace align="center" wrap>
        <NInput
          v-model:value="filterUserId"
          :placeholder="$t('adminShareRecord.filterUserId')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">{{
          $t('common.search')
        }}</NButton>
        <NButton @click="handleReset">{{ $t('adminShareRecord.reset') }}</NButton>
        <NButton
          type="error"
          :disabled="checkedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          {{ $t('adminShareRecord.batchDelete') }}
        </NButton>
      </NSpace>
    </template>
    <NDataTable
      v-model:checked-row-keys="checkedRowKeys"
      remote
      :scroll-x="1100"
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
