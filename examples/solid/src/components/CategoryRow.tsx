import { useCategory } from "@opencookies/solid";

type Props = {
  categoryKey: string;
  label: string;
  description?: string;
  locked?: boolean;
};

export default function CategoryRow(props: Props) {
  const category = useCategory(props.categoryKey);
  return (
    <label class="flex items-start justify-between gap-4 rounded-md border border-slate-200 px-4 py-3">
      <span class="flex flex-col">
        <span class="text-sm font-medium text-slate-900">{props.label}</span>
        {props.description ? <span class="text-xs text-slate-500">{props.description}</span> : null}
      </span>
      <input
        type="checkbox"
        class="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
        checked={category.granted()}
        disabled={props.locked}
        onChange={category.toggle}
      />
    </label>
  );
}
