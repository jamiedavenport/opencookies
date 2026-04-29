import { useConsent } from "@opencookies/solid";

export default function DebugStrip() {
  const { route, decisions, decidedAt } = useConsent();
  const snapshot = () =>
    JSON.stringify({ route: route(), decisions: decisions(), decidedAt: decidedAt() }, null, 2);
  return (
    <pre class="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
      {snapshot()}
    </pre>
  );
}
