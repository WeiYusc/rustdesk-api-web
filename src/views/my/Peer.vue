<script setup lang="ts">
defineOptions({ name: 'MyPeer' })
import { NCard, NH2, NDataTable, NButton, NSpace, NInput } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { list } from '@/api/my/peer'
import { useAppStore } from '@/stores/app'
import type { Peer } from '@/types'
import { formatTimeOrDash } from '@/utils/format'
import { connectByClient } from '@/utils/peer'
import { h } from 'vue'

const appStore = useAppStore()

const loading = ref(false)
const data = ref<Peer[]>([])
const searchId = ref('')
const searchHostname = ref('')
const searchAlias = ref('')

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
      id: searchId.value || undefined,
      hostname: searchHostname.value || undefined,
      alias: searchAlias.value || undefined,
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

const columns = computed<DataTableColumns<Peer>>(() => [
  { title: appStore.t('myPeer.id'), key: 'id', ellipsis: { tooltip: true } },
  { title: appStore.t('myPeer.hostname'), key: 'hostname', ellipsis: { tooltip: true } },
  { title: appStore.t('myPeer.alias'), key: 'alias' },
  { title: appStore.t('myPeer.os'), key: 'os', ellipsis: { tooltip: true } },
  { title: appStore.t('myPeer.username'), key: 'username', ellipsis: { tooltip: true } },
  { title: appStore.t('myPeer.lastOnlineIp'), key: 'last_online_ip' },
  {
    title: appStore.t('myPeer.lastOnlineTime'),
    key: 'last_online_time',
    render: (row: Peer) => formatTimeOrDash(row.last_online_time),
  },
  {
    title: appStore.t('common.actions'),
    key: 'actions',
    width: 100,
    render: (row: Peer) =>
      h(
        NButton,
        { size: 'small', type: 'success', ghost: true, onClick: () => connectByClient(row.id) },
        { default: () => appStore.t('common.connect') },
      ),
  },
])

function rowKey(row: Peer): number {
  return row.row_id
}

function handleSearch(): void {
  pagination.page = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <NCard>
    <NH2>{{ $t('myPeer.title') }}</NH2>
    <NSpace vertical>
      <NSpace wrap>
        <NInput
          v-model:value="searchId"
          :placeholder="$t('myPeer.searchId')"
          clearable
        />
        <NInput
          v-model:value="searchHostname"
          :placeholder="$t('myPeer.searchHostname')"
          clearable
        />
        <NInput
          v-model:value="searchAlias"
          :placeholder="$t('myPeer.searchAlias')"
          clearable
        />
        <NButton type="primary" @click="handleSearch">
          {{ $t('common.search') }}
        </NButton>
      </NSpace>
      <NDataTable
        remote
        :scroll-x="1000"
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :row-key="rowKey"
      />
    </NSpace>
  </NCard>
</template>
