<script lang="ts">
  import { getConsent } from "@opencookies/svelte";

  const consent = getConsent();

  const snapshot = $derived(
    JSON.stringify(
      { route: consent.route, decisions: consent.decisions, decidedAt: consent.decidedAt },
      null,
      2,
    ),
  );
</script>

<pre class="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">{snapshot}</pre>
