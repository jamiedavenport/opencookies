export type Route = "cookie" | "preferences" | "closed";

export type Category = {
  key: string;
  label: string;
  locked?: boolean;
  description?: string;
  respectGPC?: boolean;
};

export type ConsentSource = "default" | "user" | "gpc";

export type GPCConfig = {
  enabled?: boolean;
  applicableJurisdictions?: Jurisdiction[] | "all";
  signal?: boolean;
};

export type Jurisdiction = "EEA" | "UK" | "CH" | "US" | `US-${string}` | "BR" | "CA" | "AU" | "ROW";

export type ResolverContext = Request | { headers: Headers };

export type JurisdictionResolver = {
  resolve(req?: ResolverContext): Promise<Jurisdiction | null> | Jurisdiction | null;
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
  source: ConsentSource;
};

export type ConsentRecord = {
  decisions: Record<string, boolean>;
  jurisdiction: Jurisdiction | null;
  policyVersion: string;
  decidedAt: string | null;
  source: ConsentSource;
};

export type StorageAdapter = {
  read(): Promise<ConsentRecord | null> | ConsentRecord | null;
  write(record: ConsentRecord): Promise<void> | void;
  clear(): Promise<void> | void;
  subscribe?(listener: (record: ConsentRecord | null) => void): () => void;
};

export type OpenCookiesConfig = {
  categories: Category[];
  policyVersion?: string;
  initialRoute?: Route;
  onUnknownCategory?: UnknownCategoryBehavior;
  jurisdictionResolver?: JurisdictionResolver;
  request?: ResolverContext;
  gpc?: GPCConfig;
  adapter?: StorageAdapter;
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
  refreshJurisdiction(req?: ResolverContext): Promise<Jurisdiction | null>;
};

export type ScriptDefinition = {
  id: string;
  requires: ConsentExpr;
  src?: string;
  attrs?: Record<string, string>;
  init?: () => void;
  queue?: string[];
};

export type ScriptEvent =
  | { type: "script:loaded"; id: string }
  | { type: "script:queued"; id: string; path: string; args: unknown[] }
  | { type: "script:gated"; id: string };

export type GateOptions = {
  document?: Document;
  window?: Window & Record<string, unknown>;
  onEvent?: (event: ScriptEvent) => void;
};
