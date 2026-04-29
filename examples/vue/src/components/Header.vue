<script setup lang="ts">
import { useConsent } from "@opencookies/vue";

const { setRoute } = useConsent();
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
      <h1 class="text-lg font-semibold text-slate-900">OpenCookies + Vue</h1>
      <button
        type="button"
        class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        @click="setRoute('cookie')"
      >
        Cookie settings
      </button>
    </div>
  </header>
</template>
