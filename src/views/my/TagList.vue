<script setup lang="ts">
defineOptions({ name: 'MyTagList' })
import { NCard, NH2, NText } from 'naive-ui'
</script>

<template>
  <NCard>
    <NH2>{{ $t('menu.MyTagList') }}</NH2>
    <NText depth="3">{{ $t('common.loading') }}</NText>
  </NCard>
</template>
