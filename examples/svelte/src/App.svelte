<script lang="ts">
  import type { Category } from "@opencookies/core";
  import { localStorageAdapter } from "@opencookies/core/storage/local-storage";
  import { ConsentGate, setOpenCookiesContext } from "@opencookies/svelte";
  import AnalyticsFallback from "./components/AnalyticsFallback.svelte";
  import Banner from "./components/Banner.svelte";
  import DebugStrip from "./components/DebugStrip.svelte";
  import FakeChart from "./components/FakeChart.svelte";
  import Header from "./components/Header.svelte";
  import Preferences from "./components/Preferences.svelte";

  const categories: Category[] = [
    {
      key: "essential",
      label: "Essential",
      locked: true,
      description: "Required for the site to work.",
    },
    {
      key: "analytics",
      label: "Analytics",
      description: "Helps us understand how the site is used.",
    },
    {
      key: "marketing",
      label: "Marketing",
      description: "Used to personalize ads and campaigns.",
    },
  ];

  setOpenCookiesContext({ config: { categories, adapter: localStorageAdapter() } });
</script>

<div class="min-h-screen bg-slate-50 pb-32 text-slate-900">
  <Header />
  <main class="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
    <section>
      <h2 class="text-base font-semibold">Welcome</h2>
      <p class="mt-1 text-sm text-slate-600">
        This page demonstrates the OpenCookies Svelte adapter: a banner, a preferences modal,
        granular per-category runes, and a consent-gated section.
      </p>
    </section>
    <section>
      <h2 class="text-base font-semibold">Gated content</h2>
      <div class="mt-2">
        <ConsentGate requires="analytics">
          {#snippet children()}
            <FakeChart />
          {/snippet}
          {#snippet fallback()}
            <AnalyticsFallback />
          {/snippet}
        </ConsentGate>
      </div>
    </section>
    <section>
      <h2 class="text-base font-semibold">Debug</h2>
      <div class="mt-2">
        <DebugStrip />
      </div>
    </section>
  </main>
  <Banner />
  <Preferences />
</div>
