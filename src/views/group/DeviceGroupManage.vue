<script setup lang="ts">
defineOptions({ name: 'DeviceGroup' })
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
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  list,
  create,
  update,
  deleteDeviceGroup,
  type DeviceGroupForm,
} from '@/api/deviceGroup'
import type { DeviceGroup } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const saving = ref(false)
const dataList = ref<DeviceGroup[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const columns = computed<DataTableColumns<DeviceGroup>>(() => [
  { title: t('adminDeviceGroup.name'), key: 'name' },
  { title: t('adminDeviceGroup.createdAt'), key: 'created_at' },
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
const formModel = reactive<{ id: number | undefined; name: string }>({
  id: undefined,
  name: '',
})

const rules = computed<FormRules>(() => ({
  name: [
    {
      required: true,
      message: t('adminDeviceGroup.nameRequired'),
      trigger: ['blur', 'input'],
    },
  ],
}))

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await list({ page: pagination.page, page_size: pagination.pageSize })
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

function openEdit(row: DeviceGroup): void {
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
    const payload: DeviceGroupForm = { name: formModel.name }
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

function handleDelete(row: DeviceGroup): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminDeviceGroup.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteDeviceGroup({ id: row.id })
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
    <template #header>{{ $t('adminDeviceGroup.title') }}</template>
    <template #header-extra>
      <NButton type="primary" @click="openCreate">
        {{ $t('adminDeviceGroup.create') }}
      </NButton>
    </template>
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
    <NModal
      v-model:show="modalShow"
      preset="card"
      :title="modalMode === 'edit' ? $t('adminDeviceGroup.edit') : $t('adminDeviceGroup.create')"
      style="width: 440px"
    >
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="top">
        <NFormItem :label="$t('adminDeviceGroup.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('adminDeviceGroup.name')" />
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
