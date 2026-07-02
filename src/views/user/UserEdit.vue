<script setup lang="ts">
defineOptions({ name: 'UserEdit' })
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
  type FormInst,
  type FormRules,
  type SelectOption,
} from 'naive-ui'
import { detail, createUser, updateUser, type UserForm } from '@/api/user'
import { list as listGroups } from '@/api/group'
import type { Group } from '@/types'

type UserEditPayload = UserForm & { password?: string }

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const message = useMessage()

const id = computed<string | undefined>(() => {
  const v = route.params.id
  if (v == null) return undefined
  if (Array.isArray(v)) return v[0]
  return v
})
const isEdit = computed(() => !!id.value)

const saving = ref(false)
const groupList = ref<Group[]>([])

const groupOptions = computed<SelectOption[]>(() =>
  groupList.value.map((g) => ({ label: g.name, value: g.id })),
)

const statusOptions = computed<SelectOption[]>(() => [
  { label: t('adminUser.statusActive'), value: 1 },
  { label: t('adminUser.statusDisabled'), value: 2 },
])

const formRef = ref<FormInst | null>(null)
const formModel = reactive<{
  username: string
  email: string
  nickname: string
  group_id: number
  is_admin: boolean
  status: number
  remark: string
  password: string
}>({
  username: '',
  email: '',
  nickname: '',
  group_id: 0,
  is_admin: false,
  status: 1,
  remark: '',
  password: '',
})

const rules = computed<FormRules>(() => ({
  username: [
    { required: true, message: t('adminUser.username'), trigger: ['blur', 'input'] },
  ],
  group_id: [
    { required: true, type: 'number', message: t('adminUser.groupId'), trigger: 'change' },
  ],
  password: isEdit.value
    ? []
    : [
        {
          required: true,
          message: t('adminUser.passwordRequired'),
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

async function loadDetail(): Promise<void> {
  if (!isEdit.value || !id.value) return
  try {
    const res = await detail(Number(id.value))
    const u = res.data
    formModel.username = u.username
    formModel.email = u.email
    formModel.nickname = u.nickname
    formModel.group_id = u.group_id
    formModel.is_admin = !!u.is_admin
    formModel.status = u.status
    formModel.remark = u.remark
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
    const payload: UserEditPayload = {
      username: formModel.username,
      email: formModel.email,
      nickname: formModel.nickname,
      group_id: formModel.group_id,
      is_admin: formModel.is_admin,
      status: formModel.status,
      remark: formModel.remark,
    }
    if (isEdit.value && id.value) {
      payload.id = Number(id.value)
      await updateUser(payload)
    } else {
      payload.password = formModel.password
      await createUser(payload)
    }
    message.success(t('common.success'))
    router.push('/user/index')
  } catch {
    // ignore
  } finally {
    saving.value = false
  }
}

function handleBack(): void {
  router.push('/user/index')
}

onMounted(() => {
  loadGroups()
  loadDetail()
})

watch(id, () => {
  if (id.value) loadDetail()
})
</script>

<template>
  <NCard>
    <template #header>
      {{ isEdit ? $t('adminUser.editUser') : $t('adminUser.createUser') }}
    </template>
    <NForm
      ref="formRef"
      :model="formModel"
      :rules="rules"
      label-placement="top"
      style="max-width: 520px"
    >
      <NFormItem :label="$t('adminUser.username')" path="username">
        <NInput v-model:value="formModel.username" :placeholder="$t('adminUser.username')" />
      </NFormItem>
      <NFormItem v-if="!isEdit" :label="$t('adminUser.password')" path="password">
        <NInput
          v-model:value="formModel.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('adminUser.password')"
        />
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
      <NSpace>
        <NButton type="primary" :loading="saving" @click="handleSubmit">
          {{ $t('common.save') }}
        </NButton>
        <NButton @click="handleBack">{{ $t('common.back') }}</NButton>
      </NSpace>
    </NForm>
  </NCard>
</template>
