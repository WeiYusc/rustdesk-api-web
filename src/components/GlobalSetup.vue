<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { onMounted } from 'vue'
import { registerErrorHandler } from '@/utils/request'

const message = useMessage()

onMounted(() => {
  registerErrorHandler({ error: (msg) => message.error(msg) })
})
</script>

<template>
  <slot />
</template>
