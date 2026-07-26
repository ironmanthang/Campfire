# Bug Handoff: Falling Heart Tap Does Nothing on Mobile

> **Status**: Active investigation — debug branch deployed, awaiting phone test results  
> **Repo**: `ironmanthang/Campfire` (monorepo, pnpm workspaces)  
> **Affected app**: `mobile/` — a Vite + React PWA deployed on Cloudflare Pages

---

## The Bug

In the mobile PWA, there is a floating draggable heart button (bottom-left). When "heart click falls" is enabled in settings, tapping the heart should trigger a falling-hearts rain animation. 

**Stable commit**: `657226ee` — tapping works flawlessly  
**Breaking commit**: `7a63057` — tapping does **nothing at all** (no animation, no modal, nothing)  
All subsequent commits (`7a63057` → current `master` `71614783`) are also broken.

The user always tests on a **real phone via Cloudflare Pages** (production PWA build), closing and reopening the app between each test. Not a dev server issue.

---

## Codebase Context

### Key files
| File | Role |
|---|---|
| `mobile/src/components/journal/JournalList.tsx` | Contains the floating heart `<button>`, `handleHeartClick`, heart state |
| `mobile/src/hooks/useDraggableButton.ts` | Pointer event handling, drag, inertia, tap detection via `onPointerUp` |
| `mobile/src/hooks/useFallingHearts.ts` | `fireHearts`, `startHeartRain` — spawns falling heart particles |
| `mobile/src/components/heart/FallingHearts.tsx` | Renders falling heart overlay (`position:fixed`, `pointerEvents:none`, `z-index:55`) |
| `mobile/src/constants/heart.ts` | `DEFAULT_HEART_SIZE = 60` |
| `mobile/src/App.tsx` | Wires `startHeartRain` → `JournalList` via `onStartHeartRain` prop |

### Tap flow (when working)
```
User tap
  → onPointerDown  (sets dragInfo, setPointerCapture)
  → onPointerUp    (checks totalDistance ≤ 6px → fires tapCallbackRef.current)
  → handleHeartClick()
      if heartClickFalls → onStartHeartRain(durationMs)
                         → startHeartRain() → fireHearts()
                         → FallingHearts renders hearts falling
      else              → onDonateOpen() (opens SupportModal)
```

### Key architectural detail — tap detection
Taps are detected in `onPointerUp`, **not** `onClick`, because `setPointerCapture` + `touchAction: none` causes mobile browsers to suppress the native click event. The `handleTap(callback)` pattern sets `tapCallbackRef.current` on every render and returns a no-op onClick that just calls `e.preventDefault()`.

```ts
// useDraggableButton.ts
const handleTap = (callback?: () => void) => {
  tapCallbackRef.current = callback;   // updated every render
  return (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
};

// Used in JSX:
onClick={donateBtn.handleTap(handleHeartClick)}
```

---

## What Changed Between Stable and Breaking Commit

Running `git diff 657226ee 7a63057`:

```diff
// JournalList.tsx — ONLY change in 7a63057:
- return parseInt(localStorage.getItem('campfire_mobile_heart_size') || '60', 10);
+ return parseInt(localStorage.getItem('campfire_mobile_heart_size') || '80', 10);
```

**That's literally it.** The default fallback for `heartSize` changed from `60` → `80`. This propagates into `useDraggableButton` as `buttonWidth: heartSize, buttonHeight: heartSize`.

Across all commits `7a63057` → `71614783`, the other changes were:
- `useDraggableButton.ts`: tap threshold `6` → `14` (user's own fix attempt, didn't help)
- `constants/heart.ts`: new file `DEFAULT_HEART_SIZE = 60` (extracted the constant)
- Modal refactor: `DonateModal` → `SupportModal` (renamed, backward-compat alias kept)
- Misc import cleanup

**None of these changes should logically prevent pointer events from firing.**

---

## Debugging So Far

### What we ruled out
- ✅ Not a dev server/HMR issue — user tests on real production PWA
- ✅ Not `heartClickFalls` being false — user confirmed animation worked before
- ✅ Not `FallingHearts` overlay blocking input — it has `pointerEvents: none`
- ✅ Not the modal refactor — `SupportModal` is properly exported/imported
- ✅ CSS `falling-heart` animation unchanged across all commits
- ✅ `onStartHeartRain` prop correctly wired in `App.tsx` line 254

### Critical finding: "none appear at all"
Debug toasts were added to `master` (current broken state):
- Green toast fires from `onPointerDown`
- Yellow toast fires from raw `touchstart` listener
- Red toast fires from `handleHeartClick`

When deployed to Cloudflare and tested on phone: **zero toasts appeared**. This means the button is **not receiving any touch or pointer events at all** — the events are being swallowed before they reach the button element.

---

## Current Debug Branch

**Branch**: `debug/heart-bisect`  
**Based on**: commit `7a63057` (first breaking commit)  
**Extra commit**: `3ec4da8` — adds debug instrumentation

### What the debug build does
On page load, a **cyan toast** appears confirming the button mounted with its position.

When you tap the heart:
- **Yellow toast** = raw `touchstart` native event reached the button
- **Green toast** = React `onPointerDown` fired
- **Green toast** = React `onPointerUp` fired with tap distance
- **Red toast (top)** = `handleHeartClick` ran

### Expected toast interpretation table
| What appears | Diagnosis |
|---|---|
| Only cyan on load, nothing on tap | Button visible but events totally blocked by something on top |
| Yellow only, no green | Touch reaches button but React pointer events are broken |
| Green pointerDown + green pointerUp `isTap=false` | 6px threshold too tight for this phone's tap |
| All toasts including red | Full chain works — issue is in `fireHearts` or `FallingHearts` rendering |

---

## Leading Hypothesis

The `overflow-hidden` + `absolute` positioning of the heart button inside the container may be causing iOS Safari to **clip pointer events** when the button visually overlaps the `overflow-y-auto` scroll container that is its sibling.

Container structure in `JournalList.tsx`:
```html
<div class="... relative overflow-hidden">    ← clipping boundary
  <div class="flex-1 overflow-y-auto ...">    ← entries list (scroll container — may eat touches)
  </div>
  <button class="absolute z-30 ...">          ← heart button (z-30, but still inside overflow-hidden parent)
  </button>
</div>
```

On iOS, scroll containers can capture touch events even if a sibling `absolute`-positioned element with a higher z-index is visually on top of them. The `overflow-hidden` on the parent may compound this.

Compare: `FallingHearts` works fine because it is rendered in `App.tsx` at root level with `position: fixed` — completely outside this container.

**Proposed fix**: Move the heart `<button>` rendering from `JournalList.tsx` up to `App.tsx`, rendered alongside `<FallingHearts>`. This removes it from the `overflow-hidden` scroll container hierarchy entirely.

---

## Next Steps for New AI Session

1. **Wait for phone test results** on `debug/heart-bisect` branch deployed to Cloudflare Pages
2. **Interpret toasts** using the table above to confirm where events are lost
3. **If the hypothesis is confirmed** (no toasts at all / only cyan), implement the fix:
   - Move the floating heart `<button>` from `JournalList.tsx` to `App.tsx` level
   - Pass the heart button's tap callback via prop (or a small context)
   - The `useDraggableButton` hook stays in `JournalList` — pass `donateBtn.position`, `donateBtn.bind`, etc. up as needed — or move the entire hook call to `App.tsx`
4. **After confirming fix**: clean up all debug toasts, remove `buttonRef` from hook return, delete `debug/heart-tap` and `debug/heart-bisect` branches, merge fix to master

---

## Branch Map
```
master               ← current broken state + some debug toasts (commit 77e8003)
debug/heart-tap      ← branch at stable commit 657226ee (unused, can delete)
debug/heart-bisect   ← 7a63057 + debug instrumentation (3ec4da8) — DEPLOYED TO CF PAGES
```

## Relevant localStorage Keys
```
campfire_mobile_heart_click_falls   'true' = tap fires hearts, 'false' = tap opens modal
campfire_mobile_heart_size          button size in px (default 60)
campfire_mobile_show_donate_heart   'false' = button hidden
campfire_mobile_heart_rain_duration seconds (default 5)
campfire_mobile_donate_pos          {x, y} saved button position JSON
campfire_mobile_heart_custom_image  base64 custom image or null
```
