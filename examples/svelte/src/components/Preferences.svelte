<script lang="ts">
  import { getConsent } from "@opencookies/svelte";
  import CategoryRow from "./CategoryRow.svelte";

  const consent = getConsent();
</script>

{#if consent.route === "preferences"}
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 class="text-base font-semibold text-slate-900">Cookie preferences</h2>
      <p class="mt-1 text-sm text-slate-600">
        Choose which categories of cookies to allow. Essential cookies are always on.
      </p>
      <div class="mt-4 flex flex-col gap-2">
        {#each consent.categories as c (c.key)}
          <CategoryRow
            categoryKey={c.key}
            label={c.label}
            description={c.description}
            locked={c.locked}
          />
        {/each}
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          onclick={() => consent.setRoute("cookie")}
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          onclick={consent.save}
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}
