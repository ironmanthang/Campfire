# Microsoft Store Publishing Guide for Campfire (2026)

> **Status**: Up-to-date as of **July 2026**
> **Audience**: Solo / freelance developer publishing the Tauri 2 desktop app **Campfire** to the Microsoft Store
> **Companion mobile app**: PWA hosted on Cloudflare Pages (separate flow, see §10)
> **Last verified docs**:
> - [Free developer registration for individual developers](https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-individual-developer) — updated 2026-04-18
> - [Choose visibility options for MSIX app](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/visibility-options) — updated 2026-07-14
> - [Beta testing and targeted distribution](https://learn.microsoft.com/en-us/windows/apps/publish/beta-testing-and-targeted-distribution) — updated 2025-08-21
> - [Open a Microsoft Store developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account) — updated 2026-07-17

---

## Table of Contents

1. [Quick facts (TL;DR)](#1-quick-facts-tldr)
2. [Account setup — the right flow](#2-account-setup--the-right-flow)
3. [Pre-flight checklist](#3-pre-flight-checklist)
4. [Pre-public testing: 4 stages](#4-pre-public-testing-4-stages)
5. [Private audience: tester onboarding](#5-private-audience-tester-onboarding)
6. [Submission package: building the MSI](#6-submission-package-building-the-msi-for-the-store)
7. [Submission walkthrough](#7-submission-walkthrough)
8. [Going public](#8-going-public)
9. [Tauri-specific gotchas](#9-tauri-specific-gotchas)
10. [Companion PWA on Cloudflare Pages](#10-companion-pwa-on-cloudflare-pages)
11. [OAuth security for distributed binaries](#11-oauth-security-for-distributed-binaries)
12. [Pre-submission checklist (Store cert 2026)](#12-pre-submission-checklist-store-cert-2026)
13. [Troubleshooting](#13-troubleshooting)
14. [Self-check cheatsheet (commands you can re-run)](#14-self-check-cheatsheet-commands-you-can-re-run)

---

## 1. Quick facts (TL;DR)

| Question | Answer (2026) |
|----------|---------------|
| Is the developer account fee still $19? | **No, it's free** since 2025. Confirmed in the 2026 docs. |
| Is Private audience testing free? | **Yes**, no per-tester cost. |
| Can I use Gmail for my testers? | **Yes**, but each tester must create a Microsoft Account (MSA) using their Gmail as the primary alias. Microsoft accounts no longer link Google credentials — they just accept Gmail as the login. |
| Can I switch from Private to Public later? | **Yes**, and back? **No** — once you publish to Public, you cannot return to Private for the same listing. |
| What's the minimum Windows version? | **Windows 10, version 1607** or later (incl. Xbox One). |
| How long is certification? | Typically **24–72 hours**, often faster for individual devs. |
| Microsoft revenue cut on paid apps? | **15%** standard. Free apps = $0 owed. |
| What's the cost to publish a *free* app? | **$0** total. |
| Do I need a privacy policy? | **Yes**, even for free apps with no data collection. Host a simple one on GitHub Pages. |

---

## 2. Account setup — the right flow

> ⚠️ **Warning**: There are **two different** Microsoft account systems that look identical. Make sure you use the right one.

| Flow | URL | Purpose | Cost |
|------|-----|---------|------|
| ❌ **Microsoft for your business** | signup.microsoft.com | Buy Azure / M365 / Dynamics | Credit card required, business verification |
| ✅ **Partner Center dev onboarding** | **storedeveloper.microsoft.com** | Publish Store apps | **Free** |

The "Microsoft for your business" page asks for business name, D-U-N-S, employees count, etc. — that's for **companies paying Microsoft for services**, not for app publishers. **Do not fill that out.**

### 2.1 Create an Individual developer account (free, ~10 minutes)

1. Open **https://storedeveloper.microsoft.com**
2. Click **"Get started for free"**
3. Select **Individual developer** (the option without "Company")
4. Sign in with an existing Microsoft Account (MSA), or create a new one. **Tip**: a personal Gmail can be used as the MSA's primary alias.
5. **Identity verification**: upload a government-issued ID + selfie. Microsoft's verifier auto-fills your profile from the ID.
   - Use a **phone with a working camera** (the selfie step requires live capture, not a photo).
   - Good lighting, original documents (not photocopies).
   - Acceptable IDs: passport, driver's license, national ID card (varies by country).
6. Review auto-filled profile details, edit if needed.
7. Click **"Go to Partner Center dashboard"**.
8. You'll be prompted to pick the same MSA you signed in with. If you don't land in Partner Center immediately:
   - Wait ~5 minutes, refresh, and look for the **Apps & Games** tile.
   - Or navigate directly to **https://aka.ms/submitwindowsapp**

### 2.2 What the new flow does (per Microsoft's official 2026 page)

| Feature | What it means for you |
|---------|----------------------|
| No registration fee | The $19 individual fee is permanently waived |
| ID-based verification | Replaces the old address-verification postcard; faster |
| Guided, lightweight onboarding | No D-U-N-S, no company docs, no business employees count |
| Auto-filled profile info | Less typing — Microsoft reads your ID |
| Instant Partner Center access | Once verified, you're publishing in minutes, not days |

### 2.3 What you still need to enable in Partner Center

After landing in Partner Center, the screenshot you showed has an **"Account settings → Programs"** page. You'll see tiles like **Windows**, **Hardware**, **Microsoft Edge**, **Minecraft**, etc.

- Click **Windows → Get started** to enroll in the Microsoft Store program. (This is essentially a click-through — no extra cost.)
- You do **not** need to enroll in Hardware, Edge extensions, Minecraft, or Flight Simulator for a basic desktop app.
- **Microsoft 365 and Copilot** is for plugin publishers — not needed for a journal app.

### 2.4 Tax profile (payouts)

You only need a **payout / tax profile** if your app is **paid**. Since Campfire is free, you can skip this for now. Microsoft will still nag you about it; just acknowledge and move on.

### 2.5 Support contact

If you get stuck in onboarding, the dedicated email is **storesupport@service.microsoft.com**. For everything else, raise a ticket at **https://aka.ms/windowsdevelopersupport**.

---

## 3. Pre-flight checklist

Before you start the testing pipeline, fix these in your codebase. They will block Store certification if left undone.

### 3.1 OAuth client secret in shipped binaries (CRITICAL)

Your current desktop app accepts a `google_drive_client_secret` from user input ([desktop/src/components/settings/IdentitySection.tsx:234-235](desktop/src/components/settings/IdentitySection.tsx#L234-L235), [desktop/src/types.ts:13-14](desktop/src/types.ts#L13-L14), [desktop/src/store/domains/syncSlice.ts:142-143](desktop/src/store/domains/syncSlice.ts#L142-L143)). **Remove the user-input UI and stored config field** before publishing — never ask end users to paste a developer secret.

**Reality check (2026-07)**: Google's standard OAuth token-exchange endpoint **does require `client_secret`** even for "Desktop app" OAuth client types. The Desktop-app type is intended for *installed* applications, not for secret-less public clients. The only secret-less flow is the PKCE `authorization_code` flow, which is a different beast (you'd need to add PKCE + a verifier store to the Rust side). For a single-developer, single-OAuth-client app the simpler and correct approach is: **bake the developer's own `client_secret` into the binary at build time** and remove all user-facing secret input.

Concretely:

- Use OAuth Client type = **"Desktop app"** in Google Cloud Console.
- Your **own** Client ID and Client Secret are baked into the bundle via `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_SECRET` in `desktop/.env` (Client IDs are public; the secret is the developer's own, not a user secret).
- **`build.rs`** in `desktop/src-tauri/` reads `desktop/.env` at compile time and emits both values to rustc. The Rust `start_gdrive_auth` command reads them via `env!(...)` and uses them in the token-exchange POST.
- **Never** ship a user-input secret field. **Never** accept a secret from a settings UI.

**Files to modify** (removing `google_drive_client_secret` user-input and config):

```
desktop/src/types.ts                                  (line 14)
desktop/src/hooks/useConfig.ts                        (line 23)
desktop/src/store/domains/configSlice.ts              (line 58)
desktop/src/store/domains/syncSlice.ts                (lines 142-143)
desktop/src/components/settings/IdentitySection.tsx   (line 235)
desktop/src-tauri/src/commands/oauth.rs               (signature: drop client_secret param, use env!())
desktop/src-tauri/src/commands/config.rs              (AppConfig field)
desktop/src-tauri/build.rs                            (NEW: read .env, emit cargo:rustc-env)
```

### 3.2 Content Security Policy (CSP)

Your `tauri.conf.json` should have an explicit CSP. The current value (as of the §3 gate) is:

```json
"security": {
  "csp": "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://www.mojeek.com https://api.mojeek.com ipc: http://ipc.localhost; style-src 'self' 'unsafe-inline'; script-src 'self'"
}
```

Notes:
- `ipc: http://ipc.localhost` are required for Tauri's own IPC; omitting them breaks the app in release builds.
- The certifier flags missing CSPs in 2026. Adjust the `connect-src` list to match every endpoint your app actually calls (Mojeek, Google, Gemini, etc.).

### 3.3 Tauri capabilities (audit)

Open [desktop/src-tauri/capabilities/default.json](desktop/src-tauri/capabilities/default.json) and verify each permission is justified. You currently have:

```json
"permissions": [
  "core:default",
  "opener:default",
  "dialog:default",
  "fs:default",
  "core:app:allow-set-app-theme"
]
```

This is a **minimal, clean** set — perfect for Store submission. Do **not** add `shell:execute`, `http:default`, `os:default`, etc., unless your app actually needs them. Every extra permission is a certifier question.

### 3.4 Auto-updater

If you've added Tauri's auto-updater plugin for sideloaded builds, **disable it for Store builds**. The Store has its own update mechanism; using both confuses users and can fail certification.

### 3.5 App identifier

Your identifier is `com.campfire.app` ([desktop/src-tauri/tauri.conf.json](desktop/src-tauri/tauri.conf.json)). **Once submitted, this cannot be changed without a new listing.** Note that the identifier ends in `.app`, which the Tauri 2 build emits a warning about (it conflicts with the macOS `.app` bundle extension). That warning is macOS-only and is **not** a Windows/Store blocker, but if you plan to ship to macOS too, consider changing the identifier to `com.campfire.journal` (or similar) before your first submission.

### 3.6 i18n and type checks

```powershell
cd d:\program\Campfire\desktop
pnpm typecheck      # tsc --noEmit
pnpm i18n:check     # your i18n parity check
pnpm test           # vitest run
```

All three must pass. Certification will reject an app that crashes on launch due to missing translations or type errors.

---

## 4. Pre-public testing: 4 stages

```
[1] Dev mode (fast feedback)
        ↓
[2] Local MSI/NSIS build + side-load (no Store)
        ↓
[3] Partner Center "Private audience" with your tester MSAs
        ↓
[4] Submit to Store (still private) → flip to Public
```

### Stage 1 — Dev mode

```powershell
cd d:\program\Campfire\desktop
pnpm tauri dev
```

Walk through every view wired in [desktop/src/App.tsx:286-302](desktop/src/App.tsx#L286-L302):

| View | Verify |
|------|--------|
| Settings | Pick a journal directory → on first run, welcome toast fires |
| Journal editor | Create a `.md` entry, save, reopen |
| Timeline | Streak ≥30 → donate banner shows (logic at [App.tsx:69-103](desktop/src/App.tsx#L69-L103)) |
| Search | Mojeek/Google query, results render |
| Chat | Ollama status poll (logic at [App.tsx:129-132](desktop/src/App.tsx#L129-L132)) |
| Reflection | Loads |
| Modals | About / Feedback / Help / Error / Sync / Import |

**Keyboard/mouse features** to test:
- `Ctrl+Alt+T` → dev tool executor panel (dev-only)
- `Ctrl + scroll wheel` → text zoom (70%–200%), persists in localStorage
- `Ctrl +` / `Ctrl -` / `Ctrl 0` → same zoom, keyboard variant
- Mouse back/forward buttons → navigate
- Donate banner → "Maybe later" (session), "Don't ask" (localStorage), "Support" → About → "me" tab

### Stage 2 — Local build + side-load (MSI / NSIS)

This is the critical pre-Store gate. No Partner Center involvement, no cert wait, instant install.

> **Important 2026 fact**: Tauri 2 only generates **EXE and MSI** installers. The Microsoft Store's MSIX app type is a Tauri-1-era workflow; for Tauri 2 you register the product as an **"EXE or MSI app"** in Partner Center and upload the `.msi` directly. See [the official Tauri 2 Microsoft Store guide](https://v2.tauri.app/distribute/microsoft-store/) (last updated 2026-06-15) and §6 below.

```powershell
cd d:\program\Campfire\desktop
pnpm release
```

Output lands in:
```
desktop\src-tauri\target\release\bundle\
  ├── msi\          (Windows Installer .msi — what the Store wants)
  └── nsis\         (NSIS .exe installer — alternative for direct distribution)
```

**Sideload for a first-run smoke test** (Windows 10 1607+ / Windows 11):

> ⚠️ **MSI requires Administrator.** Tauri 2's default WiX config produces a **per-machine** MSI (`INSTALLDIR=%LOCALAPPDATA%\Programs\Campfire` but registered under `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`, not `HKCU`). On a non-admin shell you'll get `Error 1925: You do not have sufficient privileges to complete this installation for all users of the machine.` and `msiexec` exits with `1603`. Tauri 2 does **not** expose a `bundle.windows.wix.installScope` field — there is no per-user MSI option in the documented config (verified against the [Tauri 2 config reference](https://v2.tauri.app/reference/config/), last updated 2026-06-15). So for local sideload testing without elevation, **use the NSIS EXE**.

**NSIS EXE (per-user, no admin needed — recommended for Stage 2):**
```powershell
# silent (matches what the Store uses for ingestion when uploading an .exe)
.\src-tauri\target\release\bundle\nsis\Campfire_0.1.0_x64-setup.exe /S

# GUI (shows the install wizard)
.\src-tauri\target\release\bundle\nsis\Campfire_0.1.0_x64-setup.exe
```
Default install path: `%LOCALAPPDATA%\Campfire\` (just the EXE + uninstaller — Tauri 2's NSIS template is minimal because the frontend is embedded in `tauri-app.exe` and WebView2 is statically linked on Windows). Uninstall is registered under `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`. Smoke test that the binary starts:
```powershell
& "$env:LOCALAPPDATA\Campfire\tauri-app.exe"   # window title should read "Campfire"
# then Stop-Process -Name tauri-app
```

**MSI (per-machine, needs Administrator — only for Store submission verification):**
```powershell
# Run from an elevated PowerShell, or via:
Start-Process msiexec.exe -ArgumentList @('/i', '.\src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi', '/quiet', '/norestart', '/l*v', "$env:TEMP\campfire_install.log") -Verb RunAs -Wait
```
MSI install path: `%LOCALAPPDATA%\Programs\Campfire\` (registered under `HKLM`). Don't waste time debugging this as non-admin — the per-user failure is the expected behavior, not a bug.

**What this stage catches**:
- MSI packaging quirks (Tauri 2 will install to `%LOCALAPPDATA%\Programs\Campfire` by default; verify with `Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' | Where-Object { $_.DisplayName -eq 'Campfire' }`)
- Icon resolution issues (check that all sizes in `tauri.conf.json:24-31` exist — they do: 32x32, 128x128, 128x128@2x, plus the Windows-Store-specific Square30/44/71/89/107/142/150/284/310 logos in `desktop/src-tauri/icons/`)
- First-run flow on a clean machine (empty `journal_dir` triggers onboarding)
- The new CSP from §3.2 is only enforced in release builds — confirm Mojeek / Google / Gemini / IPC calls aren't blocked. If you see a CSP error in the WebView dev console (Ctrl+Shift+I), extend the `connect-src` list in `tauri.conf.json` and re-run `pnpm release`.
- App uninstall: `msiexec /x '.\src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi' /quiet` (or `Get-Package -Name "Campfire" | Uninstall-Package`)

### Stage 3 — Partner Center Private audience

See §5 below for the full flow.

### Stage 4 — Go Public

See §8 below.

---

## 5. Private audience: tester onboarding

The Private audience feature is the only way to distribute a real Store listing to specific testers while **completely preventing** anyone else from seeing the listing — even if they know the URL.

### 5.1 How Gmail testers work in 2026

The key fact: **you cannot link a Google account to a Microsoft account in 2026.** But you **can** create a Microsoft account that uses a Gmail address as its login.

Microsoft's own support page (current 2026 text) reads:

> "At this time, you cannot use your Google credentials to sign in to your Microsoft account, but you can use your Gmail address as a way to prove who you are. To add your Gmail address as a way to sign in, go to *Manage how you sign in to Microsoft*."

**What this means in practice**: each tester goes to **https://account.microsoft.com** and creates a brand-new Microsoft account using their Gmail address as the primary alias. The MSA is then identified by the Gmail string. Partner Center matches testers by this exact email — that's all it cares about.

### 5.2 Create a Microsoft Account per tester

For each tester (or each of your clone Gmail addresses if you're self-testing):

1. Open **https://account.microsoft.com** in an **incognito/private window**
2. Click **"Create one"** → **"Get a new email address"** is **wrong**; choose **"Use an email you already have"** and enter the Gmail address
3. Set a password, complete MFA (authenticator app or SMS)
4. Optionally: add a recovery email / phone

> The MSA does **not** need ID verification. Only the **developer's** account does.

### 5.3 Create a Known User Group in Partner Center

1. In Partner Center, your app → **Pricing and availability**
2. Under **Visibility** → **Audience**, select **Private audience**
3. You'll be prompted to pick or create a **Known user group**
4. Create a group named e.g. `internal-testers` (or `gmail-clones` if self-testing)
5. Paste the Gmail addresses **one per line** (the addresses, not the full MSA profiles)
6. Save the group

### 5.4 What the tester needs to do

Once your app is published to the Private audience:

1. **On their Windows 10/11 device**, open the Microsoft Store app
2. Click the profile icon → **Sign in** → sign in with **the MSA you added to the group** (not their personal MSA)
3. Open the **private link** you provide (see §5.5) in a browser
4. Click **"Get"** → installs

> The same physical device can be used to test multiple MSAs — just sign out of the Store and sign in with the next one.

### 5.5 Where to find the private link

Two places:
1. In the submission confirmation, after the app passes certification, Partner Center displays the private link.
2. Anytime after publishing, go to **App identity** page → look for **"URL if your app is only visible to certain people (requires authentication)"**. This is the URL testers need.

The regular Store URL will **not** work for private listings. Only the special URL works.

### 5.6 Verifying the tester experience

After your testers install, validate:

- ✅ Install completes successfully
- ✅ The app is launchable
- ✅ The app's first-run flow works (empty journal_dir → onboarding)
- ✅ Updates work (submit a new package → tester gets the update)
- ✅ Uninstall works (Settings → Apps → Campfire → Uninstall)
- ✅ The same private link returns "not found" / "not authorized" when opened by a non-test MSA

---

## 6. Submission package: building the MSI for the Store

### 6.1 What Tauri 2 produces (and what the Store accepts)

Tauri 2's `tauri build` produces only:
- A Windows Installer **`.msi`** (WiX) — the Store accepts this when you register the product as an **"EXE or MSI app"** in Partner Center
- A **`.exe` NSIS installer** — alternative for direct (non-Store) distribution

> The Store does **not** require MSIX for Win32 / Tauri apps. The MSIX-based ingestion path is for packaged UWP / WinUI / native-store apps. Tauri 2 explicitly does not support MSIX — see the [official Tauri 2 Microsoft Store guide](https://v2.tauri.app/distribute/microsoft-store/) (2026-06-15): *"Currently Tauri only generates EXE and MSI installers, so you must create a Microsoft Store application that only links to the unpacked application."*

### 6.2 Build the MSI for Store submission

> **WebView2 install mode** — the Store requires the Windows installer to use the **offline WebView2 installer** (so the user's machine doesn't need an internet connection during install). Create a separate Tauri config that overrides `bundle.windows.webviewInstallMode`, then merge it for Store builds:

Create [desktop/src-tauri/tauri.microsoftstore.conf.json](desktop/src-tauri/tauri.microsoftstore.conf.json):

```json
{
  "bundle": {
    "publisher": "Your Publisher Name",
    "windows": {
      "webviewInstallMode": {
        "type": "offlineInstaller"
      }
    }
  }
}
```

> **Publisher name cannot match the product name.** "Campfire" is the product name, so pick something different (e.g. your name, a company, or "Campfire Project"). This field is required for the Store even if you skip the override config — Tauri will derive it from the second part of `com.campfire.app` (which would be "campfire" and would conflict).

Then build the offline-installer MSI:

```powershell
cd d:\program\Campfire\desktop
pnpm tauri build -- --no-bundle
pnpm tauri bundle -- --config src-tauri/tauri.microsoftstore.conf.json
```

> **Single architecture is fine for v1.** The Store accepts a single-arch `.msi`. Tauri 2 does not produce a `.msixbundle` — you cannot multi-architecture-bundle an MSI in the same way as MSIX. If you want both x64 and ARM64, build twice and upload both `.msi` files as separate packages; Partner Center will serve the right one to each device.

The output goes to:
```
src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi
```

### 6.3 Signing

> For a public Store app, you don't need to bring your own code-signing cert — Microsoft signs the binary during Store ingestion. But Windows SmartScreen will show an "unknown publisher" warning on first launch of an unsigned MSI, which is bad UX for sideloaded copies (your §4 Stage 2 testers will see it). If you want a smooth first-launch experience, sign with a self-signed cert or an OV cert from a CA (e.g. Sectigo, DigiCert) and add to `tauri.conf.json > bundle.windows.certificateThumbprint` or `signCommand`.

### 6.4 Upload to Partner Center

In your submission's **Packages** step:
- Drag the `.msi` directly onto the upload zone.
- No zipping required.
- Partner Center validates the package structure, then assigns the architecture mappings.
- Provide the **silent install arguments** in the installer parameters: `msiexec /i <file> /quiet` → enter `/quiet` as the argument. (For the NSIS EXE, the argument is `/S` — uppercase S — see [Microsoft's silent-install docs](https://learn.microsoft.com/en-us/windows/uwp/publish/msiexe/provide-package-details).)

---

## 7. Submission walkthrough

Once your bundle is ready:

### 7.1 Create the app listing

1. Partner Center → **Apps and games** → **New app**
2. Enter the name **"Campfire"** (or your chosen name). If "Campfire" is taken, consider:
   - `Campfire Journal`
   - `Campfire AI`
   - `My Campfire`
3. Confirm reservation.

### 7.2 Fill in Store listing

Required for certification:

- **Product name** (max 200 chars)
- **Short description** (max 260 chars)
- **Full description** (max 10,000 chars)
- **App icon**: 300×300 PNG (also bundle icons in the MSI)
- **Screenshot 1** (1366×768 or 1920×1080 PNG/JPG) — at least 1, up to 10
- **Promotional art** (optional but recommended): 1200×630, 2400×1200
- **Category** (e.g. **Productivity**)
- **Subcategory** (e.g. **Notes & journals**)
- **Privacy policy URL** (required, even for apps that collect no data — see §12.4)
- **Support contact** (URL or email)
- **Copyright** (e.g. `© 2026 Your Name`)
- **Languages**: select all that your app supports (matches your i18n config)

### 7.3 Properties

- **Category**: Productivity
- **Subcategory**: Notes & journals
- **Pricing and availability**:
  - **Base price**: Free
  - **Markets**: all (or specific countries)
  - **Visibility**: **Private audience** → pick your `internal-testers` group
  - **Discoverability**: "Make this product available and discoverable in the Store" (default)
- **Age rating**: complete the IARC questionnaire (typically returns 3+, 7+, 12+)
- **Industry**: Software & Services → Productivity

### 7.4 Submission options

- **Hold publishing**: optional — you can hold the submission after cert passes, then manually publish. Useful for the first submission.
- **Publish date**: leave "As soon as possible" for Private testing.
- **"Make this product public on"** *(optional)*: set a date if you want a scheduled public release. After that UTC time, all future submissions default to Public.

### 7.5 Submit for certification

Click **"Submit for certification"**. Typical timeline:

- **Automated checks**: 5–30 minutes
- **Manual review** (rare for first-time simple apps): up to 72 hours
- **Result**: email + dashboard notification with pass/fail + any issues

If you see **"Failed certification"**, read the report carefully. Common issues:
- Privacy policy URL returns 404
- CSP missing or wrong
- App crashes on launch in a clean test environment
- Hidden functionality disclosed in the description vs actual app behavior
- Missing age rating

---

## 8. Going public

When your testers sign off and you're confident:

1. Partner Center → your app → **Update submission**
2. **Pricing and availability** → **Visibility** → **Audience** = **Public audience**
3. Submit for recertification (another ~24h typically)
4. Once passed, the app goes Public and is searchable in the Store

### What changes when you go Public

| Aspect | Effect |
|--------|--------|
| **Release date on listing** | Set to the date it was first published to Public. This is the date shoppers see. |
| **Private-tester reviews** | Visible to you in the Reviews report, **never published** to the Store listing. |
| **Updates** | Future submissions default to Public audience. |
| **Switching back** | **Impossible.** Once Public, always Public for that listing. |

### Scheduling a public launch

Two ways:

- **"Make this product public on"** (in the *initial Private* submission): sets a future UTC date; the app automatically flips to Public at that time.
- **Update submission**: create a new submission whenever you're ready, change to Public, optionally schedule a release date in the Schedule section.

---

## 9. Tauri-specific gotchas

Things that trip up Tauri apps specifically when going to the Microsoft Store.

### 9.1 Capabilities

Your [desktop/src-tauri/capabilities/default.json](desktop/src-tauri/capabilities/default.json) is minimal — perfect. Don't add permissions you don't use. The certifier reads these.

### 9.2 Window decorations

`tauri.conf.json` has `"devtools": false` (good for prod) but does not specify decoration. If your app's window decoration is custom, test it on a fresh Windows install — Store reviewers may have high DPI scaling set differently from you.

### 9.3 Single instance behavior

Tauri 2 apps default to multiple instances. The Store sometimes prefers single-instance behavior so the "Open in new window" UX is consistent. Add the single-instance plugin only if you actually need it.

### 9.4 Background processes

Tauri apps that spawn background processes (e.g. a local HTTP server for Ollama proxying) may need additional declaration in the manifest. The Store certifier inspects what the app actually does at runtime.

### 9.5 Crash reporting

If you want crash reports, use App Center, Sentry, or your own endpoint — **not** a Tauri shell exec. Direct shell commands trigger extra review scrutiny.

### 9.6 Bundle ID and reserved names

Once you publish an app named "Campfire" (or whatever name you choose), that name is reserved to your account. You can't have two apps with the same name. Pick carefully.

### 9.7 Icon sizes

`tauri.conf.json` lists:
- `icons/32x32.png`
- `icons/128x128.png`
- `icons/128x128@2x.png`
- `icons/icon.icns` (macOS — not needed for Windows Store)
- `icons/icon.ico` (Windows)

For Store submission you additionally need at least:
- 44×44, 150×150, 284×284, 310×310 PNGs (in the Store listing, separate from the MSI-bundled icons)

### 9.8 WebView2 runtime

Tauri 2 uses the system WebView2. Windows 11 ships with it; Windows 10 users may need to install it manually. The Store certifier expects WebView2 to be a system component. If a tester's machine is missing WebView2, the app shows a "missing runtime" error — the certifier might surface this as a fail on some Windows 10 builds. Consider checking for WebView2 and showing a friendly "install WebView2" message.

### 9.9 Native dependencies

Your `Cargo.toml` uses `tauri`, `tauri-plugin-opener`, `tauri-plugin-dialog`, `tauri-plugin-fs`, `reqwest`, `filetime`. None of these are flagged by the Store, but verify the compiled MSI is fully self-contained — no external DLL dependencies that aren't in system32.

### 9.10 Obfuscated JS

Your `build` script runs `javascript-obfuscator` on `dist/assets`. This is fine for IP protection but means debugging production crashes is harder. Make sure the **un-obfuscated** dev build is also tested (Stage 1 above).

---

## 10. Companion PWA on Cloudflare Pages

The mobile app is a separate codebase published via Cloudflare Pages, not the Microsoft Store. This is the right architecture — PWAs don't need app-store review, and you can iterate instantly.

### 10.1 PWA requirements checklist

- ✅ `manifest.webmanifest` with: name, short_name, start_url, display=standalone, theme_color, background_color, icons (192×192 + 512×512 minimum)
- ✅ Service worker registered (your `vite-plugin-pwa` setup should do this)
- ✅ HTTPS (Cloudflare Pages gives you this automatically)
- ✅ Responsive viewport meta tag (`width=device-width, initial-scale=1`)
- ✅ Offline-capable first load (cache the JS bundle)
- ✅ Privacy policy linked from Settings
- ✅ Terms of use linked from Settings

### 10.2 Cloudflare Pages env vars (you already have this)

```
VITE_GOOGLE_CLIENT_ID = 433210406598-... (Web OAuth client)
```

**Important**: anything prefixed `VITE_` is bundled into the public JS. Treat as public. Don't add any `VITE_*` secrets.

### 10.3 OAuth client configuration

The mobile PWA uses a **Web OAuth client** in Google Cloud Console (different from the desktop's "Desktop app" client).

In Google Cloud Console → your Web client:

- **Authorized JavaScript origins**:
  - `https://<your-subdomain>.pages.dev`
  - `https://your-custom-domain.com` (if you have one)
- **Authorized redirect URIs**: typically empty for the GIS `initTokenClient` flow (token-client handles it implicitly)

### 10.4 Adding the PWA to the Microsoft Store later (optional)

You can wrap your PWA in a TWA (Trusted Web Activity) for Play Store, and similarly submit it as a PWA to the Microsoft Store via the **PWA app type** in Partner Center. If you ever do this, use the [PWA visibility options](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/pwa/visibility-options) page instead.

### 10.5 PWA install instructions for users

For your testers to install the mobile PWA on their phone:

- **iOS Safari**: tap Share → "Add to Home Screen"
- **Android Chrome**: menu (⋮) → "Install app"

---

## 11. OAuth security for distributed binaries

This deserves its own section because getting it wrong is the #1 cause of post-publish Store removals.

### 11.1 What can and cannot be public

| Item | Can it be public? | Where it goes in your build |
|------|-------------------|------------------------------|
| OAuth **Client ID** (`433210406598-…`) | ✅ Yes, meant to be public | `VITE_GOOGLE_CLIENT_ID` env var → bundled in JS |
| OAuth **Client Secret** | ❌ **Never** in a public client | Should not exist for Desktop app type |
| **Refresh token** | ❌ Store in OS keychain, not localStorage | Use Tauri stronghold plugin or OS credential store |
| **Access token** | Sensitive; OK in memory | OK in Tauri state for the session |

### 11.2 The rule of thumb

> If your app is **distributed** to people who didn't compile it themselves, treat every string in the bundle as world-readable.

The Store certifier (and Google's automated scanners) actively look for known credential patterns. Hitting them = a swift policy violation.

### 11.3 What to do today

1. **Do not remove `VITE_GOOGLE_CLIENT_SECRET`** — Google's "Desktop app" OAuth client requires the secret in the token-exchange call (despite the misleading name). Verified directly against `https://oauth2.googleapis.com/token` error responses in 2026-07. The build-time bake pattern (§3.1) is the secure way: `desktop/src-tauri/build.rs` reads `desktop/.env` and emits `cargo:rustc-env VITE_GOOGLE_CLIENT_SECRET=...` so the secret lands only in the compiled `tauri-app.exe`. The frontend must never read `VITE_GOOGLE_CLIENT_SECRET` — only the Rust token-exchange command does, via `env!()`.
2. Move any stored access tokens out of `localStorage` and into the Tauri secure store.
3. Audit `mobile/src/services/googleDrive.ts` — your mobile app currently stores `accessToken` in `localStorage` (line 13-14). For a PWA this is somewhat unavoidable, but you should:
   - Keep the token expiry short (you already do: 1 hour)
   - Don't store the refresh token at all (you don't, since GIS handles re-auth on expiry)
   - Consider using `sessionStorage` instead of `localStorage` for extra defense

### 11.4 OAuth redirect flow on Tauri

For the desktop build, your Tauri command `start_gdrive_auth` ([desktop/src/services/googleDrive.ts:22](desktop/src/services/googleDrive.ts#L22)) likely uses either:

- **Loopback redirect** (`http://127.0.0.1:<port>/callback`) — recommended for desktop
- **Out-of-band / custom scheme** (`yourapp://callback`) — also fine

For loopback: add `http://127.0.0.1` to the **Authorized redirect URIs** in your Google Cloud Console "Desktop app" OAuth client.

---

## 12. Pre-submission checklist (Store cert 2026)

Use this on every submission. The Store certifier is strict and you don't want a 24-72 hour fail loop.

### 12.1 Code-level

- [ ] No `google_drive_client_secret` references in code
- [ ] CSP set in `tauri.conf.json` (not `null`)
- [ ] Tauri capabilities are minimal — every permission is used
- [ ] No `console.log` in production bundle
- [ ] No `devtools: true` in production
- [ ] Auto-updater disabled or gated to non-Store builds
- [ ] `pnpm typecheck` passes
- [ ] `pnpm i18n:check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds

### 12.2 App identity & metadata

- [ ] App name reserved and unique
- [ ] App icon at 300×300 PNG (Store listing) + full icon set in the MSI
- [ ] At least 1 screenshot (1366×768 or 1920×1080), 3+ recommended
- [ ] Category + subcategory selected
- [ ] Age rating questionnaire completed
- [ ] Copyright info filled
- [ ] All supported languages declared
- [ ] Support contact URL or email provided
- [ ] Privacy policy URL provided (HTTPS, returns 200)

### 12.3 Functional

- [ ] App launches on a clean Windows 10/11 device with no prior data
- [ ] First-run onboarding triggers when `journal_dir` is empty
- [ ] App doesn't crash on tab-switch, view-switch, or window-resize
- [ ] Mouse back/forward buttons work
- [ ] Ctrl+scroll zoom works and persists
- [ ] Donate banner triggers at count ≥10 OR streak ≥30
- [ ] Donate banner "Maybe later" + "Don't ask" persist correctly
- [ ] All modals (About, Feedback, Help, Error, Sync, Import) open and close
- [ ] Side-load MSI installs cleanly
- [ ] Side-load MSI uninstalls cleanly

### 12.4 Privacy policy

Required even if you don't collect data. Minimal viable privacy policy for Campfire:

```markdown
# Privacy Policy for Campfire

Last updated: [DATE]

Campfire ("the App") is a personal journaling tool. This privacy policy
describes what data the App accesses and how it is handled.

## Data stored locally

The App stores your journal entries as plain Markdown files in a directory
you choose on your computer. The App does not upload your journal entries
to any server operated by the developer.

## Google Drive sync (opt-in)

If you enable Google Drive sync in the App's Settings:

- The App reads and writes files **only inside a single folder it creates
  in your own Google Drive**, named "Campfire".
- The App uses Google OAuth to authenticate. Your access token is held
  in memory and (optionally) in your operating system's secure storage.
- The App does **not** access any other Google Drive files.
- You can revoke access at any time from your Google Account settings:
  https://myaccount.google.com/permissions

## Network requests

The App makes network requests to:

- Google APIs (oauth2.googleapis.com, www.googleapis.com) — for Drive sync
  (if enabled) and OAuth authentication
- The configured AI provider (e.g. Ollama, Gemini) — for chat / reflection
  features
- The configured search engine (Mojeek, Google) — for the Search view
- Microsoft Store licensing APIs (for paid apps / subscriptions; the App
  itself does not collect analytics)

The App does not include analytics, telemetry, or advertising SDKs.

## Children

The App is not directed at children under 13.

## Changes to this policy

Updates will be posted at this URL with a revised "Last updated" date.

## Contact

For privacy questions: [your-email]
```

Host this on GitHub Pages (free) or your own domain. Point the Store listing to the rendered URL.

### 12.5 Distribution channel declarations

In the Store listing's **Properties** section, declare:
- All third-party SDKs you ship (Google APIs, Ollama, Mojeek, etc.)
- Whether the app accesses account data (yes, Google Drive — declare as such)
- Whether the app supports in-app purchases (no, unless you add them)

---

## 13. Troubleshooting

### "I get the Microsoft for your business form instead of the dev form"

→ You're at the wrong URL. Use **https://storedeveloper.microsoft.com**, not signup.microsoft.com.

### "I created an MSA with my Gmail, but Partner Center says the email isn't valid for a Known User Group"

→ Make sure the MSA is fully created (you can sign in to it) and that you're pasting the **Gmail address as the alias** (e.g. `user@gmail.com`), not a different alias the user added later. Partner Center matches by the exact string you put in the group.

### "ID verification is rejecting my passport"

→ Common causes: photo too dark, glare on the document, selfie not matching the photo. Try with better lighting, no flash, and re-do the selfie.

### "I can't find the private Store link"

→ Partner Center → your app → **App identity** → look for **"URL if your app is only visible to certain people (requires authentication)"**. Don't use the regular Store URL.

### "My tester installed the app but it's not in their Microsoft Store library"

→ They must be signed in to the **Microsoft Store app** (not the Microsoft account website) with the same MSA that you added to the Known User Group.

### "Certification failed: privacy policy unreachable"

→ The Store bot crawls your privacy URL during cert. Make sure it returns 200, is HTTPS, and doesn't require JS to render content. A plain Markdown page on GitHub Pages is ideal.

### "Certification failed: app crashes on launch"

→ The certifier runs your MSI in a clean Windows VM. Most common cause: a missing `localStorage` check, a `await` on something that doesn't exist on first run, or a feature flag assuming user data exists. Test your **side-loaded** MSI on a clean Windows VM (or just a freshly-created local user account) before submitting.

### "I accidentally published to Public. Can I go back to Private?"

→ **No.** Per Microsoft docs: *"If you submit a product with this option set to Public audience, you can't choose Private audience in a later submission."* You'll have to create a new app listing if you want Private testing again.

### "The name 'Campfire' is taken on the Store"

→ Common alternatives: `Campfire Journal`, `Campfire AI`, `Campfire: Past You`, `Campfire Notes`. Pick one before your first submission.

### "My Vite-built JS bundle is huge / slow to load"

→ Make sure your Tauri build is using the **release target**, not dev. `pnpm release` (which calls `tauri build`) does this. Don't ship `pnpm build` (Vite) output alone — it lacks the Rust backend.

---

## Appendix A: Quick command reference

```powershell
# Stage 1 — dev
cd d:\program\Campfire\desktop
pnpm tauri dev

# Stage 1 — automated checks
pnpm typecheck
pnpm i18n:check
pnpm test

# Stage 2 — local MSI
pnpm release
msiexec /i ".\src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi" /quiet

# Stage 2 — uninstall
msiexec /x '.\src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi' /quiet
# (or: Get-Package -Name "Campfire" | Uninstall-Package)

# Stage 3 — Store-ready MSI (x64, with offline WebView2)
pnpm tauri build -- --no-bundle
pnpm tauri bundle -- --config src-tauri/tauri.microsoftstore.conf.json

# Stage 3 — Store-ready MSI (ARM64)
rustup target add aarch64-pc-windows-msvc
pnpm tauri build -- --target aarch64-pc-windows-msvc -- --no-bundle
pnpm tauri bundle -- --config src-tauri/tauri.microsoftstore.conf.json

# Companion PWA deploy
cd d:\program\Campfire\mobile
pnpm build
# Cloudflare Pages auto-deploys on push to master (per your build config)
```

## Appendix B: Glossary

| Term | Meaning |
|------|---------|
| **MSA** | Microsoft Account (the personal account you use to sign in to Windows, Outlook, Xbox, etc.) |
| **Partner Center** | Microsoft's web dashboard for app publishers |
| **MSI** | Windows Installer (`.msi`) — what Tauri 2 produces and what the Microsoft Store accepts for Win32 apps (register as "EXE or MSI app") |
| **NSIS** | Nullsoft Scriptable Install System — produces the `.exe` installer Tauri 2 also generates, for direct (non-Store) distribution |
| **MSIX** | Windows app package format — Tauri 2 does **not** produce these; relevant for UWP / WinUI / native Store apps only |
| **Private audience** | Store visibility mode where only Known User Group members can install |
| **Known user group** | A list of MSA emails allowed to install a private-audience app |
| **PWA** | Progressive Web App — installable website that works offline |
| **TWA** | Trusted Web Activity — PWA wrapped for Play Store |
| **GIS** | Google Identity Services — Google's modern OAuth library for browser/desktop |
| **CSP** | Content Security Policy — a browser security header |
| **D-U-N-S** | Dun & Bradstreet business ID (only needed for Company account, not Individual) |
| **IARC** | International Age Rating Coalition — used to compute age ratings from a questionnaire |

---

## Appendix C: Source-of-truth doc URLs (verify before major changes)

- Free registration for individuals: https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-individual-developer
- Open developer account (full): https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account
- MSIX visibility options (only if you ever switch to an MSIX-based Store app): https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/visibility-options
- PWA visibility options: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/pwa/visibility-options
- Beta testing & targeted distribution: https://learn.microsoft.com/en-us/windows/apps/publish/beta-testing-and-targeted-distribution
- Pricing and availability: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/price-and-availability
- App submissions overview: https://learn.microsoft.com/en-us/windows/apps/publish/app-submissions
- Microsoft Store policies: https://learn.microsoft.com/en-us/windows/apps/publish/store-policies
- Tauri 2 Microsoft Store guide (MSI-based): https://v2.tauri.app/distribute/microsoft-store/

---

## 14. Self-check cheatsheet (commands you can re-run)

Use this section to re-verify the app on any future build. Every command is a copy-paste from `d:\program\Campfire`. Run them in order. If any step fails, **stop and fix it before proceeding to the next one** — they're ordered from cheapest to most expensive.

### 14.1 Pre-flight gates (no build, ~30 s)

Run from the repo root `d:\program\Campfire`:

```powershell
# TypeScript typecheck (frontend)
pnpm typecheck

# i18n completeness — every key referenced in code must exist in every locale
pnpm i18n:check

# Unit tests (Vitest, both workspaces)
pnpm test

# Rust syntax / type check (no link, no codegen — fast)
cd desktop\src-tauri
cargo check
cd ..\..
```

All four must exit `0` with no warnings beyond the known `com.campfire.app` identifier warning (Tauri 2's macOS bundle-extension check, not a Windows issue — see §9.7).

### 14.2 Dev mode (manual, ~5 min)

```powershell
cd desktop
pnpm tauri dev
```

Walk through every view listed in [§4 Stage 1](#stage-1--dev-mode). Use `Ctrl+Shift+I` to open the WebView dev tools and confirm:
- No CSP errors in the console (the `connect-src` in §3.2 should cover everything you call)
- No 404s on bundled assets (Tauri 2 inlines them into `tauri-app.exe` in release, so dev uses the Vite server — a dev 404 is usually a missing import, not a bundle bug)
- Ollama status poll updates the sidebar in real time

When done, `Ctrl+C` to kill the watcher, then:
```powershell
Get-Process -Name tauri-app,esbuild -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 14.3 Release build (MSI + NSIS, ~3 min on warm cache)

```powershell
cd desktop
pnpm release
```

Verify both artifacts exist:
```powershell
Test-Path .\src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi   # expect True
Test-Path .\src-tauri\target\release\bundle\nsis\Campfire_0.1.0_x64-setup.exe  # expect True
Get-ChildItem .\src-tauri\target\release\bundle\*\*.msi,\.\src-tauri\target\release\bundle\*\*.exe |
    Select-Object FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}} |
    Format-Table -AutoSize
# Expected sizes: MSI ~5 MB, NSIS ~4 MB
```

### 14.4 Sideload smoke test (NSIS, no admin, ~15 s)

```powershell
# Install
Start-Process -FilePath .\src-tauri\target\release\bundle\nsis\Campfire_0.1.0_x64-setup.exe -ArgumentList @('/S') -Wait

# Confirm the install location and registry entry
$install = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' |
    Where-Object { $_.DisplayName -eq 'Campfire' } | Select-Object -First 1
$install | Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation | Format-List
Get-ChildItem $install.InstallLocation.Trim('"') | Format-Table -AutoSize
# Expect: 2 files (tauri-app.exe + uninstall.exe) at $env:LOCALAPPDATA\Campfire
```

Launch the installed binary:
```powershell
$proc = Start-Process -FilePath (Join-Path $install.InstallLocation.Trim('"') 'tauri-app.exe') -PassThru
Start-Sleep -Seconds 6
$proc | Select-Object Id, @{N='Title';E={$_.MainWindowTitle}}, @{N='Running';E={-not $_.HasExited}}
Stop-Process -Id $proc.Id -Force
```
`Title` should be `Campfire` and `Running` should be `True`. If `Title` is empty, the WebView failed to load (CSP / asset 404 / WebView2 missing) — see [§9.8](#98-webview2-runtime) and the dev console.

Uninstall (leaves the system clean):
```powershell
& (Join-Path $install.InstallLocation.Trim('"') 'uninstall.exe') /S
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' |
    Where-Object { $_.DisplayName -eq 'Campfire' } | Format-List
# Expect: nothing (the registry entry is gone)
```

### 14.5 Store MSI build (offline WebView2, ~3 min)

```powershell
cd desktop
pnpm tauri build -- --no-bundle
pnpm tauri bundle -- --config src-tauri/tauri.microsoftstore.conf.json
```
Verify the Store-specific MSI:
```powershell
Get-ChildItem .\src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi |
    Select-Object FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}} |
    Format-Table -AutoSize
# Size should be ~130 MB (it's the offline WebView2 + 14 MB EXE bundled)
```
The Store uploads this file directly. See [§6.4](#64-upload-to-partner-center) for the upload step.

### 14.6 MSI install (admin-only, optional pre-Store check)

The Store does this for you, so this is only for paranoid local verification. Run from an **elevated** PowerShell:

```powershell
Start-Process msiexec.exe -ArgumentList @(
    '/i',  '.\src-tauri\target\release\bundle\msi\Campfire_0.1.0_x64_en-US.msi',
    '/quiet', '/norestart', '/l*v', "$env:TEMP\campfire_install.log"
) -Verb RunAs -Wait
Get-Content "$env:TEMP\campfire_install.log" -Tail 20
# Expect: "Installation completed successfully" or similar
# If you see Error 1925 / 1603, you forgot the elevation.
```

### 14.7 Sanity-recap

After all of the above, the app is **ready for §5 Private audience** submission to Partner Center if:

| Check | Result |
|-------|--------|
| §14.1 typecheck, i18n, test, cargo check | all `0` |
| §14.2 dev mode walk-through | no console errors |
| §14.3 release build artifacts | MSI + NSIS both exist |
| §14.4 NSIS sideload + launch | window title = `Campfire`, no exit |
| §14.5 Store MSI build | ~130 MB file exists |
| §12 pre-submission checklist | all items checked |

If any of these is false, the §3 / §4 work isn't done yet — go back and fix it before you spend the 24-72 h on cert.

---

*End of guide. Saved at `docs/microsoft_store_publishing_guide_2026.md`.*
