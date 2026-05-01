import { Component } from "@angular/core";
import { ConsentGate } from "@opencookies/angular";
import { AnalyticsFallbackComponent } from "./components/analytics-fallback.component";
import { BannerComponent } from "./components/banner.component";
import { DebugStripComponent } from "./components/debug-strip.component";
import { FakeChartComponent } from "./components/fake-chart.component";
import { HeaderComponent } from "./components/header.component";
import { PreferencesComponent } from "./components/preferences.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    ConsentGate,
    AnalyticsFallbackComponent,
    BannerComponent,
    DebugStripComponent,
    FakeChartComponent,
    HeaderComponent,
    PreferencesComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 pb-32 text-slate-900">
      <app-header />
      <main class="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <section>
          <h2 class="text-base font-semibold">Welcome</h2>
          <p class="mt-1 text-sm text-slate-600">
            This page demonstrates the OpenCookies Angular adapter: a banner, a preferences modal,
            granular per-category helpers, and a consent-gated section.
          </p>
        </section>
        <section>
          <h2 class="text-base font-semibold">Gated content</h2>
          <div class="mt-2">
            <fake-chart *ocConsent="'analytics'; else fallback" />
            <ng-template #fallback>
              <analytics-fallback />
            </ng-template>
          </div>
        </section>
        <section>
          <h2 class="text-base font-semibold">Debug</h2>
          <div class="mt-2">
            <debug-strip />
          </div>
        </section>
      </main>
      <app-banner />
      <app-preferences />
    </div>
  `,
})
export class AppComponent {}
