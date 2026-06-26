<script setup lang="ts">
import { NEmpty } from 'naive-ui'
defineProps<{
  description?: string
}>()
</script>

<template>
  <NEmpty :description="description || $t('common.noData')" />
</template>
