<script setup lang="ts">
import { reactive, watch } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import { PERMISSION_GROUPS, PERMISSION_LABELS, ROLE_PERMISSIONS } from '@/constants'
import type { Permission, User } from '@/types'

interface Props {
  user: User
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), { submitting: false })

const emit = defineEmits<{
  submit: [permissions: Permission[]]
  cancel: []
}>()

const selected = reactive(new Set<Permission>(props.user.permissions))

watch(
  () => props.user.id,
  () => {
    selected.clear()
    props.user.permissions.forEach((p) => selected.add(p))
  }
)

function toggle(permission: Permission): void {
  if (selected.has(permission)) {
    selected.delete(permission)
  } else {
    selected.add(permission)
  }
}

/** Reinitialise la selection au jeu de permissions par defaut du role actuel de l'utilisateur. */
function resetToRoleDefaults(): void {
  selected.clear()
  ;(ROLE_PERMISSIONS[props.user.role] || []).forEach((p) => selected.add(p))
}

function onSubmit(): void {
  emit('submit', Array.from(selected))
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-gray-500">
      {{ $t('users.permissions.intro', { name: `${user.firstName} ${user.lastName}` }) }}
    </p>

    <div class="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
      <div v-for="group in PERMISSION_GROUPS" :key="group.label">
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {{ group.label }}
        </p>
        <div class="flex flex-col gap-1.5">
          <label
            v-for="permission in group.permissions"
            :key="permission"
            class="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              :checked="selected.has(permission)"
              class="focus-ring size-4 rounded border-gray-300"
              @change="toggle(permission)"
            />
            {{ PERMISSION_LABELS[permission] }}
          </label>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-gray-100 pt-4">
      <button
        type="button"
        class="focus-ring rounded text-sm font-medium text-primary-600 hover:text-primary-700"
        @click="resetToRoleDefaults"
      >
        {{ $t('users.permissions.resetToRoleDefaults') }}
      </button>
      <div class="flex gap-2">
        <BaseButton variant="outline" :disabled="submitting" @click="emit('cancel')">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton :loading="submitting" @click="onSubmit">{{ $t('common.save') }}</BaseButton>
      </div>
    </div>
  </div>
</template>
