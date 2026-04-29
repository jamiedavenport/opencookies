// Inline gtag global call, ungated.

export function Layout() {
  gtag("event", "page_view");
  return null;
}
