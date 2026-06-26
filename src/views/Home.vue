<script setup lang="ts">
import { NCard, NButton, NSpace, NH1, NText } from 'naive-ui'
</script>

<template>
  <div class="min-h-screen flex-center bg-gray-50 dark:bg-gray-900 p-6">
    <NCard class="max-w-md w-full text-center" :bordered="false">
      <NH1>RustDesk API Web</NH1>
      <NText depth="3">Vue3 + TypeScript + Naive UI</NText>
      <NSpace justify="center" class="mt-6">
        <NButton type="primary">{{ $t('common.welcome') }}</NButton>
      </NSpace>
    </NCard>
  </div>
</template>
