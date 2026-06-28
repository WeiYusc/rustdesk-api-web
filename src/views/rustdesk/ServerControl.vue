<script setup lang="ts">
defineOptions({ name: 'ServerCmd' })
import { computed, h, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NAlert,
  NButton,
  NCard,
  NCode,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpace,
  NTag,
  NTabs,
  NTabPane,
  NText,
  NCollapse,
  NCollapseItem,
  useDialog,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { cmdCreate, cmdDelete, cmdList, cmdUpdate, sendCmd, type ServerCmdForm } from '@/api/rustdesk'
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

const cmdExplainMap: Record<string, string> = {
  'show help': 'adminServerCmd.explainShowHelp',
  'set or show relay servers': 'adminServerCmd.explainRelayServers',
  'block or unblock ip or show blocked ip': 'adminServerCmd.explainIpBlocker',
  'always use relay': 'adminServerCmd.explainAlwaysUseRelay',
  'test geo': 'adminServerCmd.explainTestGeo',
  'blacklist-add(ba) <ip>': 'adminServerCmd.explainBlacklistAdd',
  'blacklist-remove(br) <ip>': 'adminServerCmd.explainBlacklistRemove',
  'blacklist(b) <ip>': 'adminServerCmd.explainBlacklist',
  'blocklist-add(Ba) <ip>': 'adminServerCmd.explainBlocklistAdd',
  'blocklist-remove(Br) <ip>': 'adminServerCmd.explainBlocklistRemove',
  'blocklist(B) <ip>': 'adminServerCmd.explainBlocklist',
  'downgrade-threshold(dt) [value]': 'adminServerCmd.explainDowngradeThreshold',
  'downgrade-start-check(t) [value(second)]': 'adminServerCmd.explainDowngradeStartCheck',
  'limit-speed(ls) [value(Mb/s)]': 'adminServerCmd.explainLimitSpeed',
  'total-bandwidth(tb) [value(Mb/s)]': 'adminServerCmd.explainTotalBandwidth',
  'single-bandwidth(sb) [value(Mb/s)]': 'adminServerCmd.explainSingleBandwidth',
  'usage(u)': 'adminServerCmd.explainUsage',
  'ip-changes(ic) [<id>|<number>] [-]': 'adminServerCmd.explainIpChanges',
}

function translateExplain(explain: string): string {
  const key = cmdExplainMap[explain]
  if (key) {
    const translated = t(key)
    return translated === key ? explain : translated
  }
  return explain
}

function targetName(target: string): string {
  if (target === '21115') return t('adminServerCmd.targetIdServer')
  if (target === '21117') return t('adminServerCmd.targetRelayServer')
  return target || '-'
}

const simpleResult = ref('')

function formatResult(data: string): string {
  if (!data) return ''
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
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
  { title: t('adminServerCmd.cmd'), key: 'cmd', ellipsis: { tooltip: true }, width: 160 },
  { title: t('adminServerCmd.alias'), key: 'alias', ellipsis: { tooltip: true }, width: 100 },
  { title: t('adminServerCmd.option'), key: 'option', ellipsis: { tooltip: true }, width: 140 },
  {
    title: t('adminServerCmd.explain'),
    key: 'explain',
    ellipsis: { tooltip: true },
    render: (row) => translateExplain(row.explain),
  },
  {
    title: t('adminServerCmd.target'),
    key: 'target',
    width: 120,
    render: (row) =>
      h(
        NTag,
        { size: 'small', type: row.target === '21115' ? 'info' : row.target === '21117' ? 'success' : 'default' },
        () => targetName(row.target),
      ),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: (row) => {
      const actions = [
        h(
          NButton,
          { size: 'small', type: 'primary', onClick: () => openExec(row) },
          () => t('adminServerCmd.execute'),
        ),
      ]

      if (canModifyCommand(row)) {
        actions.push(
          h(
            NButton,
            { size: 'small', type: 'info', ghost: true, onClick: () => openEdit(row) },
            () => t('common.edit'),
          ),
          h(
            NButton,
            { size: 'small', type: 'error', ghost: true, onClick: () => handleDelete(row) },
            () => t('common.delete'),
          ),
        )
      }

      return h(NSpace, { size: 8 }, () => actions)
    },
  },
])

function canModifyCommand(row: ServerCmd): boolean {
  return Number(row.id) > 0
}

let latestRequestId = 0

async function loadData(): Promise<void> {
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const res = await cmdList({ page: pagination.page, page_size: pagination.pageSize })
    if (requestId !== latestRequestId) return
    dataList.value = res.data.list ?? []
    pagination.itemCount = Math.max(res.data.total ?? 0, dataList.value.length)
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

const formRef = ref<FormInst | null>(null)
const createModalShow = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const isEditing = computed(() => editingId.value !== null)
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
  editingId.value = null
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

function openEdit(row: ServerCmd): void {
  if (!canModifyCommand(row)) return
  editingId.value = row.id
  formModel.cmd = row.cmd
  formModel.alias = row.alias || ''
  formModel.option = row.option || ''
  formModel.explain = row.explain || ''
  formModel.target = row.target || ''
  formRef.value?.restoreValidation()
  createModalShow.value = true
}

async function handleSave(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    if (isEditing.value && editingId.value !== null) {
      await cmdUpdate({ ...formModel, id: editingId.value })
    } else {
      await cmdCreate({ ...formModel })
    }
    message.success(t('common.success'))
    createModalShow.value = false
    resetForm()
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
  if (!execRow.value) return
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
  if (!canModifyCommand(row)) return
  dialog.warning({
    title: t('common.confirm'),
    content: t('adminServerCmd.deleteConfirm') + ': ' + row.cmd,
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

const referenceCommands = [
  { cmd: 'relay-servers', alias: 'rs', option: 'server1:21117,server2:21117', explain: 'adminServerCmd.explainRelayServers', target: '21115' },
  { cmd: 'ip-blocker', alias: 'ib', option: '192.168.1.100', explain: 'adminServerCmd.explainIpBlocker', target: '21115' },
  { cmd: 'always-use-relay', alias: 'aur', option: 'y', explain: 'adminServerCmd.explainAlwaysUseRelay', target: '21115' },
  { cmd: 'limit-speed', alias: 'ls', option: '10', explain: 'adminServerCmd.explainLimitSpeed', target: '21117' },
  { cmd: 'total-bandwidth', alias: 'tb', option: '100', explain: 'adminServerCmd.explainTotalBandwidth', target: '21117' },
  { cmd: 'usage', alias: 'u', option: '', explain: 'adminServerCmd.explainUsage', target: '21117' },
]
</script>

<template>
  <NCard>
    <template #header>{{ $t('adminServerCmd.title') }}</template>
    <NTabs type="line" @update:value="handleTabChange">
      <NTabPane name="simple" :tab="$t('adminServerCmd.simpleMode')">
        <NSpace vertical :size="12">
          <NSpace :size="8" wrap>
            <NButton
              v-for="item in presetCommands"
              :key="item.cmd"
              disabled
              :title="$t('adminServerCmd.unsupportedPresetNotice')"
            >
              {{ $t(item.explainKey) }}
            </NButton>
          </NSpace>
          <NAlert type="warning" :show-icon="false">
            {{ $t('adminServerCmd.unsupportedPresetNotice') }}
          </NAlert>
          <div v-if="simpleResult">
            <NText depth="3" style="font-size: 13px; margin-bottom: 6px; display: block">{{ $t('adminServerCmd.result') }}</NText>
            <NCode :code="simpleResult" word-wrap style="max-height: 400px; overflow-y: auto" />
          </div>
          <NText v-else depth="3" style="font-size: 13px">{{ $t('adminServerCmd.noResult') }}</NText>
        </NSpace>
      </NTabPane>

      <NTabPane name="advanced" :tab="$t('adminServerCmd.advancedMode')">
        <NSpace vertical :size="12">
          <NSpace justify="space-between" wrap>
            <NButton type="primary" @click="openCreate">{{ $t('adminServerCmd.createCmd') }}</NButton>
            <NCollapse :default-expanded-names="[]">
              <NCollapseItem :title="$t('adminServerCmd.referenceTitle')" name="ref">
                <NDescriptions :column="1" bordered size="small">
                  <NDescriptionsItem v-for="ref in referenceCommands" :key="ref.cmd" :label="ref.cmd">
                    <NSpace align="center" :size="8" wrap>
                      <NTag size="small" :type="ref.target === '21115' ? 'info' : 'success'">
                        {{ targetName(ref.target) }}
                      </NTag>
                      <NText code>{{ ref.option || '-' }}</NText>
                      <NText depth="3">{{ $t(ref.explain) }}</NText>
                    </NSpace>
                  </NDescriptionsItem>
                </NDescriptions>
              </NCollapseItem>
            </NCollapse>
          </NSpace>
          <NDataTable
            remote
            :scroll-x="1000"
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
      :title="isEditing ? $t('adminServerCmd.editCmd') : $t('adminServerCmd.createCmd')"
      style="width: 520px; max-width: 90vw"
    >
      <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="top">
        <NFormItem :label="$t('adminServerCmd.cmd')" path="cmd">
          <NInput v-model:value="formModel.cmd" :placeholder="$t('adminServerCmd.cmdPlaceholder')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.alias')" path="alias">
          <NInput v-model:value="formModel.alias" :placeholder="$t('adminServerCmd.aliasPlaceholder')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.option')" path="option">
          <NInput v-model:value="formModel.option" :placeholder="$t('adminServerCmd.optionPlaceholder')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.explain')" path="explain">
          <NInput v-model:value="formModel.explain" :placeholder="$t('adminServerCmd.explainPlaceholder')" />
        </NFormItem>
        <NFormItem :label="$t('adminServerCmd.target')" path="target">
          <NInput v-model:value="formModel.target" :placeholder="$t('adminServerCmd.targetPlaceholder')" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="createModalShow = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">
            {{ isEditing ? $t('adminServerCmd.editCmd') : $t('adminServerCmd.createCmd') }}
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
      <NSpace vertical :size="12">
        <NDescriptions :column="2" size="small" bordered>
          <NDescriptionsItem :label="$t('adminServerCmd.cmd')">
            <NText strong>{{ execRow?.cmd }}</NText>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('adminServerCmd.alias')">
            {{ execRow?.alias || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('adminServerCmd.explain')">
            {{ execRow ? translateExplain(execRow.explain) : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('adminServerCmd.target')">
            <NTag size="small" :type="execRow?.target === '21115' ? 'info' : 'success'">
              {{ execRow ? targetName(execRow.target) : '-' }}
            </NTag>
          </NDescriptionsItem>
        </NDescriptions>
        <div>
          <NText depth="3" style="font-size: 13px; margin-bottom: 6px; display: block">{{ $t('adminServerCmd.option') }}</NText>
          <NInput
            v-model:value="execOption"
            type="textarea"
            :rows="2"
            :placeholder="$t('adminServerCmd.optionInput')"
          />
        </div>
        <NButton type="primary" :loading="execRunning" @click="handleExec">
          {{ $t('adminServerCmd.execute') }}
        </NButton>
        <div v-if="execResult || execRunning">
          <NText depth="3" style="font-size: 13px; margin-bottom: 6px; display: block">{{ $t('adminServerCmd.result') }}</NText>
          <NCode :code="execResult" word-wrap style="max-height: 300px; overflow-y: auto" />
        </div>
      </NSpace>
    </NModal>
  </NCard>
</template>
