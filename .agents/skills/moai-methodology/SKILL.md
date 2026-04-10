---
name: moai-methodology
description: Use when the user wants a MoAI-ADK style delivery workflow in Codex: choose TDD for new work or testable codebases, choose DDD for fragile brownfield code with little coverage, enforce explicit RED/GREEN/REFACTOR or ANALYZE/PRESERVE/IMPROVE checkpoints, and avoid coding before mapping context and risks.
---

# MoAI Methodology

Use this skill to adapt the MoAI-ADK workflow to Codex without copying Claude-specific commands.

## Core policy

Start by understanding the current code and test surface before changing files.

Choose the development mode:

- TDD when the task is a new feature, a new module, or the codebase already has enough tests to safely add failing tests first.
- DDD when the task touches brownfield code with weak coverage, undocumented behavior, or risky legacy coupling.

## Execution flow

1. Map the affected architecture, entry points, dependencies, and existing tests.
2. Write a short execution checklist with acceptance criteria and risks.
3. Follow the selected loop:

TDD:
- RED: add or identify a failing test that expresses the desired behavior.
- GREEN: implement the minimum change that makes the test pass.
- REFACTOR: improve naming, duplication, structure, and clarity while keeping tests green.

DDD:
- ANALYZE: inspect current behavior, data flow, side effects, and compatibility constraints.
- PRESERVE: add characterization tests, snapshots, or fixtures that lock current behavior before refactoring.
- IMPROVE: make incremental changes behind the preserved behavior and rerun validations often.

4. Finish with a quality sweep for dead code, unused imports, duplicated logic, brittle comments, and missing verification.

## Delegation

When subagents help, use them in this order:

- `moai_code_mapper` for architecture and test-surface discovery.
- `moai_spec_manager` for a SPEC-like checklist and acceptance criteria.
- `moai_tdd_guard` to challenge whether TDD or DDD is the safer mode.
- `moai_quality_guard` after edits for regressions and quality gaps.

## Boundaries

- Do not create standalone methodology documents unless the user asks or the repository already uses them.
- Keep artifacts lightweight: checklist in the reply, plan tool, or an existing progress file.
- Prefer concrete validation over ceremony.
