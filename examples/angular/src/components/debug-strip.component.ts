import { Component, computed, inject } from "@angular/core";
import { ConsentService } from "@opencookies/angular";

@Component({
  selector: "debug-strip",
  standalone: true,
  template: `<pre class="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">{{
    snapshot()
  }}</pre>`,
})
export class DebugStripComponent {
  private readonly consent = inject(ConsentService);
  readonly snapshot = computed(() =>
    JSON.stringify(
      {
        route: this.consent.route(),
        decisions: this.consent.decisions(),
        decidedAt: this.consent.decidedAt(),
      },
      null,
      2,
    ),
  );
}
