import { Component, Input, computed, inject } from "@angular/core";
import { ConsentService } from "@opencookies/angular";

@Component({
  selector: "category-row",
  standalone: true,
  template: `
    <label
      class="flex items-start justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
    >
      <span class="flex flex-col">
        <span class="text-sm font-medium text-slate-900">{{ label }}</span>
        @if (description) {
          <span class="text-xs text-slate-500">{{ description }}</span>
        }
      </span>
      <input
        type="checkbox"
        class="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
        [checked]="granted()"
        [disabled]="!!locked"
        (change)="consent.toggle(categoryKey)"
      />
    </label>
  `,
})
export class CategoryRowComponent {
  @Input({ required: true }) categoryKey!: string;
  @Input({ required: true }) label!: string;
  @Input() description?: string;
  @Input() locked?: boolean;

  readonly consent = inject(ConsentService);
  readonly granted = computed(() => this.consent.decisions()[this.categoryKey] === true);
}
