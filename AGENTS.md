# AGENTS.md

## Mandatory TDD

Use red-green-refactor TDD for every behavior or flow change. Write and run the
smallest executable contract test first; it must fail for the intended reason
before implementation begins. Then implement the minimum change and make
focused, integration and affected end-to-end tests green. Begin every new or
modified test suite with a flow-contract comment. Begin every Playwright or
other E2E file with the complete numbered journey and its authorization and
persistence invariants. Mocks may isolate units but never replace real boundary
proof. Never make a test green by accepting an incomplete terminal state.

All Node/npm gates follow the repository
[`preserve-workspace-node-runtime` skill](.codex/skills/preserve-workspace-node-runtime/SKILL.md),
which is compatible with the canonical workspace Node.js 26.13.0 contract.
