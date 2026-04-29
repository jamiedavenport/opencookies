// Ambient declarations so fixture files type-check without installing real SDKs.

declare module "posthog-js" {
  const posthog: {
    init(key: string, opts?: Record<string, unknown>): void;
    capture(event: string, props?: unknown): void;
  };
  export default posthog;
}

declare const gtag: (...args: unknown[]) => void;
declare const ConsentGate: (props: Record<string, unknown>) => unknown;

declare namespace JSX {
  type Element = unknown;
  type IntrinsicElements = Record<string, Record<string, unknown>>;
}
