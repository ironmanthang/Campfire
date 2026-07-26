# Campfire Mobile UX & Mobile-First Resiliency Audit

> **Scope**: Comprehensive audit of `mobile/` codebase against Mobile-First Constraints, Mobile Environment Dynamics, and Device Context factors.  
> **Note**: As requested, this document focuses exclusively on identifying, categorizing, and explaining all existing scenarios, failure modes, and code vulnerabilities that degrade user experience or cause mobile users to abandon the application.

---

## 1. Executive Summary & Mobile-First Theoretical Framework

Mobile devices operate under fundamental physical, technical, and environmental constraints distinct from desktop computing environments. Designing resilient mobile software requires accounting for **Mobile-First Constraints**, **Mobile Environment Dynamics**, and **Device Context**:

```
+-----------------------------------------------------------------------------------+
|                            MOBILE USER ENVIRONMENT                                |
+-----------------------------------------------------------------------------------+
|  1. Network Dynamics     | Spotty 3G/4G, Airplane mode, high latency, dropouts  |
|  2. Viewport Real Estate | Small screens (320-390px), notch, soft keyboard, safe areas |
|  3. Hardware & Power     | Battery saver mode, thermal throttling, low RAM/CPU  |
|  4. OS Interruption      | Background process kill, phone calls, orientation switch|
|  5. Ergonomics & Touch   | One-handed thumb use, touch target sizes, tap precision|
+-----------------------------------------------------------------------------------+
```

### Core Concepts

1. **Mobile-First Constraints**: Hardware limitations (battery capacities, thermal limits, shared RAM), network volatility (high packet loss, latency spikes), and physical interaction boundaries (thumb-zone mechanics, touch precision).
2. **Mobile Environment Dynamics**: Constant state turbulence—users shifting between wifi and cellular, entering subways (zero signal), getting interrupted by push notifications/calls, or using devices under direct bright sunlight.
3. **Device Context**: Physical context (motion, ambient light, portrait/landscape), System context (OS RAM pressure evictions, virtual keyboard resize behavior), and Cognitive context (micro-sessions of 10-30 seconds where speed and instant responsiveness are critical).

---

## 2. Network & Connectivity Failure Scenarios (Offline / Low Signal / High Latency)

### 2.1 External Script Dependency Blocks Startup & Settings Offline
* **Code Reference**: [index.html](file:///d:/program/Campfire/mobile/index.html#L11), [googleDrive.ts](file:///d:/program/Campfire/mobile/src/services/googleDrive.ts#L54-L57)
* **Failure Scenario**:  
  `index.html` loads the Google Identity Services SDK via `<script src="https://accounts.google.com/gsi/client" async defer></script>`.  
  When a user opens the app without an internet connection or in airplane mode:
  1. The external script fails to download.
  2. If the user navigates to Settings or attempts authentication, `requestDriveAuth` throws a raw exception: `"Google Identity Services SDK not loaded yet. Check your connection."`
  3. PWA ServiceWorker (`vite-plugin-pwa`) caches app bundles but cannot cache this cross-origin dynamic script.
  4. The user sees broken buttons and cryptic error messages when trying to open settings or manage account state offline.

### 2.2 Auto-Sync Lockout Trap (User Blocked from Opening/Reading Entries)
* **Code Reference**: [useJournalNavigation.ts](file:///d:/program/Campfire/mobile/src/hooks/useJournalNavigation.ts#L145-L149), [useGoogleSync.ts](file:///d:/program/Campfire/mobile/src/hooks/useGoogleSync.ts#L96-L125)
* **Failure Scenario**:  
  When auto-sync triggers (on app startup or switching entries), `syncProgressStatus` becomes `'connecting'` or `'syncing'`.  
  If the user attempts to tap and open another journal entry while sync is in progress:
  ```typescript
  if (syncProgressStatus === 'connecting' || syncProgressStatus === 'syncing') {
    setToastMessage("Syncing in progress. Please wait...");
    return;
  }
  ```
  On spotty 2G/3G connections or high-latency mobile networks, sync can take 30 to 60+ seconds. The user is **completely locked out** of reading or editing their local notes, forced to wait for network operations to finish.

### 2.3 Unbounded Fetch Requests Hanging Indefinitely
* **Code Reference**: [googleDrive.ts](file:///d:/program/Campfire/mobile/src/services/googleDrive.ts#L129-L161)
* **Failure Scenario**:  
  `driveFetch` calls native `fetch()` without an `AbortController` or timeout duration. When a user drives into a tunnel or dead spot mid-sync, the HTTP connection hangs indefinitely in TCP wait state.  
  Because there is no timeout handling, `syncProgressStatus` remains permanently stuck in `'syncing'`, locking the user out of the app UI until the app is force-closed.

### 2.4 Lack of Offline Sync Status Per Journal Entry
* **Code Reference**: [JournalListItem.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalListItem.tsx#L1-L100), [db.ts](file:///d:/program/Campfire/mobile/src/services/db.ts#L7)
* **Failure Scenario**:  
  While entries are saved locally to Dexie (`synced: false`), the `JournalListItem` UI component does **not** render any visual indicator (such as an offline icon, pending cloud sync dot, or last modified timestamp badge).  
  A user typing offline has zero feedback on whether their entry has been backed up to the cloud or remains locally un-synced.

### 2.5 Raw Error Leaks on Unhandled Network Dropouts
* **Code Reference**: [useGoogleSync.ts](file:///d:/program/Campfire/mobile/src/hooks/useGoogleSync.ts#L122-L125)
* **Failure Scenario**:  
  If the network drops mid-sync, browser fetch throws `TypeError: Failed to fetch`. `useGoogleSync.ts` catches `err`, but only checks for `'TOKEN_EXPIRED'` or `'NOT_AUTHENTICATED'`.  
  Network drop exceptions fail silently without notifying the user via toast or error banner, leaving the user unsure if their data sync succeeded or failed.

---

## 3. Screen Real Estate, Viewport & Layout Failure Scenarios

### 3.1 Virtual Keyboard Layout Collapse & Bottom Bar Interruption
* **Code Reference**: [index.html](file:///d:/program/Campfire/mobile/index.html#L6), [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L279-L326)
* **Failure Scenario**:  
  `index.html` sets `interactive-widget=resizes-content`. When a user taps into the editor textarea on a phone, the virtual keyboard slides up, consuming 45%–55% of vertical viewport height (leaving ~300px on modern phones, ~220px on small devices like iPhone SE).  
  - The text editing area shrinks down to 2–3 visible lines of text.
  - The bottom bar containing the Back button, Date Picker, Day Step arrows, and Preview toggle gets squeezed into the keyboard header or overlaps typing content.
  - Tapping date picker inputs while the keyboard is open triggers competing system popups (date wheel overlaying virtual keyboard).

```
+------------------------------------+  +------------------------------------+
| Header (Logo, Sync, Settings)      |  | Header (Logo, Sync, Settings)      |
+------------------------------------+  +------------------------------------+
| Editor Toolbar (Undo, Words, Redo) |  | Editor Toolbar (Undo, Words, Redo) |
+------------------------------------+  +------------------------------------+
| Textarea (Full height writing)     |  | Textarea (Squeezed to 2 lines!)   |
|                                    |  +------------------------------------+
|                                    |  | Bottom Bar (Back, Date, Preview)   |
|                                    |  +------------------------------------+
|                                    |  | [ VIRTUAL KEYBOARD ]               |
+------------------------------------+  | [ 1 2 3 4 5 6 7 8 9 0 ]            |
| Bottom Bar (Back, Date, Preview)   |  | [ q w e r t y u i o p ]            |
+------------------------------------+  +------------------------------------+
            (Normal View)                      (Keyboard Open on Small Phone)
```

### 3.2 Floating Action Buttons (FAB) Covering Journal List Content
* **Code Reference**: [JournalList.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalList.tsx#L247-L296)
* **Failure Scenario**:  
  `JournalList.tsx` renders two absolute floating action buttons:
  - Add button (`Plus`): 56x56px anchored `bottom-right`
  - Donate Heart button (`Heart`): adjustable up to 100px+ anchored `bottom-left`
  On smaller mobile displays (<375px width), these large floating elements cover entry dates, titles, and text snippets at the bottom of the list. The scroll container padding (`pb-24`) is insufficient when custom heart size is enlarged, preventing users from reading or tapping the bottom-most journal entries.

### 3.3 Missing Safe Area Insets (Notch, Dynamic Island & Navigation Bar Cutouts)
* **Code Reference**: [index.html](file:///d:/program/Campfire/mobile/index.html#L6), [index.css](file:///d:/program/Campfire/mobile/src/styles/index.css#L69-L80), [Header.tsx](file:///d:/program/Campfire/mobile/src/components/layout/Header.tsx#L62)
* **Failure Scenario**:  
  `index.html` defines `viewport-fit=cover`, causing the web view to extend under system cutouts (iPhone notch/Dynamic Island and bottom iOS gesture bar / Android navigation bar).  
  However, `Header.tsx` and `index.css` do not apply `padding-top: env(safe-area-inset-top)` or `padding-bottom: env(safe-area-inset-bottom)`.  
  - On devices in landscape mode or with camera cutouts, top buttons (Sync icon, Theme switch, Settings gear) are partially covered by the hardware notch.
  - Bottom bar buttons sit directly on top of the native OS home drag bar, causing accidental app switches when trying to tap the "Back" or "Preview" buttons.

### 3.4 Extreme Font Scaling & Dynamic Type UI Shattering
* **Code Reference**: [useFontSize.ts](file:///d:/program/Campfire/mobile/src/hooks/useFontSize.ts#L1-L25), [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L222-L245)
* **Failure Scenario**:  
  When users set font size preference to `'xlarge'` (or when system accessibility font scaling is enabled):
  - In `JournalEditor.tsx`, the Conflict Resolution Banner renders a 3-column button grid (`grid-cols-3`): `Keep Mine`, `Keep Cloud`, `Keep Both`.
  - With large fonts, button text truncates into `Keep...`, `Keep...`, `Keep...`, making all three buttons identical and unreadable.
  - Header actions and sub-header date controls overflow screen width, causing horizontal scrollbars or wrapping elements into broken vertical stacks.

---

## 4. Hardware, Battery & Thermal Constraint Failure Scenarios

### 4.1 Continuous Canvas Animations & Drop-Shadow GPU Battery Drain
* **Code Reference**: [index.css](file:///d:/program/Campfire/mobile/src/styles/index.css#L164-L212), [FallingHearts.tsx](file:///d:/program/Campfire/mobile/src/components/heart/FallingHearts.tsx#L1-L60)
* **Failure Scenario**:  
  The application features animated heartbeat effects (`animate-heartbeat`) and full-screen falling heart particles (`falling-heart`).  
  - Each falling heart applies continuous CSS transforms combined with heavy filter blurs: `filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.65))`.
  - On mobile GPUs (especially during low-battery mode or thermal throttling), composite drop-shadow animations on 20+ simultaneous DOM nodes trigger expensive frame repaints.
  - This causes severe interface micro-stutters (framerate drops to 15-20 fps) and drains phone battery rapidly during active use.

### 4.2 LocalStorage Image Payload Quota Crashes (`QuotaExceededError`)
* **Code Reference**: [ImageCropModal.tsx](file:///d:/program/Campfire/mobile/src/components/modals/general/ImageCropModal.tsx), [App.tsx](file:///d:/program/Campfire/mobile/src/App.tsx#L24-L32)
* **Failure Scenario**:  
  Custom logos and heart icons are converted to raw Base64 data URLs and written directly to `localStorage` (`localStorage.setItem('past_you_custom_logo', dataUrl)`).  
  - Mobile web browsers enforce strict `localStorage` limits (5MB total limit on iOS Safari across the origin).
  - Saving 2–3 cropped custom images can quickly hit the 5MB ceiling, throwing an unhandled `DOMException: QuotaExceededError`.
  - Because `localStorage.setItem` calls lack `try/catch` wrappers, hitting the storage quota causes the modal to crash and corrupts application state saves.

### 4.3 High-Frequency Unoptimized IndexedDB Writes During Typing
* **Code Reference**: [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L102-L122), [useJournalDb.ts](file:///d:/program/Campfire/mobile/src/hooks/useJournalDb.ts#L1-L30)
* **Failure Scenario**:  
  Every edit in `JournalEditor.tsx` triggers state updates that invoke `useJournalDb` autosave routines. While debounced at 700ms in `JournalEditor.tsx`, continuous rapid typing on long notes (1,000+ words) causes repeated serialization and IndexedDB write transactions.  
  Under low-battery power saving modes (where CPU core clock speeds are halved by the OS), disk writes block the main JS thread, resulting in dropped keypresses and visual input lag.

---

## 5. Mobile Environment Dynamics & OS Interruption Hazards

### 5.1 Loss of In-Flight Text Buffer on OS Background Process Kill
* **Code Reference**: [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L102-L122), [useJournalNavigation.ts](file:///d:/program/Campfire/mobile/src/hooks/useJournalNavigation.ts#L63-L68)
* **Failure Scenario**:  
  While a user is actively typing a journal entry:
  1. An incoming phone call or app switch occurs.
  2. Mobile operating systems (iOS / Android) put background webviews into a suspended state and purge memory if RAM is needed.
  3. `JournalEditor.tsx` does **not** register `visibilitychange` or `pagehide` event listeners on `window` to immediately flush uncommitted text buffer (`content`) to Dexie IndexedDB.
  4. If the OS kills the webview while in the background, any text typed during the last un-flushed typing session is **permanently lost**.

### 5.2 Android Native Hardware Back Button History Mismatch
* **Code Reference**: [useModalBackHandler.ts](file:///d:/program/Campfire/mobile/src/hooks/useModalBackHandler.ts#L1-L30), [useJournalNavigation.ts](file:///d:/program/Campfire/mobile/src/hooks/useJournalNavigation.ts#L70-L117)
* **Failure Scenario**:  
  On Android devices, users rely heavily on the system back swipe gesture / hardware back button.  
  - Navigation between list and editor pushes states into `window.history`.
  - When a modal overlay is open (`FilterModal`, `SettingsModal`, `SupportModal`, `SyncResultModal`), performing the Android back gesture pops `window.history`.
  - Instead of closing the open modal, the browser navigates backward from the active journal editor to the journal list in the background while leaving the modal open on top of the list, resulting in broken navigation state.

### 5.3 Device Orientation (Portrait <-> Landscape) Viewport Compression
* **Code Reference**: [index.css](file:///d:/program/Campfire/mobile/src/styles/index.css#L78-L86), [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L178-L326)
* **Failure Scenario**:  
  Rotating the phone to landscape orientation reduces screen height to ~320px–390px.
  - Header height (56px) + Editor Status bar (36px) + Bottom control bar (48px) consume 140px.
  - The remaining text area height is reduced to ~180px.
  - Draggable FAB buttons anchored to screen coordinates cover half the landscape typing area, making landscape writing unusable.

---

## 6. Ergonomics, Touch Targets & Localization Fractures

### 6.1 Sub-Standard Touch Target Sizes (< 44px Minimum W3C Guideline)
* **Code Reference**: [Header.tsx](file:///d:/program/Campfire/mobile/src/components/layout/Header.tsx#L78-L105), [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L289-L305), [JournalList.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalList.tsx#L204-L212)
* **Failure Scenario**:  
  Mobile design standards (W3C Mobile Accessibility & Apple Human Interface Guidelines) require interactive touch targets to be at least **44x44px** (preferably 48x48px) for thumb/finger accuracy.  
  In the current codebase:
  - Header buttons (`p-2` with `size={18}` icons): physical touch bounding box is ~28x28px.
  - Date step arrows (`ChevronLeft`/`ChevronRight` size 16 with `p-1.5`): ~24x24px area.
  - Search clear button (`X` size 14 with `p-1`): ~20x20px area.
  Users with larger thumbs frequently mis-tap adjacent elements or hit the text input area by accident.

### 6.2 Draggable Gesture vs. Single-Tap Conflict Failure
* **Code Reference**: [useDraggableButton.ts](file:///d:/program/Campfire/mobile/src/hooks/useDraggableButton.ts#L204-L207)
* **Failure Scenario**:  
  `useDraggableButton.ts` distinguishes between a button tap and a drag using distance threshold:
  ```typescript
  if (dragInfo.current.totalDistance <= 6) {
    tapCallbackRef.current?.();
  }
  ```
  On touchscreens, natural finger taps involve small sliding motions. A quick thumb tap often shifts 7–10 pixels across the glass. Because the threshold is set to 6px, normal taps are misclassified as drag attempts and ignored completely, forcing users to tap repeatedly to trigger the Add/Donate buttons.

### 6.3 Localization Text Expansion Layout Breaking (Vietnamese vs. English)
* **Code Reference**: [JournalListItem.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalListItem.tsx), [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L80-L89)
* **Failure Scenario**:  
  Vietnamese localized strings are ~30%–50% longer than English equivalents.
  - Date strings in English (`Monday, July 26, 2026`) fit single-line headers.
  - In Vietnamese (`Thứ Hai, 26 tháng 7, 2026`), the string wraps onto two lines on 360px wide screens, pushing editor headers out of view and overlapping controls.

---

## 7. File-by-File Code Vulnerability Index

| File Path | Lines | Category | Specific Vulnerability / Impact |
| :--- | :--- | :--- | :--- |
| [index.html](file:///d:/program/Campfire/mobile/index.html#L11) | Line 11 | Network / Offline | External Google GIS script breaks offline startup and settings initialization. |
| [index.html](file:///d:/program/Campfire/mobile/index.html#L6) | Line 6 | Viewport / Display | Missing safe-area inset padding causes top header & bottom bar to get cut off by notch/gesture bar. |
| [index.css](file:///d:/program/Campfire/mobile/src/styles/index.css#L195-L211) | L195–211 | Battery / Performance | Heavy CSS drop-shadow filters on falling particle SVGs cause GPU overheating and frame drops. |
| [App.tsx](file:///d:/program/Campfire/mobile/src/App.tsx#L156-L194) | L156–194 | Screen Real Estate | Donation reminder banner takes up 20% of screen height without auto-dismiss on scroll. |
| [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L183-L207) | L183–207 | Touch Target / UX | Undo/Redo touch targets (`p-2`) are too small (~28px) for reliable finger operation. |
| [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L222-L245) | L222–245 | Accessibility / i18n | Conflict resolution buttons use `text-[10px]` with `truncate` in a 3-column grid, making option text unreadable when scaled or localized. |
| [JournalEditor.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalEditor.tsx#L102-L122) | L102–122 | OS Interruption | Unsaved typing buffer is lost if OS kills app background process (no `visibilitychange` listener). |
| [JournalList.tsx](file:///d:/program/Campfire/mobile/src/components/journal/JournalList.tsx#L247-L296) | L247–296 | Viewport / Layout | Draggable FAB buttons block bottom entry cards and scroll padding (`pb-24`) fails for large custom heart sizes. |
| [useJournalNavigation.ts](file:///d:/program/Campfire/mobile/src/hooks/useJournalNavigation.ts#L145-L149) | L145–149 | Connectivity / UX | Hard blocks user from opening/reading any local notes while cloud sync status is active. |
| [useDraggableButton.ts](file:///d:/program/Campfire/mobile/src/hooks/useDraggableButton.ts#L204-L207) | L204–207 | Ergonomics / Touch | 6px drag threshold causes fast natural finger taps to be discarded as drags. |
| [googleDrive.ts](file:///d:/program/Campfire/mobile/src/services/googleDrive.ts#L129-L161) | L129–161 | Network / Resilience | `fetch` calls lack timeout limits, causing network requests to hang indefinitely on weak connections. |
| [googleDrive.ts](file:///d:/program/Campfire/mobile/src/services/googleDrive.ts#L54-L57) | L54–57 | Offline Reliability | Hard dependency on `window.google.accounts.oauth2` throws raw unhandled errors when offline. |
| [ImageCropModal.tsx](file:///d:/program/Campfire/mobile/src/components/modals/general/ImageCropModal.tsx) | — | Storage / Crash | Writes raw Base64 images to `localStorage` without `try/catch`, risking `QuotaExceededError` crashes. |

---

## 8. Summary Checklist of Factors That Cause Mobile User Abandonment

1. **Inability to Read Local Notes During Sync**: Getting locked out of reading existing journal entries while the app attempts to connect to the network.
2. **Data Loss on Interruption**: Losing recently typed paragraphs when receiving a phone call or switching apps because the editor does not flush buffer state on backgrounding.
3. **Unresponsive Buttons (Tap Misses)**: Small touch targets (<28px) and aggressive drag thresholds that ignore finger taps on primary buttons.
4. **Keyboard Smothering the Editor**: Having the virtual keyboard consume the viewport while leaving only 2 lines of text and covering bottom navigation tools.
5. **Notch & Gesture Bar Overlaps**: Top controls hidden under iPhone camera cutouts and bottom buttons accidentally triggering native home screen swipes.
6. **Battery Drain & Phone Lag**: Intensive drop-shadow canvas animations causing frame stuttering and fast battery depletion on thermal-throttled phones.
7. **Cryptic Failure Error Popups**: Unhandled network exceptions leaking technical error strings when opening settings offline.
