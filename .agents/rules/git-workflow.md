---
trigger: always_on
---

# Git & Release Workflow Rules

Apply these rules to all Git operations, version bumps, release commits, and repository history management.

## Release Commits & Changelog Aggregation
- **Comprehensive Release Summaries**: A release commit (`release vX.Y.Z: ...`) or release note must summarize **all** user-facing changes, bug fixes, and architectural modifications since the previous release — never just the single most recent commit.
- **Git Range Inspection**: Before crafting a release commit message, inspect the Git history since the last release tag/commit (`git log <prev-release>..HEAD --oneline`) to ensure no merged features or fixes are omitted.
- **Release Sequence Integrity**:
  - Step 1: Bump version across manifests (`pnpm version:bump <patch|minor|major>`).
  - Step 2: Build and verify production bundles (e.g., `pnpm --filter desktop tauri:windows:build`).
  - Step 3: Propose comprehensive release commit (`git commit -m "release vX.Y.Z: <scope>: <summary>"`) and push.

## Git Command Guardrails
- **Autonomous Command Boundary**: Only run non-destructive, read-only diagnostic Git commands autonomously (e.g., `git status`, `git log`, `git diff`).
- **Never Run Commit or Push**: Never autonomously execute `git commit` or `git push`. Always propose the exact formatted command for the user to review and run.
- **Destructive Command Ban**: Never run destructive Git commands (`git reset --hard`, `git clean -fd`, `git checkout .`, `git restore .`) without explicit user instruction.

## File Moving & History Preservation
- **Preserve Git History**: When moving or refactoring existing files or folders, always use `git mv` (or `Move-Item`) first before updating import statements, rather than deleting and recreating files with `write_to_file`. This preserves history and saves context tokens.
