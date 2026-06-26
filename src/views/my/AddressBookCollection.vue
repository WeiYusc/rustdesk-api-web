<script setup lang="ts">
defineOptions({ name: 'MyAddressBookCollection' })
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpace,
  NTabPane,
  NTabs,
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  create,
  deleteCollection,
  list,
  listShared,
  update,
  type AddressBookCollectionForm,
} from '@/api/my/addressBookCollection'
import type { AddressBookCollection } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

type TabKey = 'my' | 'shared'
const activeTab = ref<TabKey>('my')

const loading = ref(false)
const saving = ref(false)
const dataList = ref<AddressBookCollection[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const columns = computed<DataTableColumns<AddressBookCollection>>(() => {
  const cols: DataTableColumns<AddressBookCollection> = [
    { title: t('myCollection.name'), key: 'name' },
    { title: t('myCollection.createdAt'), key: 'created_at' },
  ]
  if (activeTab.value === 'my') {
    cols.push({
      title: t('common.actions'),
      key: 'actions',
      width: 180,
      render: (row) =>
        h(
          NSpace,
          { size: 8 },
          {
            default: () => [
              h(
                NButton,
                { size: 'small', onClick: () => openEdit(row) },
                { default: () => t('common.edit') },
              ),
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
            ],
          },
        ),
    })
  }
  return cols
})

const formRef = ref<FormInst | null>(null)
const modalShow = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formModel = reactive<{ id: number | undefined; name: string }>({
  id: undefined,
  name: '',
})
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('myCollection.nameRequired'), trigger: ['blur', 'input'] }],
}))

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const params = { page: pagination.page, page_size: pagination.pageSize }
    const res =
      activeTab.value === 'shared' ? await listShared(params) : await list(params)
    dataList.value = res.data.list ?? []
    pagination.itemCount = res.data.total ?? 0
  } catch {
    // handled by global error handler
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

function handleTabChange(value: string | number): void {
  activeTab.value = value as TabKey
  pagination.page = 1
  loadData()
}

function resetForm(): void {
  formModel.id = undefined
  formModel.name = ''
}

function openCreate(): void {
  modalMode.value = 'create'
  resetForm()
  formRef.value?.restoreValidation()
  modalShow.value = true
}

function openEdit(row: AddressBookCollection): void {
  modalMode.value = 'edit'
  formModel.id = row.id
  formModel.name = row.name
  formRef.value?.restoreValidation()
  modalShow.value = true
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload: AddressBookCollectionForm = { name: formModel.name }
    if (modalMode.value === 'edit' && formModel.id != null) {
      payload.id = formModel.id
      await update(payload)
    } else {
      await create(payload)
    }
    message.success(t('common.success'))
    modalShow.value = false
    loadData()
  } catch {
    // handled by global error handler
  } finally {
    saving.value = false
  }
}

function handleDelete(row: AddressBookCollection): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('myCollection.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteCollection({ id: row.id })
        message.success(t('common.success'))
        loadData()
      } catch {
        // handled by global error handler
      }
    },
  })
}

onMounted(loadData)
</script>

<template>
  <NCard>
    <template #header>{{ $t('myCollection.title') }}</template>
    <template #header-extra>
      <NButton v-if="activeTab === 'my'" type="primary" @click="openCreate">
        {{ $t('myCollection.createCollection') }}
      </NButton>
    </template>
    <NTabs :value="activeTab" @update:value="handleTabChange">
      <NTabPane name="my" :tab="$t('myCollection.myCollections')">
        <NDataTable
          remote
          :bordered="false"
          :columns="columns"
          :data="dataList"
          :loading="loading"
          :pagination="pagination"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </NTabPane>
      <NTabPane name="shared" :tab="$t('myCollection.sharedCollections')">
        <NDataTable
          remote
          :bordered="false"
          :columns="columns"
          :data="dataList"
          :loading="loading"
          :pagination="pagination"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </NTabPane>
    </NTabs>
    <NModal
      v-model:show="modalShow"
      preset="card"
      :title="modalMode === 'edit' ? $t('myCollection.editCollection') : $t('myCollection.createCollection')"
      style="width: 480px"
    >
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="top">
        <NFormItem :label="$t('myCollection.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('myCollection.name')" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalShow = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
