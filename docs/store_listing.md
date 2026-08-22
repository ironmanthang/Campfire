# Store listing copy for v0.1.9

Use this file as the canonical copy to paste into Microsoft Partner Center for the v0.1.9 release.

**Description**:

Campfire Journal is a private, distraction-free digital journal designed for personal reflection, daily writing, and memory keeping without ever compromising your privacy.

Everything you write stays safely stored directly on your computer. There are no accounts to create, no monthly subscription fees, and no third-party tracking.

A PRIVATE AI COMPANION ON YOUR COMPUTER
Campfire includes a built-in AI reflection assistant that runs privately on your device. You can chat with your journal to ask questions about your past, discover patterns in your thoughts, receive gentle reflection prompts, and organize old entries without your personal life ever being sent to corporate databases.

KEY FEATURES:

- Complete Personal Privacy: Your journal entries are stored directly on your device. No cloud accounts, no data tracking, and no external access.
- Hierarchical Scratchpad & Tasks: Capture quick thoughts, organize multi-level subtasks, and structure notes into custom named groups in a dedicated distraction-free view.
- Private AI Assistant: Chat directly with your past entries to summarize old memories, reflect on personal progress, and clean up your archives.
- Smart Search by Meaning: Search your journal using natural language concepts instead of guessing exact keywords.
- Distraction-Free Editor: Enjoy a peaceful dark-mode writing space with instant side-by-side previews, automatic local saving, and word counts.
- Visual Life Timeline: Easily browse your personal history chronologically, filter entries by date ranges, and view your writing journey over time.
- Optional Personal Backup: Automatically back up your journal to your own private Google Drive account so your memories are safe if you change computers.
- Entry Lock Protection: Past entries (older than yesterday) are auto-locked and opened read-only to prevent accidental edits; unlock any entry with the header Lock/Unlock toggle when you need to edit.
- Zero Subscriptions: Own your personal journal forever with no paywalls or recurring monthly fees.

Take a break from noisy feeds and public social media. Step into your private sanctuary and write for yourself.

**What's new in v0.1.9**:

Major update:
- First-Class Scratchpad View: Promoted the quick notes scratchpad into a dedicated, full-page view on desktop and mobile for capturing thoughts, daily tasks, and brainstorms.
- Hierarchical Tasks & Subtasks: Support for nested task hierarchies with collapsible parent-child subtasks, progress counters, and visual indentation guides.
- Custom Named Groups: Organize tasks and notes into custom named groups with full create, rename, reorder, and deletion controls.

**Product features (Partner Center - add as bullets)**:

100% Private Local Storage: Your journal entries remain safely on your personal computer with no accounts and no third-party tracking.
Hierarchical Scratchpad & Tasks: Dedicated task manager with multi-level nested subtasks and custom named groups.
Private AI Assistant: Chat with your journal locally to reflect on past memories, ask questions, and receive personalized insights.
Smart Search by Meaning: Find entries by context and concepts rather than exact keywords.
Interactive Life Timeline: Browse your entry history chronologically and filter by date ranges.
Automatic Google Drive Sync: Optional background backup directly to your personal Google Drive account.
Entry Lock Protection: Past entries auto-lock and open read-only to prevent accidental edits; unlock any entry using the header toggle.
No Subscriptions: Enjoy complete access to all features with zero monthly fees or hidden costs.

**Short description (<=270 chars)**:

A cozy personal journal with a private AI companion that runs on your computer. Reflect on your thoughts and keep your entries 100% private.

**Keywords (suggested)**:

- journal
- diary
- notes
- scratchpad
- todo
- task manager
- google drive sync
- local-first
- privacy
- writing

**RunFullTrust / capability justification (copy into the Partner Center restricted capabilities text box if prompted)**:

Campfire Journal is a native Windows desktop application built with Tauri (Rust backend + WebView2 frontend). It requires the `runFullTrust` capability to execute as a Win32 desktop app for local file system access (read/write local journal data and attachments), to open system file pickers and external links, and to run the local native backend. No elevated administrator rights are requested or used.

---

Notes for release process:

- Ensure `package.json`, `core/package.json`, `desktop/package.json`, `mobile/package.json`, and `desktop/src-tauri/Cargo.toml` are bumped to `0.1.9` (the repo's `scripts/bump-version.mjs` handles this via `pnpm version:bump 0.1.9`).
- Build and validate the new Windows package before submission (`pnpm prepush` then `pnpm tauri:windows:build`).
- Update Partner Center: paste Description, replace "What's new" with the v0.1.9 text above, update Product features with the new Scratchpad feature, and upload the new package.
