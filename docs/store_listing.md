# Store listing copy for v0.1.13

Use this file as a 100% ready to copy-paste directly into Microsoft Partner Center for the v0.1.13 release.

**Description**:

Campfire Journal is a private, distraction-free digital journal designed for personal reflection, daily writing, and memory keeping without ever compromising your privacy.

Everything you write stays safely stored directly on your computer. There are no accounts to create, no monthly subscription fees, and no third-party tracking.

A PRIVATE AI COMPANION ON YOUR COMPUTER
Campfire includes a built-in AI reflection assistant that runs privately on your device. You can chat with your journal to ask questions about your past, discover patterns in your thoughts, receive gentle reflection prompts, and organize old entries without your personal life ever being sent to corporate databases.

KEY FEATURES:

- Complete Personal Privacy: Your journal entries are stored directly on your device. No cloud accounts, no data tracking, and no external access.
- Hierarchical Scratchpad & Tasks: Capture quick thoughts, organize multi-level subtasks, and structure notes into custom named groups in a dedicated distraction-free view.
- Ambient Soundscapes & Focus Audio: Relax and focus while writing with soothing natural soundscapes including campfire, rain, and night breeze.
- Private AI Assistant: Chat directly with your past entries to summarize old memories, reflect on personal progress, and clean up your archives.
- Smart Search by Meaning: Search your journal using natural language concepts instead of guessing exact keywords.
- Distraction-Free Editor: Enjoy a peaceful dark-mode writing space with instant side-by-side previews, automatic local saving, and word counts.
- Visual Life Timeline: Easily browse your personal history chronologically, filter entries by date ranges, and view your writing journey over time.
- Optional Personal Backup: Automatically back up your journal to your own personal Google Drive account so your memories are safe if you change computers.
- Entry Lock Protection: Past entries (older than yesterday) are auto-locked and opened read-only to prevent accidental edits; unlock any entry with the header Lock/Unlock toggle when you need to edit.
- Zero Subscriptions: Own your personal journal forever with no paywalls or recurring monthly fees.

Take a break from noisy feeds and public social media. Step into your private sanctuary and write for yourself.

**What's new in v0.1.13**:

- Ambient Soundscapes & Audio Effects: Immerse yourself in your writing with built-in ambient soundscapes (campfire, rain, wind) and responsive low-latency task completion audio with independent volume controls.
- Enhanced Scratchpad & Subtask Workflow: Added tri-state parent completion checkboxes, subtask auto-complete, 3-line note clamping with quick expansion, and a completed tasks visibility toggle.
- Interactive Task Rescue: Review and rescue accidentally completed or uncompleted items with the new interactive Clear-Completed review modal.
- Journal Search Tool for AI Companion: The local AI reflection assistant can now search and reference your past journal entries contextually during chats.
- UI & Modal Harmonization: Unified framed card styling across confirmation dialogs and improved mobile background sync concurrency.

**Product features (Partner Center - add as bullets)**:

100% Private Local Storage: Your journal entries remain safely on your personal computer with no accounts and no third-party tracking.
Hierarchical Scratchpad & Tasks: Dedicated task manager with multi-level nested subtasks, tri-state checkboxes, and custom named groups.
Ambient Soundscapes & Focus Audio: Soothing background audio (campfire, rain, wind) and task sound effects with customizable volume sliders.
Private AI Assistant: Chat with your journal locally to reflect on past memories, ask questions, and receive personalized insights.
Smart Search by Meaning: Find entries by context and concepts rather than exact keywords.
Interactive Life Timeline: Browse your entry history chronologically and filter by date ranges.
Automatic Google Drive Sync: Optional background backup directly to your personal Google Drive account with offline resilience.
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

- Ensure `package.json`, `core/package.json`, `desktop/package.json`, `mobile/package.json`, and `desktop/src-tauri/Cargo.toml` are bumped to `0.1.13` (the repo's `scripts/bump-version.mjs` handles this via `pnpm version:bump patch`).
- Build and validate the new Windows package before submission (`pnpm prepush` then `pnpm --filter desktop tauri:windows:build`).
- Update Partner Center: paste Description, replace "What's new" with the v0.1.13 text above, update Product features, and upload the new package.

