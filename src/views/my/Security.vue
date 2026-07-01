<script setup lang="ts">
defineOptions({ name: 'MySecurity' })
import { NSpace } from 'naive-ui'
import EmailVerificationCard from './components/EmailVerificationCard.vue'
import PasskeyList from './components/PasskeyList.vue'
</script>

<template>
  <NSpace vertical :size="16">
    <EmailVerificationCard />
    <PasskeyList />
  </NSpace>
</template>
