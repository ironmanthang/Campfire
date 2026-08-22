# Campfire Project Roadmap & Tracking

This file maintains the active task progression and handoff checklist for upcoming engineering sessions.

---

## Completed Tasks (Recent)

- [x] **Scratchpad Duplication Extraction:** Extracted duplicated task parsing and tree mutation algorithms into platform-agnostic `@campfire/core` module (`core/src/scratchpad/logic.ts`).
- [x] **Hierarchical Data Model Migration:** Replaced flat markdown string storage with canonical `ScratchpadDocument` schema supporting parent-child subtasks and named groups.
- [x] **Mobile Storage Upgrade:** Bumped Dexie database schema to v2 with a dedicated `scratchpad` table, automatically migrating existing legacy markdown entries.
- [x] **Desktop Storage Adapter:** Implemented `readScratchpadDoc` and `writeScratchpadDoc` in desktop services with automatic legacy migration to JSON.
- [x] **Scratchpad First-Class Routed View (Desktop):** Added `view = "scratchpad"` to `useAppStore` view router, wired `SidebarNavItem`, and created full-page `ScratchpadView` with collapsible hierarchical tasks.
- [x] **Scratchpad View Swapping (Mobile):** Wired top header button to toggle between `journal` and `scratchpad` views in main content pane, replacing modal overlay.
- [x] **Dead Code & Interface Pruning:** Removed unused `toggleItem` references and simplified desktop read pipeline. Verified zero type errors and 49 passing unit tests.

---

## Pending Objectives (This Session)

- [ ] **Chat Auto-Scroll & Bottom Snapping:** Fix auto-scroll snapping in `ChatView` when queuing messages or when local Ollama models stream responses rapidly.
- [ ] **Journal Entry Locking:** Implement per-entry lock toggle and batch lock/unlock interaction.
- [ ] **Offline Sync Icon State Handling:** Prevent error sync icon from flickering when mobile app transitions to offline mode.
- [ ] **Hamburger Menu Collapse Transition:** Optimize collapse animation speed and responsiveness on mobile navigation.
- [ ] **Timeline Date Refresh on Desktop:** Ensure the "All" timeline view recomputes the current active date automatically when reopening the application across multi-day intervals.
- [ ] **Cloudflare Pages PWA Caching / Old Build Flash:** Investigate and resolve service worker cache update behavior causing flashes of previous build on initial load.
- [ ] **Mobile Settings Font Zoom UX Audit:** Test and refine layout elasticity across extreme font size adjustments in mobile view.
