<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  size: 'md'
})

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10'
}
</script>

<template>
  <Loader2 class="animate-spin text-primary-600" :class="sizeClasses[size]" aria-hidden="true" />
</template>
