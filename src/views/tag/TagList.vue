<script setup lang="ts">
defineOptions({ name: 'UserTag' })
import { computed, h, onMounted, reactive, ref, type CSSProperties } from 'vue'
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
import { create, deleteTag, list, update, type TagForm } from '@/api/tag'
import { list as listUsers } from '@/api/user'
import type { Tag } from '@/types'
import { formatTime } from '@/utils/format'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const TAG_COLOR_HEX = [
  '#808080', '#dc143c', '#ff8c00', '#daa520', '#228b22', '#008b8b',
  '#1e90ff', '#8a2be2', '#ff1493', '#556b2f', '#483d8b', '#4682b4',
  '#9acd32', '#ff4500', '#bdb76b', '#708090',
]

const colorOptions: SelectOption[] = TAG_COLOR_HEX.map((_hex, idx) => ({
  label: `Color ${idx}`,
  value: idx,
}))

function swatchStyle(color: number): CSSProperties {
  return {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    backgroundColor: TAG_COLOR_HEX[color] || '#cccccc',
    border: '1px solid rgba(128,128,128,0.4)',
    verticalAlign: 'middle',
  }
}

const loading = ref(false)
const saving = ref(false)
const dataList = ref<Tag[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const filterUserId = ref<number | null>(null)
const userOptions = ref<{ label: string; value: number }[]>([])

async function loadUsers(): Promise<void> {
  try {
    const res = await listUsers({ page: 1, page_size: 1000 })
    userOptions.value = (res.data.list || []).map((u) => ({
      label: `${u.username} (${u.id})`,
      value: u.id,
    }))
  } catch {
    // ignore
  }
}

const columns = computed<DataTableColumns<Tag>>(() => [
  { title: t('adminTag.name'), key: 'name' },
  {
    title: t('adminTag.color'),
    key: 'color',
    render: (row) =>
      h(
        'span',
        { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
        [h('span', { style: swatchStyle(row.color) }), String(row.color)],
      ),
  },
  {
    title: t('adminTag.userId'),
    key: 'user_id',
    render: (row) => '#' + row.user_id,
  },
  {
    title: t('adminTag.createdAt'),
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
const formModel = reactive<{
  id: number | undefined
  name: string
  color: number
  user_id: number | null
}>({
  id: undefined,
  name: '',
  color: 0,
  user_id: null,
})
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('adminTag.nameRequired'), trigger: ['blur', 'input'] }],
  color: [{ required: true, type: 'number', message: t('adminTag.colorRequired'), trigger: 'change' }],
}))

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      user_id: filterUserId.value ?? undefined,
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
  filterUserId.value = null
  pagination.page = 1
  loadData()
}

function resetForm(): void {
  formModel.id = undefined
  formModel.name = ''
  formModel.color = 0
  formModel.user_id = null
}

function openCreate(): void {
  modalMode.value = 'create'
  resetForm()
  formRef.value?.restoreValidation()
  modalShow.value = true
}

function openEdit(row: Tag): void {
  modalMode.value = 'edit'
  formModel.id = row.id
  formModel.name = row.name
  formModel.color = row.color
  formModel.user_id = row.user_id || null
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
    const payload: TagForm = {
      name: formModel.name,
      color: formModel.color,
      user_id: formModel.user_id ?? undefined,
    }
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

function handleDelete(row: Tag): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminTag.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteTag({ id: row.id })
        message.success(t('common.success'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

onMounted(() => {
  loadData()
  loadUsers()
})
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminTag.title') }}</template>
    <template #header-extra>
      <NButton type="primary" @click="openCreate">
        {{ $t('adminTag.createTag') }}
      </NButton>
    </template>
    <NSpace align="center" style="margin-bottom: 16px">
      <NSelect
        v-model:value="filterUserId"
        :options="userOptions"
        :placeholder="$t('adminTag.userIdFilter')"
        clearable
        filterable
        style="width: 240px"
      />
      <NButton type="primary" @click="handleSearch">
        {{ $t('common.search') }}
      </NButton>
      <NButton @click="handleReset">
        {{ $t('adminTag.reset') }}
      </NButton>
    </NSpace>
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
      :title="modalMode === 'edit' ? $t('adminTag.editTag') : $t('adminTag.createTag')"
      style="width: 480px; max-width: 90vw"
    >
      <NForm
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="top"
      >
        <NFormItem :label="$t('adminTag.name')" path="name">
          <NInput v-model:value="formModel.name" :placeholder="$t('adminTag.name')" />
        </NFormItem>
        <NFormItem :label="$t('adminTag.color')" path="color">
          <NSpace align="center">
            <NSelect
              v-model:value="formModel.color"
              :options="colorOptions"
              style="width: 160px"
            />
            <span :style="swatchStyle(formModel.color)"></span>
          </NSpace>
        </NFormItem>
        <NFormItem :label="$t('adminTag.userId')" path="user_id">
          <NSelect
            v-model:value="formModel.user_id"
            :options="userOptions"
            :placeholder="$t('adminTag.userIdFilter')"
            clearable
            filterable
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalShow = false">
            {{ $t('common.cancel') }}
          </NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
