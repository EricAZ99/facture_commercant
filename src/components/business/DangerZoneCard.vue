<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'

const emit = defineEmits<{
  deleteAccount: []
}>()
</script>

<template>
  <div class="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">
    <div class="flex items-start gap-3">
      <AlertTriangle class="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
      <div class="flex-1">
        <h2 class="text-sm font-semibold text-red-900">{{ $t('settingsDangerZone.title') }}</h2>
        <p class="mt-1 text-sm text-red-700">
          {{ $t('settingsDangerZone.deleteBusinessWarning') }}
        </p>
        <BaseButton variant="danger" size="sm" class="mt-3" @click="emit('deleteAccount')">
          {{ $t('settings.deleteMyAccountTitle') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
