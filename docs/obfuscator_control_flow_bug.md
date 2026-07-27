# Obfuscator Control-Flow Flattening Bug

**Date discovered:** 2026-07-27  
**Severity:** Critical (silent runtime corruption — no build errors, no console errors)  
**Affects:** Mobile build (`mobile/package.json`)

---

## What Happened

Hearts stopped falling when tapping the donate button after a one-line source change (`'50'` → `'60'` default size). The entire tap chain worked perfectly — pointerdown, pointerup, totalDistance check, callback invocation — but `startHeartRain` silently did nothing.

**Root cause:** `--control-flow-flattening true` in the `javascript-obfuscator` CLI command.

```
# OLD (broken)
javascript-obfuscator dist/assets --compact true --control-flow-flattening true --string-array true --string-array-encoding base64

# FIXED
javascript-obfuscator dist/assets --compact true --string-array true --string-array-encoding base64
```

---

## Why It's Dangerous

Control-flow flattening rewrites every function body into a `while(true) { switch(state) { ... } }` state machine. This transformation is **not semantically transparent** and is known to break:

| Pattern | Why it breaks |
|---|---|
| `useCallback` closures | Captured variables may be read in a different switch-case "state" than where they were written |
| Module-level `let` vars used in `setTimeout` | The obfuscated state machine can re-order reads/writes across closure boundaries |
| `setHearts(prev => ...)` state updater functions | React updater closures capture state; flattened control flow can corrupt the captured reference |
| Any closure that references outer scope mutable vars | The state-machine rewrite changes *when* outer variables are evaluated |

The key danger is that **the bug is input-dependent** — a tiny source change (one string `'50'` → `'60'`) shifts the string array indices and control-flow graph, causing the obfuscator to generate a *different* broken path. The same code with different inputs may work fine.

---

## The Heisenbug Nature

Adding debug `console.log` / DOM toasts *fixed* the bug because the extra code changed the file structure enough for the obfuscator to generate different (working) output. This is the textbook definition of a **heisenbug** — observing the bug changes it.

**Debugging trace that confirmed the callback chain was intact:**
```
DOWN pos=79,611 ptr=3 type=touch btnW=48   ✅ onPointerDown fired
CAPTURED=true                               ✅ pointer capture succeeded  
UP ptr=3 active=3 dist=0.10                ✅ onPointerUp fired, tiny distance
TAP CHECK: dist=0.10 <=6? true hasCb=true  ✅ tap detected, callback exists
FIRING TAP CALLBACK                         ✅ callback invoked
handleHeartClick: falls=true hasRainFn=true ✅ correct values
```

Everything worked. The bug was silently swallowing the `fireHearts` → `setHearts` call *after* the obfuscator's state machine restructured it.

---

## Rules Going Forward

1. **Never use `--control-flow-flattening true`** with React/hooks code. It is incompatible with closures that capture mutable state across async boundaries.

2. **`--string-array` + `--string-array-encoding base64` is safe** — it only replaces string literals with array lookups, no control flow is changed.

3. **If a feature suddenly breaks after a trivial source change** (a string default, a number literal), suspect the obfuscator before debugging the logic.

4. **Heisenbug checklist:** If adding debug code fixes the bug, the issue is in the build pipeline (obfuscator, minifier, bundler) — not the source.

5. **Desktop build still uses `--control-flow-flattening true`** (`desktop/package.json` line 9). If desktop ever shows similar ghost bugs, apply the same fix there.

---

## Files Changed

| File | Change |
|---|---|
| `mobile/package.json` | Removed `--control-flow-flattening true` from `build` script |
