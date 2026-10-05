import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { i18n, setLocale, SUPPORTED_LOCALES, type AppLocale } from '@/i18n'
import { describe, expect, it, vi } from 'vitest'


vi.mock('@/api/audit', () => ({ connList: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }), fileList: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }), connDelete: vi.fn(), connBatchDelete: vi.fn(), fileDelete: vi.fn(), fileBatchDelete: vi.fn() }))
vi.mock('naive-ui', () => {
  const pass = defineComponent({ template: '<div><slot /><slot name="header" /><slot name="header-extra" /></div>' })
  const tag = defineComponent({ props: ['type'], template: '<span :data-kind="type"><slot /></span>' })
  const table = defineComponent({ name: 'NDataTable', props: ['columns', 'data'], render: () => h('div') })
  return { NCard: pass, NSpace: pass, NInput: pass, NButton: pass, NAlert: pass, NTag: tag, NDataTable: table, useDialog: () => ({}), useMessage: () => ({}) }
})
import Conn from '@/views/audit/ConnList.vue'
import File from '@/views/audit/FileList.vue'

async function page(component: typeof Conn | typeof File, locale: AppLocale) {
  setLocale(locale)
  const wrapper = mount(component, { global: { plugins: [i18n] } })
  await flushPromises()
  // Exercise the actual page's column renderers rather than a mirrored formatter.
  const columns = wrapper.findComponent({ name: 'NDataTable' }).props('columns')
  return { wrapper, columns }
}
const expected = {
  en: { conn: ['Remote control', 'File transfer', 'Port forwarding', 'Camera', 'Terminal'], file: ['Controlled device sends (controller download)', 'Controlled device receives (controller upload)'], unknown: (n: number) => `Unknown type (${n})`, open: 'No close report received', closed: 'Close recorded', note: 'Operation records do not prove transfer completion; completion/cancellation status is not recorded.' },
  'zh-CN': { conn: ['远程控制', '文件传输', '端口转发', '摄像头', '终端'], file: ['被控端发送（控制端下载）', '被控端接收（控制端上传）'], unknown: (n: number) => `未知类型（${n}）`, open: '未收到关闭上报', closed: '已记录关闭', note: '操作记录不代表传输完成，未记录完成/取消状态。' },
}
for (const { value: locale } of SUPPORTED_LOCALES) {
  const semantics = expected[locale === 'zh-CN' ? 'zh-CN' : 'en']
  describe(locale, () => {
    for (const code of [0, 1, 2, 3, 4, -1, 99]) it(`connection enum ${code}`, async () => {
      const { wrapper, columns } = await page(Conn, locale)
      expect(columns.find((c: { key: string }) => c.key === 'type').render({ type: code })).toBe(semantics.conn[code] ?? semantics.unknown(code)); wrapper.unmount()
    })
    for (const code of [0, 1, 2, 3, -1, 99]) it(`file direction ${code}`, async () => {
      const { wrapper, columns } = await page(File, locale)
      expect(columns.find((c: { key: string }) => c.key === 'type').render({ type: code })).toBe(semantics.file[code] ?? semantics.unknown(code)); wrapper.unmount()
    })
    for (const close of [0, 1]) it(`close report ${close}`, async () => {
      const { wrapper, columns } = await page(Conn, locale)
      const vnode = columns.find((c: { key: string }) => c.key === 'status').render({ close_time: close })
      const tag = mount(defineComponent({ render: () => vnode }))
      expect(tag.text()).toBe(close > 0 ? semantics.closed : semantics.open)
      expect(tag.attributes('data-kind')).not.toBe('success'); tag.unmount(); wrapper.unmount()
    })
    it('file operation is not completion evidence', async () => {
      const { wrapper } = await page(File, locale); expect(wrapper.text()).toContain(semantics.note); wrapper.unmount()
    })
  })
}

it('updates audit semantics on mounted pages when switching every supported locale', async () => {
  const conn = await page(Conn, 'zh-CN')
  const file = await page(File, 'zh-CN')
  try {
    for (const { value: locale } of SUPPORTED_LOCALES) {
      setLocale(locale)
      await nextTick()
      const semantics = expected[locale === 'zh-CN' ? 'zh-CN' : 'en']
      const connColumns = conn.wrapper.findComponent({ name: 'NDataTable' }).props('columns')
      const fileColumns = file.wrapper.findComponent({ name: 'NDataTable' }).props('columns')
      expect(connColumns.find((c: { key: string }) => c.key === 'type').render({ type: 99 })).toBe(semantics.unknown(99))
      for (const close of [0, 1]) {
        const vnode = connColumns.find((c: { key: string }) => c.key === 'status').render({ close_time: close })
        const tag = mount(defineComponent({ render: () => vnode }))
        try { expect(tag.text()).toBe(close ? semantics.closed : semantics.open) } finally { tag.unmount() }
      }
      for (const code of [2, 3, 99]) expect(fileColumns.find((c: { key: string }) => c.key === 'type').render({ type: code })).toBe(semantics.unknown(code))
      expect(file.wrapper.text()).toContain(semantics.note)
    }
  } finally { conn.wrapper.unmount(); file.wrapper.unmount() }
})
