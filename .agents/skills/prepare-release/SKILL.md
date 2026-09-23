---
name: prepare-release
description: Prepare application releases including version bumping, commit changelog aggregation, store listing updates, prepush validation, and desktop Windows MSIX packaging for Microsoft Store submissions.
---

# Application Release Pipeline

Use this skill whenever preparing a new release, updating the Microsoft Store listing, bumping the app version, or generating production desktop bundles.

## Operating Boundary & Safety Invariants

- **Autonomous Actions**: Version bumping, changelog synthesis, documentation updates, prepush validation, and local MSIX build execution.
- **User-Exclusive Actions**: Never autonomously execute `git commit` or `git push`. Always propose the exact formatted commit command for the user to review and run. The user also handles uploading the final package to Microsoft Partner Center.

## Release Pipeline Execution Steps

- **Step A: Git History & Scope Inspection**:
  - Locate the previous release commit or tag: `git log --grep="^release v" -n 1 --oneline`.
  - Read all commits since that release: `git log <prev-release-hash>..HEAD --oneline`.
  - Classify changes into user-facing features, bug fixes, performance improvements, and architectural updates.

- **Step B: Bump Version Across Monorepo**:
  - Determine semver increment (`patch`, `minor`, or `major`; defaults to `patch` unless breaking/major changes are present).
  - Execute: `pnpm version:bump <patch|minor|major>`.
  - Verify that `package.json`, `core/package.json`, `desktop/package.json`, `mobile/package.json`, `desktop/src-tauri/tauri.conf.json`, and `desktop/src-tauri/Cargo.toml` are bumped synchronously.

- **Step C: Update Store Listing & Documentation**:
  - View [docs/store_listing.md](file:///d:/program/Campfire/docs/store_listing.md) in full.
  - Retain the exact existing listing format: simple plain text, no emojis, no icons, no complex markdown syntax.
  - Ground All Feature Claims in Code: Proactively inspect actual source constants, asset directories, and UI configurations (e.g. check core types or public assets) before writing descriptions, to ensure zero hallucinated feature claims.
  - Update version header and notes for release process to the new version.
  - Write concise bullets under **What's new in vX.Y.Z** summarizing all changes found in Step A.
  - Refresh the **Product features** list if new major capabilities were introduced.

- **Step D: Run Prepush Validation**:
  - Execute `pnpm prepush` from the repository root.
  - Ensure all checks pass: unit tests, workspace typecheck, i18n key consistency, oxlint, cargo check, and production web builds.
  - If any check fails, resolve the root cause before proceeding.

- **Step E: Build & Validate Desktop Windows Package**:
  - Execute: `pnpm --filter desktop tauri:windows:build`.
  - This compiles the Rust release binary, generates the MSIX bundle, signs it via `sign-msix.js`, and runs the Windows App Certification Kit (WACK) validation.
  - Verify the resulting MSIX file exists in:
    `desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msix/`

- **Step F: Prepare Git Handoff & Store Listing Copy**:
  - Stage changed files: `git add .` (do NOT run git commit or git push).
  - Propose the exact release commit command:
    `git commit -m "release vX.Y.Z: <scope>: <concise summary>"`
    `git push`
  - Output copy-paste ready text blocks for Microsoft Partner Center:
    - **What's new in this version**: clean formatted text matching store_listing.md format.
    - **Product features**: bullet list.
    - **Package location**: absolute path to the `.msix` file for upload in Partner Center Packages tab.
