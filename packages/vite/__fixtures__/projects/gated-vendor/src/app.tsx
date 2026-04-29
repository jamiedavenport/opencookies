// Vendor call wrapped in <ConsentGate> — should NOT be flagged ungated.

export function App() {
  return <ConsentGate category="analytics">{gtag("event", "page_view")}</ConsentGate>;
}
