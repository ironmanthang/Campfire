# Campfire Mobile Resilience and UX Risk Audit

Audited: 2026-07-26

Scope: `mobile/` PWA code plus the shared `core/src/sync.ts` sync engine as used by mobile.

This is intentionally not a fix plan. It lists the mobile environments and app behaviors that could make a mobile user stop trusting or stop using Campfire.

## Research Basis

Mobile constraints found in the web research:

- Mobile users deal with small screens, unreliable networks, slow connections, partial attention, and short usage bursts. Source: [A Book Apart, Mobile First, Chapter 2](https://mobile-first.abookapart.com/04-chapter-2/).
- Offline-first apps should remain usable without reliable network access, show local data immediately, and be conscious of battery and data status. Source: [Android Developers, Build an offline-first app](https://developer.android.com/topic/architecture/data-layer/offline-first).
- Service workers can cache app assets and create a default offline experience, but cached shell availability is not the same as fully reliable offline user data behavior. Source: [MDN, Using service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).
- Cache Storage and IndexedDB are key browser storage pieces for PWAs when the network is flaky or unavailable. Source: [web.dev, Offline data](https://web.dev/learn/pwa/offline-data).
- Offline UX needs explicit communication about bad network states, visible reassurance that work is stored, and should not block app content behind network requests. Source: [web.dev, Offline UX design guidelines](https://web.dev/articles/offline-ux-design-guidelines).
- Mobile quality expectations include preserving state across foreground/background transitions, reasonable touch targets, performance, stability, and testing across varied screen/device forms. Source: [Android Developers, Core app quality guidelines](https://developer.android.com/docs/quality-guidelines/archive/core/core-app-quality-2026-03-20).
- iOS layout guidance emphasizes safe areas, and Apple button guidance expects large touch hit regions. Sources: [Apple HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Apple HIG Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).

## Quick Answer To The Offline Text Input Question

Yes, after the mobile app shell has already loaded or been installed, the user can type locally without internet because entries are stored in IndexedDB through Dexie (`mobile/src/services/db.ts:11`, `mobile/src/services/db.ts:29`) and the editor writes locally rather than directly to Google Drive (`mobile/src/hooks/useJournalDb.ts:24`, `mobile/src/hooks/useJournalDb.ts:25`).

But this is not fully resilient yet. Text can still feel unsafe or be lost from the user's point of view if IndexedDB fails, the browser kills the tab before the debounce completes, the PWA storage is evicted, the app is opened offline before the service worker has cached it, or the UI suggests "Offline" without explaining what is saved locally and what still needs sync.

## Highest-Risk Mobile User Environments

- No internet at all: airplane mode, subway, tunnel, rural area, elevator, basement, overloaded event venue.
- Intermittent internet: connection appears online but requests stall, captive Wi-Fi portal, mobile handoff between towers, VPN/proxy failures, DNS failures.
- Slow or metered internet: 2G/3G, data saver, roaming, expensive data, weak upload speed.
- Low battery and thermal throttling: browser deprioritizes background tasks, animations become janky, sync drains power, device may kill the tab.
- Small or awkward screens: old iPhone SE size, compact Android, split-screen, landscape, foldables, browser chrome consuming vertical space.
- Keyboard-heavy sessions: user writes with the software keyboard open, text area and bottom controls fight for space.
- Interruptions: phone call, notification, lock screen, app switcher, OS memory reclaim, accidental back gesture.
- Storage pressure: low disk, private browsing, IndexedDB unavailable, quota exceeded, site data eviction, localStorage quota from base64 images/logs.
- Accessibility needs: large text, screen reader, motor impairment, low vision, color blindness, touch imprecision, one-handed use.
- Real-world context: walking, riding in a vehicle, bright sunlight, wet fingers, one thumb, rushed emotional journaling.

## Network and Offline Failure Modes

### First Open While Offline

- Code evidence: the app uses a PWA service worker (`mobile/vite.config.ts:15`, `mobile/src/main.tsx:8`) but the initial HTML includes remote Google Identity Services (`mobile/index.html:10`) and CSS imports Google Fonts (`mobile/src/styles/index.css:1`).
- User impact: if the user has never opened or installed the app before, "offline-first" may not help because the app shell may not be cached yet.
- Quit risk: the user may try to journal in a low-connectivity moment and conclude Campfire is not actually available when they need it.

### Offline App Shell But Missing External Dependencies

- Code evidence: Google Identity SDK is loaded from `https://accounts.google.com/gsi/client` (`mobile/index.html:10`), and `requestDriveAuth` fails when the SDK is not loaded (`mobile/src/services/googleDrive.ts:55`).
- User impact: settings/sign-in/sync can fail because the script never arrived, even if the local editor still works.
- Quit risk: "Check your connection" can make the app feel broken rather than clearly local-first with optional sync.

### Sync Button Does Not Mean Real Network State

- Code evidence: header text shows "Offline" when not logged in, not when the network is actually offline (`mobile/src/components/layout/Header.tsx:86`).
- User impact: a user can be online but unauthenticated and see "Offline", or offline but authenticated and see a sync control.
- Quit risk: confusing status language erodes trust in whether entries are safe.

### Slow Network Blocks Confidence

- Code evidence: sync moves through connecting/syncing states (`core/src/sync.ts:36`, `core/src/sync.ts:41`, `core/src/sync.ts:118`) and disables entry selection during connecting/syncing (`mobile/src/hooks/useJournalNavigation.ts:145`).
- User impact: if Drive is slow, the app can prevent opening another entry with only a short toast.
- Quit risk: the app feels like the network owns the journal, even though local data exists.

### Network Errors Can Quietly Disappear

- Code evidence: `useGoogleSync` catches sync errors but only changes login state for `TOKEN_EXPIRED` or `NOT_AUTHENTICATED`; other errors are not surfaced there after `runSync` throws (`mobile/src/hooks/useGoogleSync.ts:121`).
- User impact: a network timeout or server error may leave the user with a stale icon/status and no clear next step.
- Quit risk: sync failure without explanation makes users question whether edits uploaded or disappeared.

### No Retry Queue For Failed Sync

- Code evidence: Drive calls are direct `fetch` operations (`mobile/src/services/googleDrive.ts:140`, `mobile/src/services/googleDrive.ts:149`, `mobile/src/services/googleDrive.ts:247`, `mobile/src/services/googleDrive.ts:264`), while the sync engine is a foreground loop over all dates (`core/src/sync.ts:125`).
- User impact: if one request fails mid-sync, the current sync aborts rather than queueing remaining cloud work.
- Quit risk: intermittent mobile connections turn sync into a repeated manual chore.

### Auto-Sync Can Surprise Users On Bad Connections

- Code evidence: auto-sync defaults to enabled unless explicitly set false (`mobile/src/hooks/useGoogleSync.ts:59`, `mobile/src/App.tsx:100`, `mobile/src/components/settings/sections/GoogleDriveSection.tsx:35`).
- User impact: opening the app or leaving the editor can trigger network work on expensive or unstable mobile data.
- Quit risk: the app may feel data-hungry or battery-hungry, especially for users who expected a private local journal.

### Captive Portal And Fake Online Cases

- Code evidence: there is no `navigator.onLine` check or connectivity classification in the mobile source.
- User impact: the phone may claim Wi-Fi is connected while Google requests fail or hang behind a login portal.
- Quit risk: users get vague auth/sync failures while everything else on the phone says connected.

### Google Auth Token Expiry In Mobile Sessions

- Code evidence: tokens are refreshed near expiry (`mobile/src/services/googleDrive.ts:96`, `mobile/src/services/googleDrive.ts:107`) and silent refresh can fail (`mobile/src/services/googleDrive.ts:109`).
- User impact: a user who writes after a long idle period may hit auth friction during sync.
- Quit risk: journaling feels interrupted by account plumbing.

### Privacy And Trust Friction Around Cloud Sync

- Code evidence: Drive tokens are stored in localStorage (`mobile/src/services/googleDrive.ts:17`, `mobile/src/services/googleDrive.ts:38`).
- User impact: on a shared or compromised phone, local app state and auth state are exposed to browser/site storage behavior.
- Quit risk: a privacy-first user may lose trust if mobile storage is perceived as cloud-like or unprotected.

## Local Text Entry and Data-Loss Failure Modes

### Debounced Save Window

- Code evidence: editor changes update React state immediately (`mobile/src/components/journal/JournalEditor.tsx:103`), but database save is debounced 400 ms (`mobile/src/hooks/useJournalDb.ts:24`, `mobile/src/hooks/useJournalDb.ts:25`).
- User impact: a sudden OS kill, browser crash, reload, or low-battery shutdown inside the debounce window can lose the last keystrokes.
- Quit risk: losing even one emotional journal sentence can be enough to abandon the app.

### No Save On Pagehide Or Visibility Change

- Code evidence: save paths exist for navigation/back (`mobile/src/hooks/useJournalNavigation.ts:65`, `mobile/src/App.tsx:204`) but there is no `pagehide`, `visibilitychange`, or `beforeunload` flush in the mobile source.
- User impact: phone lock, app switch, browser tab discard, or OS memory reclaim may not run the app's explicit save path.
- Quit risk: mobile users naturally interrupt sessions; the app may fail exactly at the normal interruption point.

### IndexedDB Write Failure Is Not User-Visible

- Code evidence: `saveLocalEntry` awaits `db.entries.put` with no local catch or user-facing failure state (`mobile/src/services/db.ts:29`). The debounced writer also awaits it without catch (`mobile/src/hooks/useJournalDb.ts:24`, `mobile/src/hooks/useJournalDb.ts:25`).
- User impact: quota errors, private mode issues, database corruption, or blocked storage can fail silently or crash the effect.
- Quit risk: the app can show text on screen that was never actually persisted.

### IndexedDB Read Failure Can Blank Trust

- Code evidence: `loadEntries` calls `listLocalEntries` without catch (`mobile/src/hooks/useJournalDb.ts:11`, `mobile/src/hooks/useJournalDb.ts:12`); editor loads call `getLocalEntry` without catch (`mobile/src/hooks/useJournalNavigation.ts:119` onward).
- User impact: a transient IndexedDB error could render an empty list or block editor loading.
- Quit risk: seeing an empty journal is a panic moment.

### LocalStorage Is Used As If Always Available

- Code evidence: app initialization reads localStorage directly (`mobile/src/App.tsx:24`, `mobile/src/App.tsx:31`, `mobile/src/App.tsx:48`), many settings write directly (`mobile/src/components/journal/JournalList.tsx:107`, `mobile/src/components/settings/sections/HeartSection.tsx:181`).
- User impact: private browsing, storage quota, or browser policy errors can break preferences or parts of startup.
- Quit risk: app settings, theme, logo, filters, and auth state can become unstable without explanation.

### Base64 Images Compete With Storage

- Code evidence: custom images are converted to data URLs (`mobile/src/components/settings/sections/HeartSection.tsx:178`) and stored in localStorage (`mobile/src/components/settings/sections/HeartSection.tsx:181`, `mobile/src/components/settings/sections/HeartSection.tsx:182`).
- User impact: localStorage quota can be consumed by decoration while the journal depends on browser storage staying healthy.
- Quit risk: decorative customization can indirectly damage reliability expectations.

### Export Can Fail Late

- Code evidence: export reads all entries into memory (`mobile/src/components/settings/sections/ExportSection.tsx:17`, `mobile/src/components/settings/sections/ExportSection.tsx:27`) and falls back to `alert` on failure (`mobile/src/components/settings/sections/ExportSection.tsx:21`, `mobile/src/components/settings/sections/ExportSection.tsx:31`).
- User impact: users with years of entries may hit memory/download/browser restrictions only when trying to back up.
- Quit risk: if export fails, users feel locked in even though the product promises user-owned data.

### Storage Eviction Is Invisible

- Code evidence: there is no storage persistence request, storage estimate, or low-storage warning in the mobile source.
- User impact: mobile browsers can clear site data under pressure, especially for less frequently used PWAs.
- Quit risk: local-only data disappearing feels catastrophic.

## Sync, Conflict, and Multi-Device Failure Modes

### Empty Entry Means Delete

- Code evidence: empty local content is treated as deletion/cleanup in sync (`core/src/sync.ts:159`, `core/src/sync.ts:229`).
- User impact: accidental select-all-delete followed by sync can remove remote content.
- Quit risk: a user may not understand that clearing a text area is a destructive cloud action.

### Remote Deletion Can Delete Local

- Code evidence: when base content exists and remote is missing, local can be deleted (`core/src/sync.ts:152`, `core/src/sync.ts:153`).
- User impact: remote cleanup or Drive mistakes can propagate into the phone.
- Quit risk: a cloud-side mistake feels like the mobile app destroyed memories.

### Duplicate Drive Files Are Deleted Automatically

- Code evidence: duplicate files are detected and extras are deleted (`core/src/sync.ts:61`, `core/src/sync.ts:72`, `core/src/sync.ts:76`, `core/src/sync.ts:87`, `core/src/sync.ts:88`).
- User impact: if Drive has multiple files for a date due to manual edits or conversion, sync picks one and removes others.
- Quit risk: automatic cleanup of personal writing can feel too aggressive.

### Google Drive Pagination Limit

- Code evidence: Drive list uses `pageSize=1000` but no pagination loop (`mobile/src/services/googleDrive.ts:196`).
- User impact: more than 1000 `.md` files in the journal folder may not fully sync.
- Quit risk: long-term users with years of entries may see missing days and stop trusting the archive.

### Sync Result Modal Can Interrupt Writing

- Code evidence: sync result dates open a modal (`mobile/src/App.tsx:285`) after sync, and editor can be force-reloaded after sync (`mobile/src/hooks/useGoogleSync.ts:102`, `mobile/src/hooks/useGoogleSync.ts:110`).
- User impact: a user writing while sync completes may be interrupted or see content reload.
- Quit risk: writing flow is fragile if cloud events change the current editor.

### Conflict Markers Are User-Visible Markdown

- Code evidence: conflicts are written into the local entry as marker blocks (`core/src/sync.ts:290`, `core/src/sync.ts:293`, `core/src/sync.ts:296`), then detected in the editor (`mobile/src/components/journal/JournalEditor.tsx:207`).
- User impact: non-technical users may see conflict text mixed with private writing.
- Quit risk: personal journal content suddenly becoming technical merge text is scary.

### Clock And Timezone Ambiguity

- Code evidence: local modified time is `Date.now()` (`mobile/src/services/db.ts:40`) and remote modified time is parsed from Drive (`core/src/sync.ts:206`, `core/src/sync.ts:212`).
- User impact: wrong device clock, timezone jumps, daylight savings travel, or delayed remote timestamps can affect conflict decisions.
- Quit risk: multi-device users may see unexpected overwrite/conflict behavior after travel.

### Sync Status Is Mostly Icon/Color Based

- Code evidence: dots and icons indicate sync state (`mobile/src/components/journal/JournalListItem.tsx:78`, `mobile/src/components/layout/Header.tsx:34`) and several explanations are only `title` tooltips (`mobile/src/components/layout/Header.tsx:57`, `mobile/src/components/journal/JournalListItem.tsx:79`).
- User impact: mobile users often cannot hover to read tooltips, and color-only signals fail for some users.
- Quit risk: users do not know which entries are safe in Drive and which are pending.

## Small Screen, Keyboard, and Layout Failure Modes

### Pinch Zoom Is Disabled

- Code evidence: viewport has `maximum-scale=1.0, user-scalable=no` (`mobile/index.html:6`).
- User impact: low-vision users cannot zoom the interface or editor.
- Quit risk: if the journal cannot be comfortably read, it becomes unusable.

### Safe Area Is Declared But Not Clearly Applied

- Code evidence: viewport uses `viewport-fit=cover` (`mobile/index.html:6`), but the app CSS does not visibly apply `env(safe-area-inset-*)` padding.
- User impact: iPhone home indicator, notches, rounded corners, or browser UI can crowd bottom and top controls.
- Quit risk: controls that feel clipped or hard to reach make the app feel unpolished.

### Keyboard Can Crush The Editor

- Code evidence: the body is locked to `100dvh` and `overflow: hidden` (`mobile/src/styles/index.css:77`, `mobile/src/styles/index.css:79`), while the editor has a bottom toolbar and a flex textarea (`mobile/src/components/journal/JournalEditor.tsx:264`, `mobile/src/components/journal/JournalEditor.tsx:282`).
- User impact: when the software keyboard opens, the textarea may become too short, bottom controls may compete with the keyboard, or scrolling can feel trapped.
- Quit risk: typing is the core action; any keyboard discomfort is retention-critical.

### Date Picker May Overflow On Short Screens

- Code evidence: date picker popover is `bottom-full` and fixed width `280px` (`mobile/src/components/common/DatePicker.tsx:146`).
- User impact: in landscape, split-screen, or with keyboard open, the picker can be partially off-screen.
- Quit risk: changing dates becomes unreliable, and accidental date edits can threaten entry trust.

### Touch Targets Below Mobile Expectations

- Code evidence: date cells are `h-8 w-8` (`mobile/src/components/common/DatePicker.tsx:180`), several editor controls are compact (`mobile/src/components/journal/JournalEditor.tsx:282`, `mobile/src/components/journal/JournalEditor.tsx:298`).
- User impact: one-handed users or users with shaky touch may tap the wrong day or wrong control.
- Quit risk: accidental date changes or missed taps make journaling feel stressful.

### Header Crowding On Narrow Screens

- Code evidence: header contains logo/title plus sync/theme/settings controls in one row (`mobile/src/components/layout/Header.tsx:64`, `mobile/src/components/layout/Header.tsx:76`).
- User impact: on very narrow screens, long translated app name, custom logo, or larger font settings can crowd controls.
- Quit risk: primary controls feel cramped before the user even writes.

### Bottom Editor Bar Has Three Competing Areas

- Code evidence: bottom bar contains Back, previous/date/next, and preview/edit controls (`mobile/src/components/journal/JournalEditor.tsx:278`, `mobile/src/components/journal/JournalEditor.tsx:298`, `mobile/src/components/journal/JournalEditor.tsx:303`).
- User impact: small screens, large font, Vietnamese labels, or landscape can cause crowding or truncation.
- Quit risk: navigation and preview are always visible but may become hard to hit or understand.

### Modals Are Centered Cards On Tiny Viewports

- Code evidence: settings and support modals use centered `max-h-[90vh]` cards (`mobile/src/components/settings/SettingsModal.tsx:29`, `mobile/src/components/settings/SettingsModal.tsx:33`, `mobile/src/components/modals/general/SupportModal.tsx:74`, `mobile/src/components/modals/general/SupportModal.tsx:78`).
- User impact: on short screens with keyboard open, important controls can be hidden inside nested scroll areas.
- Quit risk: settings, export, and donation flows feel like desktop dialogs squeezed onto a phone.

### Floating Buttons Can Cover Content

- Code evidence: donate and add buttons are absolutely positioned over the journal list (`mobile/src/components/journal/JournalList.tsx:252`, `mobile/src/components/journal/JournalList.tsx:286`), while the list only reserves bottom padding (`mobile/src/components/journal/JournalList.tsx:228`).
- User impact: large custom heart sizes, saved positions, or small screens can cover entries, tags, or the add button.
- Quit risk: decoration gets in the way of journaling.

### Drag Inertia Can Feel Out Of Control

- Code evidence: floating buttons use pointer capture, velocity, and `requestAnimationFrame` inertia (`mobile/src/hooks/useDraggableButton.ts:226`, `mobile/src/hooks/useDraggableButton.ts:268`).
- User impact: on low-end or busy devices, the button may move unexpectedly or lag behind the finger.
- Quit risk: a core create/donate button feeling slippery creates accidental taps and annoyance.

### Browser Text Selection Is Broadly Disabled

- Code evidence: many areas use `select-none` (`mobile/src/components/journal/JournalList.tsx:192`, `mobile/src/components/journal/JournalEditor.tsx:178`, `mobile/src/styles/index.css:151`).
- User impact: users may be unable to select/copy dates, preview text, sync errors, or instructions.
- Quit risk: journal users often want to copy, quote, or recover text.

## Low Battery, Performance, and Low-End Device Failure Modes

### Large Bundle And Obfuscation

- Code evidence: production build runs JavaScript obfuscation on `dist/assets` (`mobile/package.json:8`), and the existing built JS asset is about 1.9 MB (`mobile/dist/assets/index-B-zTdDBd.js` observed in workspace).
- User impact: slower parse/compile/startup on low-end phones, more heat and battery usage.
- Quit risk: a journal should open instantly; slow launch feels broken in short mobile sessions.

### Continuous Decorative Animations

- Code evidence: heartbeat animation is infinite (`mobile/src/styles/index.css:165`, `mobile/src/styles/index.css:169`), falling hearts can schedule repeated timers (`mobile/src/hooks/useFallingHearts.ts:72`, `mobile/src/hooks/useFallingHearts.ts:80`) and render up to 50 elements (`mobile/src/hooks/useFallingHearts.ts:32`).
- User impact: low battery or thermal throttling can make UI stutter.
- Quit risk: decorative motion can feel disrespectful when the user wants a quiet writing space.

### Sync Loops Over Every Entry

- Code evidence: sync builds a set of all dates and loops them (`core/src/sync.ts:115`, `core/src/sync.ts:125`).
- User impact: years of entries can mean long sync time, many network calls, and higher battery use.
- Quit risk: long spinners make users avoid sync or abandon mobile entirely.

### Search Is In-Memory Over All Entries

- Code evidence: list filtering lowercases and scans every entry content in render (`mobile/src/components/journal/JournalList.tsx:123`, `mobile/src/components/journal/JournalList.tsx:140`).
- User impact: with years of long entries, typing in search can lag.
- Quit risk: the archive promise fails if search feels heavy or freezes.

### Export Loads All Data At Once

- Code evidence: export reads all entries and builds one blob (`mobile/src/components/settings/sections/ExportSection.tsx:17`, `mobile/src/components/settings/sections/ExportSection.tsx:18`).
- User impact: a large journal can cause memory pressure, tab reload, or failed download.
- Quit risk: users may not trust the app if backup is unreliable.

### Image Processing On Main Thread

- Code evidence: custom image upload uses FileReader, Image, canvas, and `toDataURL` in the UI thread (`mobile/src/components/settings/sections/HeartSection.tsx:151`, `mobile/src/components/settings/sections/HeartSection.tsx:178`).
- User impact: large image uploads can freeze older phones.
- Quit risk: customization should not make the app feel unstable.

## Interruption and Navigation Failure Modes

### Browser Back Is Doing Many Jobs

- Code evidence: editor navigation pushes active date into history (`mobile/src/hooks/useJournalNavigation.ts:151`), modals also push history state (`mobile/src/hooks/useModalBackHandler.ts:12`), and modal manual close calls `history.back()` plus `onClose()` (`mobile/src/hooks/useModalBackHandler.ts:27`).
- User impact: Android back gesture may close a modal, leave editor, or change entries depending on hidden history state.
- Quit risk: accidental back behavior is one of the easiest ways to lose confidence on mobile.

### Modal Close May Double-Apply State

- Code evidence: `handleManualClose` calls `window.history.back()` and `onClose()` in the same function (`mobile/src/hooks/useModalBackHandler.ts:27`, `mobile/src/hooks/useModalBackHandler.ts:29`).
- User impact: depending on event order, modal state and browser state can drift.
- Quit risk: weird back-button behavior feels like the app is fighting the phone.

### Heart Gate Manually Consumes History

- Code evidence: `HeartSection` explicitly calls `window.history.back()` after confirming the gate (`mobile/src/components/settings/sections/HeartSection.tsx:118`).
- User impact: nested modal flows can pop the wrong history entry.
- Quit risk: settings interactions can affect navigation outside settings.

### Sync Blocks Entry Opening

- Code evidence: selecting an entry is refused during connecting/syncing (`mobile/src/hooks/useJournalNavigation.ts:145`, `mobile/src/hooks/useJournalNavigation.ts:147`).
- User impact: if sync starts because of auto-sync, the user cannot open the entry they wanted.
- Quit risk: interruptions become worse because the app delays access to local content.

### Editor Scroll Resets

- Code evidence: switching dates and preview/edit toggles set textarea scrollTop to 0 (`mobile/src/components/journal/JournalEditor.tsx:41`, `mobile/src/components/journal/JournalEditor.tsx:71`).
- User impact: long-entry writers lose their place.
- Quit risk: long reflective entries become annoying to edit.

### Undo/Redo History Is Volatile

- Code evidence: undo/redo buffers are component state and reset on date change (`mobile/src/components/journal/JournalEditor.tsx:39`, `mobile/src/components/journal/JournalEditor.tsx:44`).
- User impact: app refresh, tab kill, or date switch loses undo history.
- Quit risk: users expect undo to protect them from accidental deletion while editing.

## Accessibility and Inclusive UX Failure Modes

### Color-Only Or Tooltip-Only Status

- Code evidence: sync status dots use color with title attributes (`mobile/src/components/journal/JournalListItem.tsx:78`, `mobile/src/components/journal/JournalListItem.tsx:79`), and header status explanation is in `title` (`mobile/src/components/layout/Header.tsx:76`).
- User impact: screen reader users, color-blind users, and touch users may not receive the status.
- Quit risk: "is this synced?" must be answerable without guessing.

### Some Buttons Lack Visible Or Accessible Labels

- Code evidence: settings button has only an icon and no `aria-label` (`mobile/src/components/layout/Header.tsx:95`); floating add button has only an icon (`mobile/src/components/journal/JournalList.tsx:282`).
- User impact: assistive tech and unfamiliar users have less context.
- Quit risk: icon-only controls slow down or block users who need clarity.

### Disabled Zoom Conflicts With Large Text Needs

- Code evidence: `user-scalable=no` (`mobile/index.html:6`) and app-level font choices are fixed choices from small to xlarge (`mobile/src/styles/index.css:20` through `mobile/src/styles/index.css:43`).
- User impact: users who rely on browser zoom cannot enlarge beyond the app's presets.
- Quit risk: accessibility is not optional for a personal writing tool.

### Motion Sensitivity

- Code evidence: heart animation and falling heart animation have no reduced-motion branch (`mobile/src/styles/index.css:165`, `mobile/src/styles/index.css:177`).
- User impact: users with motion sensitivity may be uncomfortable.
- Quit risk: a journaling app should feel calm, not physically unpleasant.

### Touch Precision Problems

- Code evidence: date grid uses 32px cells (`mobile/src/components/common/DatePicker.tsx:180`) and several controls are compact.
- User impact: accidental wrong-date selection can put private writing on the wrong day.
- Quit risk: date mistakes are especially damaging in a journal.

## Trust, Messaging, and Mental Model Failure Modes

### "Offline-First" May Overpromise

- Code evidence: manifest description says "Offline-First Journal synced with Google Drive" (`mobile/vite.config.ts:21`).
- User impact: users may assume every action, dependency, and backup behavior works offline.
- Quit risk: one failed offline sign-in/sync/export interaction can make the app feel dishonest.

### Local Storage Is Not Explained At The Moment Of Risk

- Code evidence: local save has no visible "saved locally" state in the editor; word count is shown instead (`mobile/src/components/journal/JournalEditor.tsx:187`).
- User impact: users typing offline cannot tell whether the text is safely stored on-device.
- Quit risk: writing personal content without visible reassurance feels risky.

### "Synced" Versus "Saved" Are Blended

- Code evidence: local saves mark entries `synced: false` (`mobile/src/services/db.ts:40`), while list items show only synced/unsynced dots (`mobile/src/components/journal/JournalListItem.tsx:78`).
- User impact: users may think unsynced means unsaved, or synced means backed up forever.
- Quit risk: unclear data status makes users anxious.

### Debug Logs Are Hidden In Settings

- Code evidence: sync logs are localStorage-backed (`mobile/src/services/localStorageLogger.ts:8`, `mobile/src/services/localStorageLogger.ts:23`) and shown only in a debug settings section.
- User impact: when sync fails, normal users do not get a clear recovery story.
- Quit risk: failure feels opaque.

### Donation UI Can Interrupt Core Journaling

- Code evidence: donation banner appears after count/streak thresholds (`mobile/src/App.tsx:121` through `mobile/src/App.tsx:139`), donation heart overlays the list (`mobile/src/components/journal/JournalList.tsx:248`).
- User impact: users may see donation UI during private journaling moments.
- Quit risk: a personal journal must not feel like it is nagging at emotionally sensitive times.

### External Donation And QR Requests Depend On Network

- Code evidence: Ko-fi opens an external URL (`mobile/src/components/modals/general/SupportModal.tsx:51`), VietQR image/download use remote `fetch`/image URLs (`mobile/src/components/modals/general/SupportModal.tsx:56`).
- User impact: support flow breaks offline or on captive networks.
- Quit risk: failed donation flow is lower severity than lost writing, but it still makes the app feel rough.

## Long-Term Journal Scale Failure Modes

### Years Of Entries Can Hurt Startup/List

- Code evidence: `listLocalEntries` reads all entries and filters empty content (`mobile/src/services/db.ts:58`, `mobile/src/services/db.ts:60`), then list renders and filters in memory.
- User impact: as the journal grows, list load, search, export, and sync can slow down.
- Quit risk: the app becomes worse exactly when the user's investment is highest.

### One File Per Date Meets Drive Limits Poorly

- Code evidence: mobile sync maps all Drive files by date and processes all dates (`core/src/sync.ts:48`, `core/src/sync.ts:125`), with a Drive query capped at 1000 files (`mobile/src/services/googleDrive.ts:196`).
- User impact: multi-year daily users approach hidden limits and degraded sync behavior.
- Quit risk: archive reliability is a core promise for a journal.

### Full-Content Search Scales With Total Words

- Code evidence: search checks `entry.content.toLowerCase().includes(query)` over loaded entries (`mobile/src/components/journal/JournalList.tsx:140`).
- User impact: typing into search can become sluggish with years of long entries.
- Quit risk: users stop using history features if search punishes them.

## Device and Browser Compatibility Failure Modes

### PWA Update Can Happen While Writing

- Code evidence: service worker is registered with immediate auto-update behavior (`mobile/vite.config.ts:16`, `mobile/src/main.tsx:8`).
- User impact: an update race during an editing session can reload or cache-mismatch assets depending on browser behavior.
- Quit risk: update surprises during writing are trust-breaking.

### iOS Browser Differences

- Code evidence: app relies on IndexedDB, service workers, dynamic viewport height, and standalone manifest behavior.
- User impact: iOS Safari/PWA quirks around storage eviction, viewport resizing, keyboard, and service worker lifecycle can affect reliability.
- Quit risk: iPhone users may experience a different quality bar than desktop testing suggests.

### Android WebView/Browser Differences

- Code evidence: the app uses browser APIs for storage, service workers, pointer events, file downloads, and OAuth popups.
- User impact: Chrome, Samsung Internet, Firefox Android, in-app browsers, and WebViews can differ in popup, download, and storage handling.
- Quit risk: users arriving through a link in another app may get a degraded first experience.

### Installed PWA Versus Browser Tab

- Code evidence: manifest sets `display: standalone` (`mobile/vite.config.ts:23`), but the same app also runs as a normal web tab.
- User impact: back gestures, address bars, keyboard resize, and install state change the UI.
- Quit risk: the app may feel inconsistent between "installed" and "opened in browser."

## Environment-Specific "User Leaves" Scenarios

- The user opens Campfire on a train with no internet before the service worker cache exists. The app does not load.
- The user writes offline, locks the phone immediately, and the last words are lost because the debounce did not flush.
- The user sees "Offline" in the header while actually online but not logged into Google, and misunderstands the save state.
- The user taps Sync on a captive Wi-Fi network. Nothing useful happens, and the app gives vague auth/network failure.
- The user with large text enabled cannot pinch zoom because zoom is disabled.
- The user taps the wrong date in the 32px date grid and writes an entry under the wrong day.
- The user has years of entries, searches on a low-end phone, and the list lags on every character.
- The user tries to export years of writing and the browser fails the download.
- The user customizes the heart with an image, localStorage quota is stressed, and settings become unreliable.
- The user sees a conflict marker block inside a private entry and thinks the journal corrupted their writing.
- The user has more than 1000 Drive files and some entries never appear in mobile sync.
- The user uses Android back in a nested modal flow and lands somewhere unexpected.
- The user is in low battery mode, decorative animations and sync make the app feel sluggish.
- The user relies on screen reader or color-blind-friendly status and cannot understand which entries are saved or synced.
- The user is emotionally journaling and sees donation UI overlaying or interrupting the app.

## Current Resilience Positives

These reduce some risk but do not eliminate the failure modes above:

- Local journal content uses IndexedDB/Dexie (`mobile/src/services/db.ts:11`).
- The app has a PWA service worker registration (`mobile/src/main.tsx:8`).
- The sync engine has conflict preservation instead of silently picking a side (`core/src/sync.ts:287` through `core/src/sync.ts:307`).
- Adjacent dates are prefetched locally for faster navigation (`mobile/src/hooks/useJournalNavigation.ts:51`).
- Entry changes are marked unsynced locally (`mobile/src/services/db.ts:40`).
- Export exists for JSON and Markdown (`mobile/src/components/settings/sections/ExportSection.tsx:17`, `mobile/src/components/settings/sections/ExportSection.tsx:27`).

## Bottom Line

Campfire mobile has the right local-first foundation for basic offline writing after the app is available, but the user experience can still break under normal mobile conditions: weak internet, storage pressure, sudden interruption, small screens, low battery, large journals, accessibility needs, and confusing sync states. The biggest churn risks are not just technical failure; they are moments where the user cannot tell whether their private writing is saved, synced, recoverable, or safe.
