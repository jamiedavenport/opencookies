import { For } from "solid-js";

const bars = [40, 65, 30, 80, 55, 70, 45];

export default function FakeChart() {
  return (
    <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
      <h3 class="text-sm font-semibold text-emerald-900">Analytics chart</h3>
      <p class="mt-1 text-xs text-emerald-800">
        (Placeholder for an analytics-powered chart that loads only after consent.)
      </p>
      <div class="mt-4 flex h-24 items-end gap-2">
        <For each={bars}>
          {(h) => <span style={{ height: `${h}%` }} class="w-full rounded-t bg-emerald-500/70" />}
        </For>
      </div>
    </div>
  );
}
