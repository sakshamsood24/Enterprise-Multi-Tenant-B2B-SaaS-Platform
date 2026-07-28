# Automation Policy

This repository includes a conservative GitHub Actions maintenance workflow.

## What the workflow can do

`.github/workflows/auto-maintenance.yml` runs weekly and on manual dispatch. It can:

- install dependencies with `npm ci`
- run ESLint with `--fix`
- verify `npm run typecheck`
- verify `npm run build`
- commit and push only if those deterministic fixes changed files

This is intentionally narrow. It is safe for formatting and lint-level maintenance, but it should not invent product behavior, rewrite architecture, or change security policy by itself.

## What requires a human or Codex review

Use a normal Codex task or pull request review for:

- database schema changes
- RLS policy changes
- authentication, RBAC, or subscription-gating changes
- dependency upgrades that alter runtime behavior
- UI or product decisions

## Suggested Codex operating rule

If Codex is asked to make autonomous improvements, it should:

1. inspect the current repository state
2. make only scoped, explainable changes
3. run `npm run typecheck`, `npm run lint`, and `npm run build`
4. commit with a clear message
5. push only after the checks pass

That keeps the repo improving without turning automation into a mystery machine.
