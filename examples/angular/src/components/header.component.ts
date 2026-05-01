import { Component, inject } from "@angular/core";
import { ConsentService } from "@opencookies/angular";

@Component({
  selector: "app-header",
  standalone: true,
  template: `
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <h1 class="text-lg font-semibold text-slate-900">OpenCookies + Angular</h1>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          (click)="consent.setRoute('cookie')"
        >
          Cookie settings
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly consent = inject(ConsentService);
}
