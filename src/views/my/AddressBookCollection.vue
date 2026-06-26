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
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
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
import {
  create as createRule,
  deleteRule,
  list as listRules,
  update as updateRule,
  type AddressBookCollectionRuleForm,
} from '@/api/my/addressBookCollectionRule'
import type { AddressBookCollection, AddressBookCollectionRule } from '@/types'

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
      width: 240,
      render: (row) =>
        h(
          NSpace,
          { size: 8 },
          {
            default: () => [
              h(
                NButton,
                { size: 'small', onClick: () => openRules(row) },
                { default: () => t('myCollection.rules') },
              ),
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

const ruleModalShow = ref(false)
const ruleLoading = ref(false)
const ruleList = ref<AddressBookCollectionRule[]>([])
const currentCollection = ref<AddressBookCollection | null>(null)
const rulePagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const ruleFormModalShow = ref(false)
const ruleFormMode = ref<'create' | 'edit'>('create')
const ruleFormRef = ref<FormInst | null>(null)
const ruleSaving = ref(false)
const ruleFormModel = reactive<{
  id: number | undefined
  collection_id: number | undefined
  type: number | null
  rule: number | null
  to_id: number | null
}>({
  id: undefined,
  collection_id: undefined,
  type: null,
  rule: null,
  to_id: null,
})
const ruleFormRules = computed<FormRules>(() => ({
  type: [
    { required: true, message: t('myCollection.ruleTypeRequired'), trigger: ['change', 'blur'] },
  ],
  rule: [
    { required: true, message: t('myCollection.permissionRequired'), trigger: ['change', 'blur'] },
  ],
  to_id: [
    {
      required: true,
      type: 'number',
      message: t('myCollection.targetIdRequired'),
      trigger: ['blur', 'input'],
    },
  ],
}))

const ruleTypeOptions = computed(() => [
  { label: t('myCollection.ruleTypePersonal'), value: 1 },
  { label: t('myCollection.ruleTypeGroup'), value: 2 },
])
const rulePermOptions = computed(() => [
  { label: t('myCollection.rulePermRead'), value: 1 },
  { label: t('myCollection.rulePermReadWrite'), value: 2 },
  { label: t('myCollection.rulePermFullControl'), value: 3 },
])

const ruleColumns = computed<DataTableColumns<AddressBookCollectionRule>>(() => [
  {
    title: t('myCollection.ruleType'),
    key: 'type',
    render: (row) =>
      row.type === 1 ? t('myCollection.ruleTypePersonal') : t('myCollection.ruleTypeGroup'),
  },
  {
    title: t('myCollection.permission'),
    key: 'rule',
    render: (row) => {
      const map: Record<number, string> = {
        1: t('myCollection.rulePermRead'),
        2: t('myCollection.rulePermReadWrite'),
        3: t('myCollection.rulePermFullControl'),
      }
      return h(NTag, { size: 'small' }, () => map[row.rule] || String(row.rule))
    },
  },
  { title: t('myCollection.targetId'), key: 'to_id' },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 160,
    render: (row) =>
      h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NButton,
              { size: 'small', onClick: () => openEditRule(row) },
              { default: () => t('common.edit') },
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                ghost: true,
                onClick: () => handleDeleteRule(row),
              },
              { default: () => t('common.delete') },
            ),
          ],
        },
      ),
  },
])

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

function openRules(row: AddressBookCollection): void {
  currentCollection.value = row
  rulePagination.page = 1
  ruleModalShow.value = true
  loadRules()
}

async function loadRules(): Promise<void> {
  if (!currentCollection.value) return
  ruleLoading.value = true
  try {
    const res = await listRules({
      collection_id: currentCollection.value.id,
      page: rulePagination.page,
      page_size: rulePagination.pageSize,
    })
    ruleList.value = res.data.list ?? []
    rulePagination.itemCount = res.data.total ?? 0
  } catch {
    // handled by global error handler
  } finally {
    ruleLoading.value = false
  }
}

function handleRulePageChange(page: number): void {
  rulePagination.page = page
  loadRules()
}

function handleRulePageSizeChange(pageSize: number): void {
  rulePagination.pageSize = pageSize
  rulePagination.page = 1
  loadRules()
}

function resetRuleForm(): void {
  ruleFormModel.id = undefined
  ruleFormModel.collection_id = currentCollection.value?.id
  ruleFormModel.type = null
  ruleFormModel.rule = null
  ruleFormModel.to_id = null
}

function openCreateRule(): void {
  ruleFormMode.value = 'create'
  resetRuleForm()
  ruleFormRef.value?.restoreValidation()
  ruleFormModalShow.value = true
}

function openEditRule(row: AddressBookCollectionRule): void {
  ruleFormMode.value = 'edit'
  ruleFormModel.id = row.id
  ruleFormModel.collection_id = row.collection_id
  ruleFormModel.type = row.type
  ruleFormModel.rule = row.rule
  ruleFormModel.to_id = row.to_id
  ruleFormRef.value?.restoreValidation()
  ruleFormModalShow.value = true
}

async function handleRuleSubmit(): Promise<void> {
  try {
    await ruleFormRef.value?.validate()
  } catch {
    return
  }
  if (
    ruleFormModel.type == null ||
    ruleFormModel.rule == null ||
    ruleFormModel.to_id == null ||
    ruleFormModel.collection_id == null
  ) {
    return
  }
  const collectionId = ruleFormModel.collection_id
  const ruleTypeVal = ruleFormModel.type
  const ruleVal = ruleFormModel.rule
  const toIdVal = ruleFormModel.to_id
  ruleSaving.value = true
  try {
    const payload: AddressBookCollectionRuleForm = {
      collection_id: collectionId,
      rule: ruleVal,
      type: ruleTypeVal,
      to_id: toIdVal,
    }
    if (ruleFormMode.value === 'edit' && ruleFormModel.id != null) {
      payload.id = ruleFormModel.id
      await updateRule(payload)
      message.success(t('myCollection.ruleUpdateSuccess'))
    } else {
      await createRule(payload)
      message.success(t('myCollection.ruleCreateSuccess'))
    }
    ruleFormModalShow.value = false
    loadRules()
  } catch {
    // handled by global error handler
  } finally {
    ruleSaving.value = false
  }
}

function handleDeleteRule(row: AddressBookCollectionRule): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('myCollection.confirmDeleteRule'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteRule({ id: row.id })
        message.success(t('myCollection.ruleDeleteSuccess'))
        loadRules()
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

    <NModal
      v-model:show="ruleModalShow"
      preset="card"
      :title="$t('myCollection.ruleManagement')"
      style="width: 720px"
    >
      <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
        <span>{{ currentCollection?.name }}</span>
        <NButton type="primary" @click="openCreateRule">
          {{ $t('myCollection.createRule') }}
        </NButton>
      </NSpace>
      <NDataTable
        remote
        :bordered="false"
        :columns="ruleColumns"
        :data="ruleList"
        :loading="ruleLoading"
        :pagination="rulePagination"
        @update:page="handleRulePageChange"
        @update:page-size="handleRulePageSizeChange"
      />
    </NModal>

    <NModal
      v-model:show="ruleFormModalShow"
      preset="card"
      :title="ruleFormMode === 'edit' ? $t('myCollection.editRule') : $t('myCollection.createRule')"
      style="width: 480px"
    >
      <NForm
        ref="ruleFormRef"
        :model="ruleFormModel"
        :rules="ruleFormRules"
        label-placement="top"
      >
        <NFormItem :label="$t('myCollection.ruleType')" path="type">
          <NSelect v-model:value="ruleFormModel.type" :options="ruleTypeOptions" />
        </NFormItem>
        <NFormItem :label="$t('myCollection.permission')" path="rule">
          <NSelect v-model:value="ruleFormModel.rule" :options="rulePermOptions" />
        </NFormItem>
        <NFormItem :label="$t('myCollection.targetId')" path="to_id">
          <NInputNumber
            v-model:value="ruleFormModel.to_id"
            :placeholder="$t('myCollection.targetIdHint')"
            style="width: 100%"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="ruleFormModalShow = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="ruleSaving" @click="handleRuleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
