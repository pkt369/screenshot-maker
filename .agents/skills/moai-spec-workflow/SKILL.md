---
name: moai-spec-workflow
description: Use when the task needs a MoAI-ADK style SPEC workflow in Codex: translate a request into scope, constraints, acceptance criteria, execution steps, and a resumable checklist before or during implementation.
---

# MoAI Spec Workflow

Use this skill when a request is still underspecified or likely to span multiple steps.

## Output shape

Produce a compact SPEC-like plan with:

- Goal
- Constraints
- Affected files or systems
- Acceptance criteria
- Execution checklist
- Risks or open questions

## Persistence

- Keep the checklist in the plan tool or response by default.
- Only write a `progress.md`, spec file, or other tracking document if the user requests it or the repository already uses one.
- When resuming work, restate completed items and the next unfinished item before editing.

## Workflow

1. Convert the user request into explicit deliverables.
2. Separate discovery, implementation, and verification tasks.
3. Mark assumptions that could cause rework.
4. If the task is large, split it into independently verifiable chunks.
5. After implementation, reconcile the result with the original acceptance criteria and call out deltas.

## Delegation

- Use `moai_spec_manager` to draft or refine the checklist.
- Use `moai_parallelizer` to decide whether the work can be split across independent agents.
- Use `moai_docs_syncer` when the task includes updating progress notes, specs, or technical documentation.
