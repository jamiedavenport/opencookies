<script setup lang="ts">
import { useConsent } from "@opencookies/vue";
import { computed } from "vue";

const { route, decisions, decidedAt } = useConsent();

const snapshot = computed(() =>
  JSON.stringify(
    { route: route.value, decisions: decisions.value, decidedAt: decidedAt.value },
    null,
    2,
  ),
);
</script>

<template>
  <pre class="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">{{
    snapshot
  }}</pre>
</template>
