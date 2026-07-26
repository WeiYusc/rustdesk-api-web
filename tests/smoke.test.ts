import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'

import { detectPlatform } from '@/utils/platform'

describe('frontend unit test infrastructure', () => {
  it('resolves the source alias and mounts Vue components in jsdom', () => {
    const SmokeComponent = defineComponent({
      template: '<p data-test="platform">{{ platform }}</p>',
      setup: () => ({ platform: detectPlatform() }),
    })

    const wrapper = mount(SmokeComponent)

    expect(document.documentElement).toBeInstanceOf(HTMLElement)
    expect(wrapper.get('[data-test="platform"]').text()).toBe('web')
  })
})
