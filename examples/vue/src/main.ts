import type { Category } from "@opencookies/core";
import { localStorageAdapter } from "@opencookies/core/storage/local-storage";
import { OpenCookiesPlugin } from "@opencookies/vue";
import { createApp } from "vue";
import App from "./App.vue";
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
  { key: "marketing", label: "Marketing", description: "Used to personalize ads and campaigns." },
];

createApp(App)
  .use(OpenCookiesPlugin, { config: { categories, adapter: localStorageAdapter() } })
  .mount("#app");
