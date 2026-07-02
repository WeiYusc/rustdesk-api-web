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
  NInput,
  NInputNumber,
  NModal,
  NSpace,
  NSwitch,
  NTag,
  NText,
  NDivider,
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

function formatResult(data: string): string {
  if (!data) return ''
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

async function executeCmd(cmd: string, option: string, target: string): Promise<string> {
  const res = await sendCmd({ cmd, option, target })
  return formatResult(res.data)
}

function targetName(target: string): string {
  if (target === '21115') return t('adminServerCmd.targetIdServer')
  if (target === '21117') return t('adminServerCmd.targetRelayServer')
  return target || '-'
}

function targetTagType(target: string): 'default' | 'info' | 'success' {
  if (target === '21115') return 'info'
  if (target === '21117') return 'success'
  return 'default'
}

function translateExplain(explain: string): string {
  const key = cmdExplainMap[explain]
  if (key) {
    const translated = t(key)
    return translated === key ? explain : translated
  }
  return explain
}

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

const ID_SERVER = '21115'
const RELAY_SERVER = '21117'

const ipBlockResult = ref('')
const ipBlockLoading = ref(false)
const ipBlockInput = ref('')

async function doIpBlock(action: 'block' | 'unblock' | 'list'): Promise<void> {
  ipBlockLoading.value = true
  ipBlockResult.value = ''
  try {
    let option = ''
    if (action === 'block') {
      option = ipBlockInput.value
    } else if (action === 'unblock') {
      option = `${ipBlockInput.value} -`
    }
    ipBlockResult.value = await executeCmd('ip-blocker', option, ID_SERVER)
    if (action !== 'list') ipBlockInput.value = ''
  } catch {
    // ignore
  } finally {
    ipBlockLoading.value = false
  }
}

const relayResult = ref('')
const relayLoading = ref(false)
const alwaysUseRelay = ref(false)
const relayServersInput = ref('')

async function checkAlwaysUseRelay(): Promise<void> {
  relayLoading.value = true
  try {
    const res = await executeCmd('always-use-relay', '', ID_SERVER)
    alwaysUseRelay.value = res.includes('true')
  } catch {
    // ignore
  } finally {
    relayLoading.value = false
  }
}

async function toggleAlwaysUseRelay(val: boolean): Promise<void> {
  relayLoading.value = true
  try {
    await executeCmd('always-use-relay', val ? 'y' : 'n', ID_SERVER)
    alwaysUseRelay.value = val
    relayResult.value = t('common.success')
  } catch {
    // ignore
  } finally {
    relayLoading.value = false
  }
}

async function checkRelayServers(): Promise<void> {
  relayLoading.value = true
  try {
    relayResult.value = await executeCmd('relay-servers', '', ID_SERVER)
  } catch {
    // ignore
  } finally {
    relayLoading.value = false
  }
}

async function setRelayServers(): Promise<void> {
  if (!relayServersInput.value) return
  relayLoading.value = true
  try {
    relayResult.value = await executeCmd('relay-servers', relayServersInput.value, ID_SERVER)
    relayServersInput.value = ''
  } catch {
    // ignore
  } finally {
    relayLoading.value = false
  }
}

const ipChangesResult = ref('')
const ipChangesLoading = ref(false)

async function doIpChanges(action: 'list' | 'clear'): Promise<void> {
  ipChangesLoading.value = true
  ipChangesResult.value = ''
  try {
    const option = action === 'clear' ? '-' : ''
    ipChangesResult.value = await executeCmd('ip-changes', option, ID_SERVER)
  } catch {
    // ignore
  } finally {
    ipChangesLoading.value = false
  }
}

const punchResult = ref('')
const punchLoading = ref(false)

async function doPunch(action: 'list' | 'clear'): Promise<void> {
  punchLoading.value = true
  punchResult.value = ''
  try {
    const option = action === 'clear' ? '-' : ''
    punchResult.value = await executeCmd('punch-requests', option, ID_SERVER)
  } catch {
    // ignore
  } finally {
    punchLoading.value = false
  }
}

const geoResult = ref('')
const geoLoading = ref(false)
const geoIp1 = ref('')
const geoIp2 = ref('')

async function doTestGeo(): Promise<void> {
  if (!geoIp1.value || !geoIp2.value) return
  geoLoading.value = true
  geoResult.value = ''
  try {
    geoResult.value = await executeCmd('test-geo', `${geoIp1.value} ${geoIp2.value}`, ID_SERVER)
  } catch {
    // ignore
  } finally {
    geoLoading.value = false
  }
}

const blacklistResult = ref('')
const blacklistLoading = ref(false)
const blacklistInput = ref('')

async function doBlacklist(action: 'add' | 'remove' | 'list' | 'clear'): Promise<void> {
  blacklistLoading.value = true
  blacklistResult.value = ''
  try {
    let cmd = 'blacklist'
    let option = ''
    if (action === 'add') { cmd = 'blacklist-add'; option = blacklistInput.value }
    else if (action === 'remove') { cmd = 'blacklist-remove'; option = blacklistInput.value }
    else if (action === 'clear') { cmd = 'blacklist-remove'; option = 'all' }
    blacklistResult.value = await executeCmd(cmd, option, RELAY_SERVER)
    if (action === 'add' || action === 'remove') blacklistInput.value = ''
  } catch {
    // ignore
  } finally {
    blacklistLoading.value = false
  }
}

const blocklistResult = ref('')
const blocklistLoading = ref(false)
const blocklistInput = ref('')

async function doBlocklist(action: 'add' | 'remove' | 'list' | 'clear'): Promise<void> {
  blocklistLoading.value = true
  blocklistResult.value = ''
  try {
    let cmd = 'blocklist'
    let option = ''
    if (action === 'add') { cmd = 'blocklist-add'; option = blocklistInput.value }
    else if (action === 'remove') { cmd = 'blocklist-remove'; option = blocklistInput.value }
    else if (action === 'clear') { cmd = 'blocklist-remove'; option = 'all' }
    blocklistResult.value = await executeCmd(cmd, option, RELAY_SERVER)
    if (action === 'add' || action === 'remove') blocklistInput.value = ''
  } catch {
    // ignore
  } finally {
    blocklistLoading.value = false
  }
}

const bandwidthResult = ref('')
const bandwidthLoading = ref(false)
const speedLimitInput = ref<number | null>(null)
const totalBandwidthInput = ref<number | null>(null)
const singleBandwidthInput = ref<number | null>(null)

async function doBandwidth(cmd: 'limit-speed' | 'total-bandwidth' | 'single-bandwidth', action: 'set' | 'view'): Promise<void> {
  bandwidthLoading.value = true
  bandwidthResult.value = ''
  try {
    let option = ''
    if (action === 'set') {
      if (cmd === 'limit-speed' && speedLimitInput.value !== null) option = String(speedLimitInput.value)
      else if (cmd === 'total-bandwidth' && totalBandwidthInput.value !== null) option = String(totalBandwidthInput.value)
      else if (cmd === 'single-bandwidth' && singleBandwidthInput.value !== null) option = String(singleBandwidthInput.value)
    }
    bandwidthResult.value = await executeCmd(cmd, option, RELAY_SERVER)
  } catch {
    // ignore
  } finally {
    bandwidthLoading.value = false
  }
}

async function viewUsage(): Promise<void> {
  bandwidthLoading.value = true
  bandwidthResult.value = ''
  try {
    bandwidthResult.value = await executeCmd('usage', '', RELAY_SERVER)
  } catch {
    // ignore
  } finally {
    bandwidthLoading.value = false
  }
}

const downgradeResult = ref('')
const downgradeLoading = ref(false)
const downgradeThresholdInput = ref<number | null>(null)
const downgradeStartCheckInput = ref<number | null>(null)

async function doDowngrade(cmd: 'downgrade-threshold' | 'downgrade-start-check', action: 'set' | 'view'): Promise<void> {
  downgradeLoading.value = true
  downgradeResult.value = ''
  try {
    let option = ''
    if (action === 'set') {
      if (cmd === 'downgrade-threshold' && downgradeThresholdInput.value !== null) option = String(downgradeThresholdInput.value)
      else if (cmd === 'downgrade-start-check' && downgradeStartCheckInput.value !== null) option = String(downgradeStartCheckInput.value)
    }
    downgradeResult.value = await executeCmd(cmd, option, RELAY_SERVER)
  } catch {
    // ignore
  } finally {
    downgradeLoading.value = false
  }
}

const customResult = ref('')
const customLoading = ref(false)
const customCmd = ref('')
const customOption = ref('')
const customTarget = ref(ID_SERVER)

const resultModalShow = ref(false)
const resultModalLoading = ref(false)
const resultModalResult = ref('')
const resultModalCmd = ref('')
const resultModalOption = ref('')
const resultModalTarget = ref(ID_SERVER)

async function doCustomExec(): Promise<void> {
  if (!customCmd.value) return
  customLoading.value = true
  customResult.value = ''
  try {
    customResult.value = await executeCmd(customCmd.value, customOption.value, customTarget.value)
    message.success(t('common.success'))
  } catch {
    // ignore
  } finally {
    customLoading.value = false
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

function canModifyCommand(row: ServerCmd): boolean {
  return Number(row.id) > 0
}

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
        { size: 'small', type: targetTagType(row.target) },
        () => targetName(row.target),
      ),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) => {
      const actions = [
        h(
          NButton,
          { size: 'small', type: 'primary', onClick: () => execCustomFromList(row) },
          () => t('adminServerCmd.execute'),
        ),
      ]
      if (canModifyCommand(row)) {
        actions.push(
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

function execCustomFromList(row: ServerCmd): void {
  resultModalCmd.value = row.cmd
  resultModalOption.value = row.option || ''
  resultModalTarget.value = row.target || ID_SERVER
  resultModalResult.value = ''
  resultModalShow.value = true
  runResultModalCommand()
}

async function runResultModalCommand(): Promise<void> {
  if (!resultModalCmd.value) return
  resultModalLoading.value = true
  resultModalResult.value = ''
  try {
    resultModalResult.value = await executeCmd(resultModalCmd.value, resultModalOption.value, resultModalTarget.value)
    message.success(t('common.success'))
  } catch {
    // handled by interceptor
  } finally {
    resultModalLoading.value = false
  }
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

async function handleSave(): Promise<void> {
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
    resetForm()
    loadData()
  } catch {
    // ignore
  } finally {
    saving.value = false
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
        // ignore
      }
    },
  })
}

onMounted(() => {
  loadData()
  checkAlwaysUseRelay()
})
</script>

<template>
  <NSpace vertical :size="16">
    <NCard>
      <template #header>{{ $t('adminServerCmd.title') }}</template>
      <NSpace vertical :size="16">
        <NCard size="small" :bordered="true">
          <template #header>
            <NTag type="info" size="small">{{ $t('adminServerCmd.targetIdServer') }}</NTag>
            <NText style="margin-left: 8px">{{ $t('adminServerCmd.idServerPanel') }}</NText>
          </template>

          <NSpace vertical :size="16">
            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.ipBlockTitle') }}</NText>
              <NSpace :size="8" wrap align="center">
                <NInput v-model:value="ipBlockInput" :placeholder="$t('adminServerCmd.ipPlaceholder')" style="width: 200px" />
                <NButton size="small" type="error" :loading="ipBlockLoading" :disabled="!ipBlockInput" @click="doIpBlock('block')">{{ $t('adminServerCmd.blockIp') }}</NButton>
                <NButton size="small" type="warning" ghost :loading="ipBlockLoading" :disabled="!ipBlockInput" @click="doIpBlock('unblock')">{{ $t('adminServerCmd.unblockIp') }}</NButton>
                <NButton size="small" :loading="ipBlockLoading" @click="doIpBlock('list')">{{ $t('adminServerCmd.viewList') }}</NButton>
              </NSpace>
              <div v-if="ipBlockResult || ipBlockLoading" style="margin-top: 8px">
                <NCode :code="ipBlockResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>

            <NDivider />

            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.relayConfigTitle') }}</NText>
              <NSpace vertical :size="12">
                <NSpace :size="8" align="center">
                  <NText>{{ $t('adminServerCmd.alwaysUseRelay') }}</NText>
                  <NSwitch :value="alwaysUseRelay" :loading="relayLoading" @update:value="toggleAlwaysUseRelay" />
                </NSpace>
                <NSpace :size="8" align="center">
                  <NButton size="small" :loading="relayLoading" @click="checkRelayServers">{{ $t('adminServerCmd.viewRelayServers') }}</NButton>
                </NSpace>
                <NSpace :size="8" align="center">
                  <NInput v-model:value="relayServersInput" :placeholder="$t('adminServerCmd.relayServersPlaceholder')" style="width: 300px" />
                  <NButton size="small" type="primary" :loading="relayLoading" :disabled="!relayServersInput" @click="setRelayServers">{{ $t('adminServerCmd.setRelayServers') }}</NButton>
                </NSpace>
              </NSpace>
              <div v-if="relayResult || relayLoading" style="margin-top: 8px">
                <NCode :code="relayResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>

            <NDivider />

            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.ipChangesTitle') }}</NText>
              <NSpace :size="8" wrap>
                <NButton size="small" :loading="ipChangesLoading" @click="doIpChanges('list')">{{ $t('adminServerCmd.viewList') }}</NButton>
                <NButton size="small" type="warning" ghost :loading="ipChangesLoading" @click="doIpChanges('clear')">{{ $t('adminServerCmd.clearRecords') }}</NButton>
              </NSpace>
              <div v-if="ipChangesResult || ipChangesLoading" style="margin-top: 8px">
                <NCode :code="ipChangesResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>

            <NDivider />

            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.punchTitle') }}</NText>
              <NSpace :size="8" wrap>
                <NButton size="small" :loading="punchLoading" @click="doPunch('list')">{{ $t('adminServerCmd.viewList') }}</NButton>
                <NButton size="small" type="warning" ghost :loading="punchLoading" @click="doPunch('clear')">{{ $t('adminServerCmd.clearRecords') }}</NButton>
              </NSpace>
              <div v-if="punchResult || punchLoading" style="margin-top: 8px">
                <NCode :code="punchResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>

            <NDivider />

            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.testGeoTitle') }}</NText>
              <NSpace :size="8" wrap align="center">
                <NInput v-model:value="geoIp1" :placeholder="$t('adminServerCmd.ip1Placeholder')" style="width: 160px" />
                <NInput v-model:value="geoIp2" :placeholder="$t('adminServerCmd.ip2Placeholder')" style="width: 160px" />
                <NButton size="small" type="primary" :loading="geoLoading" :disabled="!geoIp1 || !geoIp2" @click="doTestGeo">{{ $t('adminServerCmd.testGeo') }}</NButton>
              </NSpace>
              <div v-if="geoResult || geoLoading" style="margin-top: 8px">
                <NCode :code="geoResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>
          </NSpace>
        </NCard>

        <NCard size="small" :bordered="true">
          <template #header>
            <NTag type="success" size="small">{{ $t('adminServerCmd.targetRelayServer') }}</NTag>
            <NText style="margin-left: 8px">{{ $t('adminServerCmd.relayServerPanel') }}</NText>
          </template>

          <NSpace vertical :size="16">
            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.blacklistTitle') }}</NText>
              <NSpace :size="8" wrap align="center">
                <NInput v-model:value="blacklistInput" :placeholder="$t('adminServerCmd.ipPlaceholder')" style="width: 200px" />
                <NButton size="small" type="error" :loading="blacklistLoading" :disabled="!blacklistInput" @click="doBlacklist('add')">{{ $t('adminServerCmd.add') }}</NButton>
                <NButton size="small" type="warning" ghost :loading="blacklistLoading" :disabled="!blacklistInput" @click="doBlacklist('remove')">{{ $t('adminServerCmd.remove') }}</NButton>
                <NButton size="small" :loading="blacklistLoading" @click="doBlacklist('list')">{{ $t('adminServerCmd.viewList') }}</NButton>
                <NButton size="small" type="error" ghost :loading="blacklistLoading" @click="doBlacklist('clear')">{{ $t('adminServerCmd.clearAll') }}</NButton>
              </NSpace>
              <div v-if="blacklistResult || blacklistLoading" style="margin-top: 8px">
                <NCode :code="blacklistResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>

            <NDivider />

            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.blocklistTitle') }}</NText>
              <NSpace :size="8" wrap align="center">
                <NInput v-model:value="blocklistInput" :placeholder="$t('adminServerCmd.ipPlaceholder')" style="width: 200px" />
                <NButton size="small" type="error" :loading="blocklistLoading" :disabled="!blocklistInput" @click="doBlocklist('add')">{{ $t('adminServerCmd.add') }}</NButton>
                <NButton size="small" type="warning" ghost :loading="blocklistLoading" :disabled="!blocklistInput" @click="doBlocklist('remove')">{{ $t('adminServerCmd.remove') }}</NButton>
                <NButton size="small" :loading="blocklistLoading" @click="doBlocklist('list')">{{ $t('adminServerCmd.viewList') }}</NButton>
                <NButton size="small" type="error" ghost :loading="blocklistLoading" @click="doBlocklist('clear')">{{ $t('adminServerCmd.clearAll') }}</NButton>
              </NSpace>
              <div v-if="blocklistResult || blocklistLoading" style="margin-top: 8px">
                <NCode :code="blocklistResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>

            <NDivider />

            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.bandwidthTitle') }}</NText>
              <NSpace vertical :size="12">
                <NSpace :size="8" align="center" wrap>
                  <NText style="width: 100px">{{ $t('adminServerCmd.limitSpeed') }}</NText>
                  <NInputNumber v-model:value="speedLimitInput" :placeholder="$t('adminServerCmd.mbPerSec')" style="width: 120px" />
                  <NButton size="small" type="primary" :loading="bandwidthLoading" :disabled="speedLimitInput === null" @click="doBandwidth('limit-speed', 'set')">{{ $t('adminServerCmd.set') }}</NButton>
                  <NButton size="small" :loading="bandwidthLoading" @click="doBandwidth('limit-speed', 'view')">{{ $t('adminServerCmd.view') }}</NButton>
                </NSpace>
                <NSpace :size="8" align="center" wrap>
                  <NText style="width: 100px">{{ $t('adminServerCmd.totalBandwidth') }}</NText>
                  <NInputNumber v-model:value="totalBandwidthInput" :placeholder="$t('adminServerCmd.mbPerSec')" style="width: 120px" />
                  <NButton size="small" type="primary" :loading="bandwidthLoading" :disabled="totalBandwidthInput === null" @click="doBandwidth('total-bandwidth', 'set')">{{ $t('adminServerCmd.set') }}</NButton>
                  <NButton size="small" :loading="bandwidthLoading" @click="doBandwidth('total-bandwidth', 'view')">{{ $t('adminServerCmd.view') }}</NButton>
                </NSpace>
                <NSpace :size="8" align="center" wrap>
                  <NText style="width: 100px">{{ $t('adminServerCmd.singleBandwidth') }}</NText>
                  <NInputNumber v-model:value="singleBandwidthInput" :placeholder="$t('adminServerCmd.mbPerSec')" style="width: 120px" />
                  <NButton size="small" type="primary" :loading="bandwidthLoading" :disabled="singleBandwidthInput === null" @click="doBandwidth('single-bandwidth', 'set')">{{ $t('adminServerCmd.set') }}</NButton>
                  <NButton size="small" :loading="bandwidthLoading" @click="doBandwidth('single-bandwidth', 'view')">{{ $t('adminServerCmd.view') }}</NButton>
                </NSpace>
                <NText depth="3" style="font-size: 12px">{{ $t('adminServerCmd.bandwidthHint') }}</NText>
                <NButton size="small" :loading="bandwidthLoading" @click="viewUsage">{{ $t('adminServerCmd.viewUsage') }}</NButton>
              </NSpace>
              <div v-if="bandwidthResult || bandwidthLoading" style="margin-top: 8px">
                <NCode :code="bandwidthResult" word-wrap style="max-height: 300px; overflow-y: auto" />
              </div>
            </div>

            <NDivider />

            <div>
              <NText strong style="display: block; margin-bottom: 8px">{{ $t('adminServerCmd.downgradeTitle') }}</NText>
              <NSpace vertical :size="12">
                <NSpace :size="8" align="center" wrap>
                  <NText style="width: 100px">{{ $t('adminServerCmd.downgradeThreshold') }}</NText>
                  <NInputNumber v-model:value="downgradeThresholdInput" :placeholder="$t('adminServerCmd.thresholdPlaceholder')" style="width: 120px" />
                  <NButton size="small" type="primary" :loading="downgradeLoading" :disabled="downgradeThresholdInput === null" @click="doDowngrade('downgrade-threshold', 'set')">{{ $t('adminServerCmd.set') }}</NButton>
                  <NButton size="small" :loading="downgradeLoading" @click="doDowngrade('downgrade-threshold', 'view')">{{ $t('adminServerCmd.view') }}</NButton>
                </NSpace>
                <NSpace :size="8" align="center" wrap>
                  <NText style="width: 100px">{{ $t('adminServerCmd.downgradeStartCheck') }}</NText>
                  <NInputNumber v-model:value="downgradeStartCheckInput" :placeholder="$t('adminServerCmd.seconds')" style="width: 120px" />
                  <NButton size="small" type="primary" :loading="downgradeLoading" :disabled="downgradeStartCheckInput === null" @click="doDowngrade('downgrade-start-check', 'set')">{{ $t('adminServerCmd.set') }}</NButton>
                  <NButton size="small" :loading="downgradeLoading" @click="doDowngrade('downgrade-start-check', 'view')">{{ $t('adminServerCmd.view') }}</NButton>
                </NSpace>
              </NSpace>
              <div v-if="downgradeResult || downgradeLoading" style="margin-top: 8px">
                <NCode :code="downgradeResult" word-wrap style="max-height: 200px; overflow-y: auto" />
              </div>
            </div>
          </NSpace>
        </NCard>

        <NCard size="small" :bordered="true">
          <template #header>{{ $t('adminServerCmd.customCmdTitle') }}</template>
          <NSpace vertical :size="12">
            <NSpace :size="8" align="center" wrap>
              <NText>{{ $t('adminServerCmd.target') }}</NText>
              <NInput v-model:value="customTarget" style="width: 120px" :placeholder="$t('adminServerCmd.targetPlaceholder')" />
              <NText>{{ $t('adminServerCmd.cmd') }}</NText>
              <NInput v-model:value="customCmd" style="width: 200px" :placeholder="$t('adminServerCmd.cmdPlaceholder')" />
              <NText>{{ $t('adminServerCmd.option') }}</NText>
              <NInput v-model:value="customOption" style="width: 200px" :placeholder="$t('adminServerCmd.optionInput')" />
              <NButton type="primary" :loading="customLoading" :disabled="!customCmd" @click="doCustomExec">{{ $t('adminServerCmd.execute') }}</NButton>
            </NSpace>
            <div v-if="customResult || customLoading">
              <NText depth="3" style="font-size: 13px; margin-bottom: 6px; display: block">{{ $t('adminServerCmd.result') }}</NText>
              <NCode :code="customResult" word-wrap style="max-height: 300px; overflow-y: auto" />
            </div>

            <NDivider />

            <NSpace justify="space-between" align="center" wrap>
              <NText strong>{{ $t('adminServerCmd.customCmdList') }}</NText>
              <NButton type="primary" size="small" @click="openCreate">{{ $t('adminServerCmd.createCmd') }}</NButton>
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
        </NCard>
      </NSpace>
    </NCard>

    <NModal
      v-model:show="resultModalShow"
      preset="card"
      :title="$t('adminServerCmd.executeResult')"
      style="width: 760px; max-width: 90vw"
    >
      <NSpace vertical :size="12">
        <NSpace :size="8" wrap>
          <NTag size="small" :type="targetTagType(resultModalTarget)">{{ targetName(resultModalTarget) }}</NTag>
          <NText strong>{{ resultModalCmd }}</NText>
          <NText v-if="resultModalOption" depth="3">{{ resultModalOption }}</NText>
        </NSpace>
        <div>
          <NText depth="3" style="font-size: 13px; margin-bottom: 6px; display: block">
            {{ $t('adminServerCmd.result') }}
          </NText>
          <NText v-if="resultModalLoading && !resultModalResult" depth="3">
            {{ $t('adminServerCmd.executing') }}
          </NText>
          <NCode v-else :code="resultModalResult" word-wrap style="max-height: 420px; overflow-y: auto" />
        </div>
      </NSpace>
      <template #footer>
        <NSpace justify="end">
          <NButton :loading="resultModalLoading" @click="runResultModalCommand">
            {{ $t('adminServerCmd.executeAgain') }}
          </NButton>
          <NButton @click="resultModalShow = false">{{ $t('common.close') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="createModalShow"
      preset="card"
      :title="$t('adminServerCmd.createCmd')"
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
            {{ $t('common.save') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>
