import { ConsentGate } from "@opencookies/solid";
import AnalyticsFallback from "./components/AnalyticsFallback.tsx";
import Banner from "./components/Banner.tsx";
import DebugStrip from "./components/DebugStrip.tsx";
import FakeChart from "./components/FakeChart.tsx";
import Header from "./components/Header.tsx";
import Preferences from "./components/Preferences.tsx";

export default function App() {
  return (
    <div class="min-h-screen bg-slate-50 pb-32 text-slate-900">
      <Header />
      <main class="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <section>
          <h2 class="text-base font-semibold">Welcome</h2>
          <p class="mt-1 text-sm text-slate-600">
            This page demonstrates the OpenCookies Solid adapter: a banner, a preferences modal,
            granular per-category accessors, and a consent-gated section.
          </p>
        </section>
        <section>
          <h2 class="text-base font-semibold">Gated content</h2>
          <div class="mt-2">
            <ConsentGate requires="analytics" fallback={<AnalyticsFallback />}>
              <FakeChart />
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
  );
}
