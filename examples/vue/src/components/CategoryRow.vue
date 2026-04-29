<script setup lang="ts">
import { useCategory } from "@opencookies/vue";

const props = defineProps<{
  categoryKey: string;
  label: string;
  description?: string;
  locked?: boolean;
}>();

const { granted, toggle } = useCategory(props.categoryKey);
</script>

<template>
  <label
    class="flex items-start justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
  >
    <span class="flex flex-col">
      <span class="text-sm font-medium text-slate-900">{{ label }}</span>
      <span v-if="description" class="text-xs text-slate-500">{{ description }}</span>
    </span>
    <input
      type="checkbox"
      class="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
      :checked="granted"
      :disabled="locked"
      @change="toggle"
    />
  </label>
</template>
