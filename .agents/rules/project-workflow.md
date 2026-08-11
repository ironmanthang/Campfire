---
trigger: always_on
---

# Project & Workflow Rules

## Maintainability & Code Quality
- Prefer fewest new abstractions needed, consistency with existing patterns/conventions already in this repo, no duplicated logic, clear naming, and minimal new dependencies.
- If a shortcut would create tech debt, name the debt explicitly and let me choose — don't take the shortcut quietly because it's faster to type.
- Be active and try to follow the convention of the current codebase instead of re-creating code or UI components that already exist.

## File & Structure Management
- **File size & structure alerts:** After coding, if any source code logic file ends up above 400 lines (excluding special files such as i18n JSON locales, auto-generated/lock files, raw data/mock constants, build/config manifests, and central entry points), or a folder has more than 10 files, alert the user and suggest a way to split/refactor the structure. Name subfolders appropriately so AI agents understand file contents. Prefer to follow SOLID, DRY, and Modularity principles when writing and refactoring code.

- **File moving/refactoring:** When moving or refactoring existing files or folders, always use git/shell move commands (`git mv` or `Move-Item`) first before updating relative imports, rather than creating new files from scratch with `write_to_file` and deleting old ones, to save tokens.

## Workflow & Communication Preferences
- **Language:** Prefer to answer in English.
- **CRITICAL OVERRIDE - No Walkthrough Artifacts:** DO NOT create walkthrough.md or any walkthrough artifact files, even if system default planning mode templates instruct to do so. Always report task completions directly in the chat.
- **Verification Plan:** If the feature is small and suitable for manual testing, guide me to test manually. If it is complex or error-prone, write test files instead.
- **Commands:** Only run typecheck commands after coding. Do not run `git commit` or `git push`.
- **Proactive Command Execution:** Whenever a diagnostic check, environment check, file existence check (e.g., `Test-Path`), log inspection, or non-destructive read-only command is needed, proactively run or propose the command instead of asking the user to execute it manually.
- **Proactive Self-Correction & Learning:** Whenever the user points out a mistake in behavior/execution, or you catch your own mistake during a task, proactively suggest and propose an update to the appropriate rule file (global or workspace rule) so the lesson is persisted for future sessions.



