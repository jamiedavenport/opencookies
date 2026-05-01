import "zone.js";

import { bootstrapApplication } from "@angular/platform-browser";
import type { Category } from "@opencookies/core";
import { localStorageAdapter } from "@opencookies/core/storage/local-storage";
import { provideOpenCookies } from "@opencookies/angular";
import { AppComponent } from "./app.component";
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

bootstrapApplication(AppComponent, {
  providers: [provideOpenCookies({ config: { categories, adapter: localStorageAdapter() } })],
}).catch((err) => {
  console.error(err);
});
