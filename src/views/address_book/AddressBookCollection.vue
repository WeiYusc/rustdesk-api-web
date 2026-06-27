<script setup lang="ts">
defineOptions({ name: 'UserAddressBookName' })
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
  detail,
  list,
  update,
  type AddressBookCollectionForm,
} from '@/api/addressBookCollection'
import {
  create as createRule,
  deleteRule,
  list as listRules,
  update as updateRule,
  type AddressBookCollectionRuleForm,
} from '@/api/addressBookCollectionRule'
import { list as listUsers } from '@/api/user'
import type { AddressBookCollection, AddressBookCollectionRule } from '@/types'
import { formatTime } from '@/utils/format'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

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

const columns = computed<DataTableColumns<AddressBookCollection>>(() => [
  { title: t('adminAddressBookCollection.name'), key: 'name' },
  {
    title: t('adminAddressBookCollection.userId'),
    key: 'user_id',
    render: (row) => '#' + row.user_id,
  },
  {
    title: t('adminAddressBookCollection.createdAt'),
    key: 'created_at',
    render: (row) => formatTime(row.created_at),
  },
  {
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
              { default: () => t('adminAddressBookCollection.rules') },
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
  },
])

const formRef = ref<FormInst | null>(null)
const modalShow = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formModel = reactive<{
  id: number | undefined
  name: string
  user_id: number | null
}>({
  id: undefined,
  name: '',
  user_id: null,
})
const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('adminAddressBookCollection.nameRequired'), trigger: ['blur', 'input'] },
  ],
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
    { required: true, message: t('adminAddressBookCollection.ruleTypeRequired'), trigger: ['change', 'blur'] },
  ],
  rule: [
    { required: true, message: t('adminAddressBookCollection.permissionRequired'), trigger: ['change', 'blur'] },
  ],
  to_id: [
    {
      required: true,
      type: 'number',
      message: t('adminAddressBookCollection.targetIdRequired'),
      trigger: ['blur', 'input'],
    },
  ],
}))

const ruleTypeOptions = computed(() => [
  { label: t('adminAddressBookCollection.ruleTypePersonal'), value: 1 },
  { label: t('adminAddressBookCollection.ruleTypeGroup'), value: 2 },
])
const rulePermOptions = computed(() => [
  { label: t('adminAddressBookCollection.rulePermRead'), value: 1 },
  { label: t('adminAddressBookCollection.rulePermReadWrite'), value: 2 },
  { label: t('adminAddressBookCollection.rulePermFullControl'), value: 3 },
])

const ruleColumns = computed<DataTableColumns<AddressBookCollectionRule>>(() => [
  {
    title: t('adminAddressBookCollection.ruleType'),
    key: 'type',
    render: (row) =>
      row.type === 1
        ? t('adminAddressBookCollection.ruleTypePersonal')
        : t('adminAddressBookCollection.ruleTypeGroup'),
  },
  {
    title: t('adminAddressBookCollection.permission'),
    key: 'rule',
    render: (row) => {
      const map: Record<number, string> = {
        1: t('adminAddressBookCollection.rulePermRead'),
        2: t('adminAddressBookCollection.rulePermReadWrite'),
        3: t('adminAddressBookCollection.rulePermFullControl'),
      }
      return h(NTag, { size: 'small' }, () => map[row.rule] || String(row.rule))
    },
  },
  { title: t('adminAddressBookCollection.targetId'), key: 'to_id' },
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
  formModel.user_id = null
}

function openCreate(): void {
  modalMode.value = 'create'
  resetForm()
  formRef.value?.restoreValidation()
  modalShow.value = true
}

async function openEdit(row: AddressBookCollection): Promise<void> {
  try {
    const res = await detail(row.id)
    const data = res.data
    modalMode.value = 'edit'
    formModel.id = data.id
    formModel.name = data.name
    formModel.user_id = data.user_id || null
    formRef.value?.restoreValidation()
    modalShow.value = true
  } catch {
    // ignore
  }
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload: AddressBookCollectionForm = {
      name: formModel.name,
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

function handleDelete(row: AddressBookCollection): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminAddressBookCollection.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteCollection({ id: row.id })
        message.success(t('common.success'))
        loadData()
      } catch {
        // ignore
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
    // ignore
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
      message.success(t('adminAddressBookCollection.ruleUpdateSuccess'))
    } else {
      await createRule(payload)
      message.success(t('adminAddressBookCollection.ruleCreateSuccess'))
    }
    ruleFormModalShow.value = false
    loadRules()
  } catch {
    // ignore
  } finally {
    ruleSaving.value = false
  }
}

function handleDeleteRule(row: AddressBookCollectionRule): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminAddressBookCollection.confirmDeleteRule'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteRule({ id: row.id })
        message.success(t('adminAddressBookCollection.ruleDeleteSuccess'))
        loadRules()
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
    <template #header>{{ $t('adminAddressBookCollection.title') }}</template>
    <template #header-extra>
      <NButton type="primary" @click="openCreate">
        {{ $t('adminAddressBookCollection.createCollection') }}
      </NButton>
    </template>
    <NSpace align="center" style="margin-bottom: 16px">
      <NSelect
        v-model:value="filterUserId"
        :options="userOptions"
        :placeholder="$t('adminAddressBookCollection.userIdFilter')"
        clearable
        filterable
        style="width: 240px"
      />
      <NButton type="primary" @click="handleSearch">
        {{ $t('common.search') }}
      </NButton>
      <NButton @click="handleReset">
        {{ $t('adminAddressBookCollection.reset') }}
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
      :title="modalMode === 'edit' ? $t('adminAddressBookCollection.editCollection') : $t('adminAddressBookCollection.createCollection')"
      style="width: 480px; max-width: 90vw"
    >
      <NForm
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="top"
      >
        <NFormItem :label="$t('adminAddressBookCollection.name')" path="name">
          <NInput
            v-model:value="formModel.name"
            :placeholder="$t('adminAddressBookCollection.name')"
          />
        </NFormItem>
        <NFormItem
          :label="$t('adminAddressBookCollection.userId')"
          path="user_id"
        >
          <NSelect
            v-model:value="formModel.user_id"
            :options="userOptions"
            :placeholder="$t('adminAddressBookCollection.userIdFilter')"
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

    <NModal
      v-model:show="ruleModalShow"
      preset="card"
      :title="$t('adminAddressBookCollection.ruleManagement')"
      style="width: 720px; max-width: 90vw"
    >
      <NSpace justify="space-between" align="center" style="margin-bottom: 16px">
        <span>{{ currentCollection?.name }}</span>
        <NButton type="primary" @click="openCreateRule">
          {{ $t('adminAddressBookCollection.createRule') }}
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
      :title="ruleFormMode === 'edit' ? $t('adminAddressBookCollection.editRule') : $t('adminAddressBookCollection.createRule')"
      style="width: 480px; max-width: 90vw"
    >
      <NForm
        ref="ruleFormRef"
        :model="ruleFormModel"
        :rules="ruleFormRules"
        label-placement="top"
      >
        <NFormItem
          :label="$t('adminAddressBookCollection.ruleType')"
          path="type"
        >
          <NSelect v-model:value="ruleFormModel.type" :options="ruleTypeOptions" />
        </NFormItem>
        <NFormItem
          :label="$t('adminAddressBookCollection.permission')"
          path="rule"
        >
          <NSelect v-model:value="ruleFormModel.rule" :options="rulePermOptions" />
        </NFormItem>
        <NFormItem
          :label="$t('adminAddressBookCollection.targetId')"
          path="to_id"
        >
          <NInputNumber
            v-model:value="ruleFormModel.to_id"
            :placeholder="$t('adminAddressBookCollection.targetIdHint')"
            style="width: 100%"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="ruleFormModalShow = false">
            {{ $t('common.cancel') }}
          </NButton>
          <NButton type="primary" :loading="ruleSaving" @click="handleRuleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
