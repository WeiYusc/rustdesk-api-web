<script setup lang="ts">
defineOptions({ name: 'UserList' })
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
  NSwitch,
  NTag,
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
  type SelectOption,
} from 'naive-ui'
import { list, createUser, updateUser, deleteUser, changePwd, type UserForm } from '@/api/user'
import { list as listGroups } from '@/api/group'
import type { AdminUser, Group } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const saving = ref(false)
const pwdSaving = ref(false)
const dataList = ref<AdminUser[]>([])
const groupList = ref<Group[]>([])
const searchUsername = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const groupOptions = computed<SelectOption[]>(() =>
  groupList.value.map((g) => ({ label: g.name, value: g.id })),
)

const statusOptions = computed<SelectOption[]>(() => [
  { label: t('adminUser.statusActive'), value: 1 },
  { label: t('adminUser.statusDisabled'), value: 0 },
])

function groupName(id: number): string {
  return groupList.value.find((g) => g.id === id)?.name ?? String(id)
}

const columns = computed<DataTableColumns<AdminUser>>(() => [
  { title: t('adminUser.username'), key: 'username' },
  { title: t('adminUser.email'), key: 'email' },
  { title: t('adminUser.nickname'), key: 'nickname' },
  {
    title: t('adminUser.groupId'),
    key: 'group_id',
    render: (row) => groupName(row.group_id),
  },
  {
    title: t('adminUser.isAdmin'),
    key: 'is_admin',
    render: (row) =>
      h(
        NTag,
        { type: row.is_admin ? 'success' : 'default', bordered: false, size: 'small' },
        { default: () => (row.is_admin ? t('adminUser.yes') : t('adminUser.no')) },
      ),
  },
  {
    title: t('adminUser.status'),
    key: 'status',
    render: (row) =>
      h(
        NTag,
        {
          type: row.status === 1 ? 'success' : 'error',
          bordered: false,
          size: 'small',
        },
        {
          default: () =>
            row.status === 1 ? t('adminUser.statusActive') : t('adminUser.statusDisabled'),
        },
      ),
  },
  { title: t('adminUser.createdAt'), key: 'created_at' },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 260,
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
                type: 'warning',
                ghost: true,
                onClick: () => openChangePwd(row),
              },
              { default: () => t('adminUser.changePwd') },
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
  username: string
  email: string
  nickname: string
  group_id: number
  is_admin: boolean
  status: number
  remark: string
}>({
  id: undefined,
  username: '',
  email: '',
  nickname: '',
  group_id: 0,
  is_admin: false,
  status: 1,
  remark: '',
})

const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: t('adminUser.username'), trigger: ['blur', 'input'] },
  ],
  group_id: [
    { required: true, type: 'number', message: t('adminUser.groupId'), trigger: 'change' },
  ],
}))

const pwdModalShow = ref(false)
const pwdFormRef = ref<FormInst | null>(null)
const pwdForm = reactive<{ id: number | undefined; password: string; confirm: string }>({
  id: undefined,
  password: '',
  confirm: '',
})
const pwdRules = computed<FormRules>(() => ({
  password: [
    { required: true, message: t('adminUser.passwordRequired'), trigger: ['blur', 'input'] },
  ],
  confirm: [
    { required: true, message: t('adminUser.passwordRequired'), trigger: ['blur', 'input'] },
    {
      validator: (_rule, value: string) => {
        if (value !== pwdForm.password) return new Error(t('adminUser.passwordMismatch'))
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
}))

async function loadGroups(): Promise<void> {
  try {
    const res = await listGroups({ page: 1, page_size: 1000 })
    groupList.value = res.data.list ?? []
  } catch {
    // ignore
  }
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await list({
      page: pagination.page,
      page_size: pagination.pageSize,
      username: searchUsername.value || undefined,
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

function resetForm(): void {
  formModel.id = undefined
  formModel.username = ''
  formModel.email = ''
  formModel.nickname = ''
  formModel.group_id = 0
  formModel.is_admin = false
  formModel.status = 1
  formModel.remark = ''
}

function openCreate(): void {
  modalMode.value = 'create'
  resetForm()
  formRef.value?.restoreValidation()
  modalShow.value = true
}

function openEdit(row: AdminUser): void {
  modalMode.value = 'edit'
  formModel.id = row.id
  formModel.username = row.username
  formModel.email = row.email
  formModel.nickname = row.nickname
  formModel.group_id = row.group_id
  formModel.is_admin = !!row.is_admin
  formModel.status = row.status
  formModel.remark = row.remark
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
    const payload: UserForm = {
      username: formModel.username,
      email: formModel.email,
      nickname: formModel.nickname,
      group_id: formModel.group_id,
      is_admin: formModel.is_admin,
      status: formModel.status,
      remark: formModel.remark,
    }
    if (modalMode.value === 'edit' && formModel.id != null) {
      payload.id = formModel.id
      await updateUser(payload)
    } else {
      await createUser(payload)
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

function openChangePwd(row: AdminUser): void {
  pwdForm.id = row.id
  pwdForm.password = ''
  pwdForm.confirm = ''
  pwdFormRef.value?.restoreValidation()
  pwdModalShow.value = true
}

async function handleChangePwd(): Promise<void> {
  try {
    await pwdFormRef.value?.validate()
  } catch {
    return
  }
  pwdSaving.value = true
  try {
    if (pwdForm.id != null) {
      await changePwd({ id: pwdForm.id, password: pwdForm.password })
    }
    message.success(t('common.success'))
    pwdModalShow.value = false
  } catch {
    // ignore
  } finally {
    pwdSaving.value = false
  }
}

function handleDelete(row: AdminUser): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminUser.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteUser({ id: row.id })
        message.success(t('common.success'))
        loadData()
      } catch {
        // ignore
      }
    },
  })
}

onMounted(() => {
  loadGroups()
  loadData()
})
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminUser.title') }}</template>
    <template #header-extra>
      <NSpace align="center">
        <NInput
          v-model:value="searchUsername"
          :placeholder="$t('adminUser.searchUsername')"
          clearable
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">{{ $t('common.search') }}</NButton>
        <NButton type="primary" @click="openCreate">{{ $t('adminUser.createUser') }}</NButton>
      </NSpace>
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
      :title="modalMode === 'edit' ? $t('adminUser.editUser') : $t('adminUser.createUser')"
      style="width: 520px"
    >
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="top">
        <NFormItem :label="$t('adminUser.username')" path="username">
          <NInput v-model:value="formModel.username" :placeholder="$t('adminUser.username')" />
        </NFormItem>
        <NFormItem :label="$t('adminUser.email')" path="email">
          <NInput v-model:value="formModel.email" :placeholder="$t('adminUser.email')" />
        </NFormItem>
        <NFormItem :label="$t('adminUser.nickname')" path="nickname">
          <NInput v-model:value="formModel.nickname" :placeholder="$t('adminUser.nickname')" />
        </NFormItem>
        <NFormItem :label="$t('adminUser.groupId')" path="group_id">
          <NSelect
            v-model:value="formModel.group_id"
            :options="groupOptions"
            :placeholder="$t('adminUser.groupId')"
          />
        </NFormItem>
        <NFormItem :label="$t('adminUser.isAdmin')" path="is_admin">
          <NSwitch v-model:value="formModel.is_admin" />
        </NFormItem>
        <NFormItem :label="$t('adminUser.status')" path="status">
          <NSelect
            v-model:value="formModel.status"
            :options="statusOptions"
            :placeholder="$t('adminUser.status')"
          />
        </NFormItem>
        <NFormItem :label="$t('adminUser.remark')" path="remark">
          <NInput
            v-model:value="formModel.remark"
            type="textarea"
            :placeholder="$t('adminUser.remark')"
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
    <NModal
      v-model:show="pwdModalShow"
      preset="card"
      :title="$t('adminUser.changePwd')"
      style="width: 440px"
    >
      <NForm ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-placement="top">
        <NFormItem :label="$t('adminUser.password')" path="password">
          <NInput
            v-model:value="pwdForm.password"
            type="password"
            show-password-on="click"
            :placeholder="$t('adminUser.password')"
          />
        </NFormItem>
        <NFormItem :label="$t('adminUser.confirmPassword')" path="confirm">
          <NInput
            v-model:value="pwdForm.confirm"
            type="password"
            show-password-on="click"
            :placeholder="$t('adminUser.confirmPassword')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="pwdModalShow = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="pwdSaving" @click="handleChangePwd">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
