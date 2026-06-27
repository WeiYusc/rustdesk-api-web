<script setup lang="ts">
defineOptions({ name: 'UserGroup' })
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
  NSelect,
  NSpace,
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
  type SelectOption,
} from 'naive-ui'
import { list, create, update, deleteGroup, type GroupForm } from '@/api/group'
import type { Group } from '@/types'
import { formatTime } from '@/utils/format'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const saving = ref(false)
const dataList = ref<Group[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const typeOptions = computed<SelectOption[]>(() => [
  { label: t('adminGroup.typeNormal'), value: 1 },
  { label: t('adminGroup.typeShared'), value: 2 },
])

function typeName(type: number): string {
  return type === 2 ? t('adminGroup.typeShared') : t('adminGroup.typeNormal')
}

const columns = computed<DataTableColumns<Group>>(() => [
  { title: t('adminGroup.name'), key: 'name', ellipsis: { tooltip: true } },
  {
    title: t('adminGroup.type'),
    key: 'type',
    render: (row) => typeName(row.type),
  },
  {
    title: t('adminGroup.createdAt'),
    key: 'created_at',
    render: (row) => formatTime(row.created_at),
  },
  {
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
  },
])

const formRef = ref<FormInst | null>(null)
const modalShow = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formModel = reactive<{ id: number | undefined; name: string; type: number }>({
  id: undefined,
  name: '',
  type: 1,
})

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('adminGroup.nameRequired'), trigger: ['blur', 'input'] },
  ],
}))

let latestRequestId = 0

async function loadData(): Promise<void> {
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const res = await list({ page: pagination.page, page_size: pagination.pageSize })
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

function resetForm(): void {
  formModel.id = undefined
  formModel.name = ''
  formModel.type = 1
}

function openCreate(): void {
  modalMode.value = 'create'
  resetForm()
  formRef.value?.restoreValidation()
  modalShow.value = true
}

function openEdit(row: Group): void {
  modalMode.value = 'edit'
  formModel.id = row.id
  formModel.name = row.name
  formModel.type = row.type
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
    const payload: GroupForm = { name: formModel.name, type: formModel.type }
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
    // ignore
  } finally {
    saving.value = false
  }
}

function handleDelete(row: Group): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminGroup.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteGroup({ id: row.id })
        message.success(t('common.success'))
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
    <template #header>{{ $t('adminGroup.title') }}</template>
    <template #header-extra>
      <NButton type="primary" @click="openCreate">{{ $t('adminGroup.create') }}</NButton>
    </template>
    <NDataTable
      remote
      :scroll-x="600"
      :bordered="false"
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
    <NModal
      v-model:show="modalShow"
      preset="card"
      :title="modalMode === 'edit' ? $t('adminGroup.edit') : $t('adminGroup.create')"
      style="width: 440px; max-width: 90vw"
    >
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="top">
        <NFormItem :label="$t('adminGroup.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('adminGroup.name')" />
        </NFormItem>
        <NFormItem :label="$t('adminGroup.type')" path="type">
          <NSelect
            v-model:value="formModel.type"
            :options="typeOptions"
            :placeholder="$t('adminGroup.type')"
          />
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
