---
name: moai-quality-gates
description: Use when finishing implementation, refactoring, or cleanup work and you want a MoAI-ADK style quality pass in Codex: run targeted validation, remove dead code and AI slop, check documentation drift, and surface remaining risks clearly.
---

# MoAI Quality Gates

Use this skill near the end of a task or after a substantial code edit.

## Required checks

1. Run the narrowest meaningful tests, linters, or build checks for the changed area.
2. Inspect the diff for dead code, duplicate logic, unused imports, placeholder comments, and accidental debug leftovers.
3. Check whether docs, config, or examples drifted from the implementation.
4. Report residual risks when validation is partial.

## Review standard

Prioritize:

- correctness regressions
- missing tests
- hidden coupling
- broken developer workflow
- maintainability issues that will cause future bugs

## Delegation

- Use `moai_quality_guard` for a read-only owner-style review.
- Use `moai_docs_syncer` when documentation updates are part of done criteria.

## Boundaries

- Do not run every tool in the repo by default; pick the smallest set that proves the change.
- Do not claim confidence that tests did not earn.
