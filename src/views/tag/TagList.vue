<script setup lang="ts">
defineOptions({ name: 'UserTag' })
import { NCard, NH2, NText } from 'naive-ui'
</script>

<template>
  <NCard>
    <NH2>{{ $t('menu.UserTag') }}</NH2>
    <NText depth="3">{{ $t('common.loading') }}</NText>
  </NCard>
</template>
