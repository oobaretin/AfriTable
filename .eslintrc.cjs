/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  ignorePatterns: [".next/", "out/", "build/", "next-env.d.ts"],
  rules: {
    // Pragmatic for MVP: replace `any` with proper types iteratively without blocking production builds.
    "@typescript-eslint/no-explicit-any": "off",
  },
};

