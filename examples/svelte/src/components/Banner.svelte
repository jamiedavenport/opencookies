<script lang="ts">
  import { getConsent } from "@opencookies/svelte";

  const consent = getConsent();
</script>

{#if consent.route === "cookie"}
  <div class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white shadow-lg">
    <div
      class="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm text-slate-700">
        We use cookies to improve your experience. Choose what you'd like to allow.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          onclick={() => consent.setRoute("preferences")}
        >
          Customize
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          onclick={consent.acceptNecessary}
        >
          Necessary only
        </button>
        <button
          type="button"
          class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          onclick={consent.acceptAll}
        >
          Accept all
        </button>
      </div>
    </div>
  </div>
{/if}
