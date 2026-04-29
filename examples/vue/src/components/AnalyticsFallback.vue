<script setup lang="ts">
import { useConsent } from "@opencookies/vue";

const { toggle, save } = useConsent();

function enableAnalytics() {
  toggle("analytics");
  save();
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-6">
    <h3 class="text-sm font-semibold text-slate-900">Analytics chart hidden</h3>
    <p class="mt-1 text-xs text-slate-600">Enable analytics cookies to see this chart.</p>
    <button
      type="button"
      class="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
      @click="enableAnalytics"
    >
      Enable analytics
    </button>
  </div>
</template>
