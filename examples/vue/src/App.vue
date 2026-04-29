<script setup lang="ts">
import { ConsentGate } from "@opencookies/vue";
import AnalyticsFallback from "./components/AnalyticsFallback.vue";
import Banner from "./components/Banner.vue";
import DebugStrip from "./components/DebugStrip.vue";
import FakeChart from "./components/FakeChart.vue";
import Header from "./components/Header.vue";
import Preferences from "./components/Preferences.vue";
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-32 text-slate-900">
    <Header />
    <main class="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <section>
        <h2 class="text-base font-semibold">Welcome</h2>
        <p class="mt-1 text-sm text-slate-600">
          This page demonstrates the OpenCookies Vue adapter: a banner, a preferences modal,
          granular per-category composables, and a consent-gated section.
        </p>
      </section>
      <section>
        <h2 class="text-base font-semibold">Gated content</h2>
        <div class="mt-2">
          <ConsentGate requires="analytics">
            <FakeChart />
            <template #fallback>
              <AnalyticsFallback />
            </template>
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
</template>
