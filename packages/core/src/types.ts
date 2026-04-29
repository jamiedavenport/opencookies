export type Route = "cookie" | "preferences" | "closed";

export type Category = {
  key: string;
  label: string;
  locked?: boolean;
  description?: string;
};

export type Jurisdiction = {
  region: string;
};

export type ConsentExpr =
  | string
  | { and: ConsentExpr[] }
  | { or: ConsentExpr[] }
  | { not: ConsentExpr };

export type UnknownCategoryBehavior = "throw" | "warn" | "silent";

export type EvaluateOptions = {
  onUnknownCategory?: UnknownCategoryBehavior;
};

export type ConsentState = {
  route: Route;
  categories: Category[];
  decisions: Record<string, boolean>;
  jurisdiction: Jurisdiction | null;
  policyVersion: string;
  decidedAt: string | null;
};

export type OpenCookiesConfig = {
  categories: Category[];
  policyVersion?: string;
  initialRoute?: Route;
  onUnknownCategory?: UnknownCategoryBehavior;
};

export type ConsentStore = {
  getState(): ConsentState;
  subscribe(listener: (state: ConsentState) => void): () => void;
  acceptAll(): void;
  acceptNecessary(): void;
  reject(): void;
  toggle(category: string): void;
  save(): void;
  setRoute(route: Route): void;
  has(expr: ConsentExpr): boolean;
};
