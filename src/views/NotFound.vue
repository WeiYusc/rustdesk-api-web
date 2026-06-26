<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex-center">
    <NResult status="404" title="404" :description="$t('common.notFound')">
      <template #footer>
        <NButton type="primary" @click="router.push('/')">{{ $t('common.backHome') }}</NButton>
      </template>
    </NResult>
  </div>
</template>
