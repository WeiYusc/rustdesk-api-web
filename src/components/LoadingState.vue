<script setup lang="ts">
import { NSpin, NText } from 'naive-ui'
defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="flex-center" style="padding: 40px; flex-direction: column; gap: 12px">
    <NSpin size="medium" />
    <NText depth="3">{{ text || $t('common.loading') }}</NText>
  </div>
</template>
