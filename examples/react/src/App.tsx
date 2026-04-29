import { ConsentGate, useCategory, useConsent } from "@opencookies/react";

function Header() {
  const { setRoute } = useConsent();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">OpenCookies + React</h1>
        <button
          type="button"
          onClick={() => setRoute("cookie")}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Cookie settings
        </button>
      </div>
    </header>
  );
}

function Banner() {
  const { route, acceptAll, acceptNecessary, setRoute } = useConsent();
  if (route !== "cookie") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700">
          We use cookies to improve your experience. Choose what you'd like to allow.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRoute("preferences")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Customize
          </button>
          <button
            type="button"
            onClick={acceptNecessary}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Necessary only
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  categoryKey,
  label,
  description,
  locked,
}: {
  categoryKey: string;
  label: string;
  description?: string;
  locked?: boolean;
}) {
  const { granted, toggle } = useCategory(categoryKey);
  return (
    <label className="flex items-start justify-between gap-4 rounded-md border border-slate-200 px-4 py-3">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        {description ? <span className="text-xs text-slate-500">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={granted}
        disabled={locked}
        onChange={toggle}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 disabled:opacity-50"
      />
    </label>
  );
}

function Preferences() {
  const { route, categories, save, setRoute } = useConsent();
  if (route !== "preferences") return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">Cookie preferences</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose which categories of cookies to allow. Essential cookies are always on.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {categories.map((c) => (
            <CategoryRow
              key={c.key}
              categoryKey={c.key}
              label={c.label}
              description={c.description}
              locked={c.locked}
            />
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRoute("cookie")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function FakeChart() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
      <h3 className="text-sm font-semibold text-emerald-900">Analytics chart</h3>
      <p className="mt-1 text-xs text-emerald-800">
        (Placeholder for an analytics-powered chart that loads only after consent.)
      </p>
      <div className="mt-4 flex h-24 items-end gap-2">
        {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className="w-full rounded-t bg-emerald-500/70"
          />
        ))}
      </div>
    </div>
  );
}

function AnalyticsFallback() {
  const { toggle, save } = useConsent();
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
      <h3 className="text-sm font-semibold text-slate-900">Analytics chart hidden</h3>
      <p className="mt-1 text-xs text-slate-600">Enable analytics cookies to see this chart.</p>
      <button
        type="button"
        onClick={() => {
          toggle("analytics");
          save();
        }}
        className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        Enable analytics
      </button>
    </div>
  );
}

function DebugStrip() {
  const { route, decisions, decidedAt } = useConsent();
  return (
    <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
      {JSON.stringify({ route, decisions, decidedAt }, null, 2)}
    </pre>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32 text-slate-900">
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <section>
          <h2 className="text-base font-semibold">Welcome</h2>
          <p className="mt-1 text-sm text-slate-600">
            This page demonstrates the OpenCookies React adapter: a banner, a preferences modal,
            granular per-category hooks, and a consent-gated section.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold">Gated content</h2>
          <div className="mt-2">
            <ConsentGate requires="analytics" fallback={<AnalyticsFallback />}>
              <FakeChart />
            </ConsentGate>
          </div>
        </section>
        <section>
          <h2 className="text-base font-semibold">Debug</h2>
          <div className="mt-2">
            <DebugStrip />
          </div>
        </section>
      </main>
      <Banner />
      <Preferences />
    </div>
  );
}
