export type Target = {
  name: string;
  repo: string;
  sha: string;
  cleanFiles: string[];
};

export const targets: Target[] = [
  {
    name: "cal.com",
    repo: "calcom/cal.com",
    sha: "v4.6.6",
    cleanFiles: ["packages/ui/components/icon/Icon.tsx", "packages/lib/safeStringify.ts"],
  },
  {
    name: "documenso",
    repo: "documenso/documenso",
    sha: "v1.10.0",
    cleanFiles: ["packages/lib/utils/teams.ts", "packages/ui/primitives/card.tsx"],
  },
];
