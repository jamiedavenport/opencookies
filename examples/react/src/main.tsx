import { OpenCookiesProvider } from "@opencookies/react";
import type { Category } from "@opencookies/core";
import { localStorageAdapter } from "@opencookies/core/storage/local-storage";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";

const categories: Category[] = [
  {
    key: "essential",
    label: "Essential",
    locked: true,
    description: "Required for the site to work.",
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Helps us understand how the site is used.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Used to personalize ads and campaigns.",
  },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OpenCookiesProvider config={{ categories, adapter: localStorageAdapter() }}>
      <App />
    </OpenCookiesProvider>
  </StrictMode>,
);
