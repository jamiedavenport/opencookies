import { Component } from "@angular/core";

@Component({
  selector: "fake-chart",
  standalone: true,
  template: `
    <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
      <h3 class="text-sm font-semibold text-emerald-900">Analytics chart</h3>
      <p class="mt-1 text-xs text-emerald-800">
        (Placeholder for an analytics-powered chart that loads only after consent.)
      </p>
      <div class="mt-4 flex h-24 items-end gap-2">
        @for (h of bars; track $index) {
          <span [style.height.%]="h" class="w-full rounded-t bg-emerald-500/70"></span>
        }
      </div>
    </div>
  `,
})
export class FakeChartComponent {
  readonly bars = [40, 65, 30, 80, 55, 70, 45];
}
