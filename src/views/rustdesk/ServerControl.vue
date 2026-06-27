<script setup lang="ts">
defineOptions({ name: 'ServerCmd' })
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCard,
  NCode,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  NSpace,
  NTabs,
  NTabPane,
  NText,
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { cmdCreate, cmdDelete, cmdList, sendCmd, type ServerCmdForm } from '@/api/rustdesk'
import type { ServerCmd } from '@/types'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

interface PresetCommand {
  cmd: string
  explainKey: string
}

const presetCommands: PresetCommand[] = [
  { cmd: 'get_online_devices', explainKey: 'adminServerCmd.getOnlineDevices' },
  { cmd: 'get_all_devices', explainKey: 'adminServerCmd.getAllDevices' },
  { cmd: 'reload', explainKey: 'adminServerCmd.reloadService' },
]

const runningCmd = ref<string>('')
const simpleResult = ref('')

function formatResult(data: string): string {
  if (!data) {
    return ''
  }
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

async function runPreset(cmd: string): Promise<void> {
  runningCmd.value = cmd
  simpleResult.value = ''
  try {
    const res = await sendCmd({ cmd, target: '' })
    simpleResult.value = formatResult(res.data)
    message.success(t('common.success'))
  } catch {
    //ignore
  } finally {
    runningCmd.value = ''
  }
}

const loading = ref(false)
const dataList = ref<ServerCmd[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
})

const columns = computed<DataTableColumns<ServerCmd>>(() => [
  { title: t('adminServerCmd.cmd'), key: 'cmd' },
  { title: t('adminServerCmd.alias'), key: 'alias' },
  { title: t('adminServerCmd.option'), key: 'option' },
  { title: t('adminServerCmd.explain'), key: 'explain' },
  { title: t('adminServerCmd.target'), key: 'target' },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 200,
    render: (row) =>
      h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NButton,
              { size: 'small', type: 'primary', onClick: () => openExec(row) },
              { default: () => t('adminServerCmd.execute') },
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

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const res = await cmdList({ page: pagination.page, page_size: pagination.pageSize })
    dataList.value = res.data.list ?? []
    pagination.itemCount = res.data.total ?? 0
  } catch {
    //ignore
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

const formRef = ref<FormInst | null>(null)
const createModalShow = ref(false)
const saving = ref(false)
const formModel = reactive<ServerCmdForm>({
  cmd: '',
  alias: '',
  option: '',
  explain: '',
  target: '',
})

const rules = computed<FormRules>(() => ({
  cmd: [
    { required: true, message: t('adminServerCmd.cmdRequired'), trigger: ['blur', 'input'] },
  ],
}))

function resetForm(): void {
  formModel.cmd = ''
  formModel.alias = ''
  formModel.option = ''
  formModel.explain = ''
  formModel.target = ''
}

function openCreate(): void {
  resetForm()
  formRef.value?.restoreValidation()
  createModalShow.value = true
}

async function handleCreate(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    await cmdCreate({ ...formModel })
    message.success(t('common.success'))
    createModalShow.value = false
    loadData()
  } catch {
    //ignore
  } finally {
    saving.value = false
  }
}

const execModalShow = ref(false)
const execRow = ref<ServerCmd | null>(null)
const execOption = ref('')
const execResult = ref('')
const execRunning = ref(false)

function openExec(row: ServerCmd): void {
  execRow.value = row
  execOption.value = row.option || ''
  execResult.value = ''
  execModalShow.value = true
}

async function handleExec(): Promise<void> {
  if (!execRow.value) {
    return
  }
  execRunning.value = true
  execResult.value = ''
  try {
    const res = await sendCmd({
      cmd: execRow.value.cmd,
      option: execOption.value,
      target: execRow.value.target || '',
    })
    execResult.value = formatResult(res.data)
    message.success(t('common.success'))
  } catch {
    //ignore
  } finally {
    execRunning.value = false
  }
}

function handleDelete(row: ServerCmd): void {
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminServerCmd.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await cmdDelete({ id: row.id })
        message.success(t('common.success'))
        loadData()
      } catch {
        //ignore
      }
    },
  })
}

onMounted(loadData)

function handleTabChange(name: string | number): void {
  if (name === 'advanced') {
    loadData()
  }
}
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminServerCmd.title') }}</template>
    <NTabs type="line" @update:value="handleTabChange">
      <NTabPane name="simple" :tab="$t('adminServerCmd.simpleMode')">
        <NSpace vertical :size="16">
          <NText depth="3">{{ $t('adminServerCmd.presetCommands') }}</NText>
          <NGrid cols="1 s:2 m:3 l:4" :x-gap="12" :y-gap="12">
            <NGridItem v-for="item in presetCommands" :key="item.cmd">
              <NCard size="small" hoverable>
                <template #header>{{ $t(item.explainKey) }}</template>
                <template #header-extra>
                  <NText depth="3">{{ item.cmd }}</NText>
                </template>
                <NButton
                  type="primary"
                  block
                  :disabled="!!runningCmd"
                  :loading="runningCmd === item.cmd"
                  @click="runPreset(item.cmd)"
                >
                  {{ $t('adminServerCmd.execute') }}
                </NButton>
              </NCard>
            </NGridItem>
          </NGrid>
          <div v-if="simpleResult || runningCmd">
            <div style="margin-bottom: 8px">{{ $t('adminServerCmd.result') }}</div>
            <NCode :code="simpleResult" word-wrap />
          </div>
          <NText v-else depth="3">{{ $t('adminServerCmd.noResult') }}</NText>
        </NSpace>
      </NTabPane>
      <NTabPane name="advanced" :tab="$t('adminServerCmd.advancedMode')">
        <NSpace vertical :size="16">
          <NButton type="primary" @click="openCreate">{{ $t('adminServerCmd.createCmd') }}</NButton>
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
        </NSpace>
      </NTabPane>
    </NTabs>

    <NModal
      v-model:show="createModalShow"
      preset="card"
      :title="$t('adminServerCmd.createCmd')"
      style="width: 520px; max-width: 90vw"
    >
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="top">
        <NFormItem :label="$t('adminServerCmd.cmd')" path="cmd">
          <NInput v-model:value="formModel.cmd" :placeholder="$t('adminServerCmd.cmd')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.alias')" path="alias">
          <NInput v-model:value="formModel.alias" :placeholder="$t('adminServerCmd.alias')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.option')" path="option">
          <NInput v-model:value="formModel.option" :placeholder="$t('adminServerCmd.option')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.explain')" path="explain">
          <NInput v-model:value="formModel.explain" :placeholder="$t('adminServerCmd.explain')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.target')" path="target">
          <NInput v-model:value="formModel.target" :placeholder="$t('adminServerCmd.target')" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="createModalShow = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="saving" @click="handleCreate">
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="execModalShow"
      preset="card"
      :title="$t('adminServerCmd.executeCmd')"
      style="width: 600px; max-width: 90vw"
    >
      <NSpace vertical :size="16">
        <NSpace align="center">
          <NText depth="3">{{ $t('adminServerCmd.cmd') }}:</NText>
          <NText strong>{{ execRow?.cmd }}</NText>
        </NSpace>
        <div>
          <div style="margin-bottom: 8px">{{ $t('adminServerCmd.option') }}</div>
          <NInput
            v-model:value="execOption"
            type="textarea"
            :placeholder="$t('adminServerCmd.optionInput')"
          />
        </div>
        <NButton type="primary" :loading="execRunning" @click="handleExec">
          {{ $t('adminServerCmd.execute') }}
        </NButton>
        <div v-if="execResult || execRunning">
          <div style="margin-bottom: 8px">{{ $t('adminServerCmd.result') }}</div>
          <NCode :code="execResult" word-wrap />
        </div>
      </NSpace>
    </NModal>
  </NCard>
</template>
