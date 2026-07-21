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
6. [Submission package: building the MSIX](#6-submission-package-building-the-msix)
7. [Submission walkthrough](#7-submission-walkthrough)
8. [Going public](#8-going-public)
9. [Tauri-specific gotchas](#9-tauri-specific-gotchas)
10. [Companion PWA on Cloudflare Pages](#10-companion-pwa-on-cloudflare-pages)
11. [OAuth security for distributed binaries](#11-oauth-security-for-distributed-binaries)
12. [Pre-submission checklist (Store cert 2026)](#12-pre-submission-checklist-store-cert-2026)
13. [Troubleshooting](#13-troubleshooting)

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

Your current desktop app accepts a `google_drive_client_secret` from user input ([desktop/src/components/settings/IdentitySection.tsx:234-235](desktop/src/components/settings/IdentitySection.tsx#L234-L235), [desktop/src/types.ts:13-14](desktop/src/types.ts#L13-L14), [desktop/src/store/domains/syncSlice.ts:142-143](desktop/src/store/domains/syncSlice.ts#L142-L143)). **Remove this entirely** before publishing.

For a desktop app distributed via the Store:

- Use OAuth Client type = **"Desktop app"** in Google Cloud Console (not "Web application").
- A Desktop app client **does not use a client secret** in the standard OAuth flow — the Google Identity Services library handles token exchange without one.
- Your **own** Client ID may be baked into the bundle via `VITE_GOOGLE_CLIENT_ID` (Client IDs are meant to be public).
- **Never** ship a `VITE_GOOGLE_CLIENT_SECRET` in the bundle, and never accept one from user input.

**Files to modify** (removing `google_drive_client_secret` references):

```
desktop/src/types.ts                                  (line 14)
desktop/src/hooks/useConfig.ts                        (line 23)
desktop/src/store/domains/configSlice.ts              (line 58)
desktop/src/store/domains/syncSlice.ts                (lines 142-143)
desktop/src/components/settings/IdentitySection.tsx   (line 235)
```

### 3.2 Content Security Policy (CSP)

Your `tauri.conf.json` has `"csp": null`. Replace with an explicit CSP before submitting:

```json
"security": {
  "csp": "default-src 'self'; img-src 'self' data: https:; connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://www.mojeek.com https://api.mojeek.com; style-src 'self' 'unsafe-inline'; script-src 'self'"
}
```

Adjust the `connect-src` list to match every endpoint your app actually calls. The certifier flags missing CSPs in 2026.

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

Your identifier is `com.pastyou.app` ([desktop/src-tauri/tauri.conf.json](desktop/src-tauri/tauri.conf.json)). **Once submitted, this cannot be changed without a new listing.** Make sure you're happy with it. Note: this is the *package identity*, not the *display name* "Campfire".

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
[2] Local MSIX build + side-load (no Store)
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

### Stage 2 — Local MSIX build + side-load

This is the critical pre-Store gate. No Partner Center involvement, no cert wait, instant install.

```powershell
cd d:\program\Campfire\desktop
pnpm release
```

Output lands in:
```
desktop\src-tauri\target\release\bundle\
  ├── msi\          (Windows Installer .msi)
  ├── nsis\         (NSIS .exe installer)
  └── msix\         (MSIX package — what Store needs)
```

Sideload:

```powershell
# Enable Developer Mode: Settings → Privacy & security → For developers → Developer Mode = On
Add-AppxPackage -Path ".\src-tauri\target\release\bundle\msix\Campfire_0.1.0_x64.msix"
```

**What this stage catches**:
- Tauri 2 MSIX packaging quirks
- Icon resolution issues (check that all sizes in `tauri.conf.json:24-31` exist)
- First-run flow on a clean machine (empty `journal_dir` triggers onboarding)
- App uninstall: `Get-AppxPackage -Name "Campfire" | Remove-AppxPackage`

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

## 6. Submission package: building the MSIX

### 6.1 What Tauri produces

Tauri 2's `tauri build` produces:
- A local-installable `.msix` (good for sideloading, **not** for Store upload)
- The Store wants a `.msixbundle` or `.msixupload` (multi-architecture + signed)

### 6.2 Build for Store

For a single-architecture build:

```powershell
cd d:\program\Campfire\desktop
pnpm tauri build -- --target x86_64-pc-windows-msvc
```

For both x64 and ARM64 (recommended for max reach):

```powershell
# First time only: install the target
rustup target add x86_64-pc-windows-msvc
rustup target add aarch64-pc-windows-msvc

# Build both
pnpm tauri build -- --target x86_64-pc-windows-msvc
pnpm tauri build -- --target aarch64-pc-windows-msvc

# Bundle into a .msixbundle (Tauri 2 does this automatically when you specify --target and have both built)
```

The output goes to `src-tauri/target/<triple>/release/bundle/msix/`. Look for the `.msixbundle` (multi-arch) or `.msix` (single-arch) file.

> **Note on signing**: Tauri 2 can sign the bundle for you if you provide a code-signing cert in `tauri.conf.json`'s `bundle.windows.signingIdentity` or `bundle.windows.certificateThumbprint`. For a public Store app, you don't need to bring your own cert — Microsoft signs it during the Store ingestion process.

### 6.3 Upload to Partner Center

In your submission's **Packages** step:
- Drag the `.msixbundle` (or `.msix`) directly onto the upload zone.
- No zipping required.
- Partner Center validates the bundle structure, then assigns the architecture mappings.

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
- **App icon**: 300×300 PNG (also bundle icons in MSIX)
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
- 44×44, 150×150, 284×284, 310×310 PNGs (in the Store listing, separate from MSIX icons)

### 9.8 WebView2 runtime

Tauri 2 uses the system WebView2. Windows 11 ships with it; Windows 10 users may need to install it manually. The Store certifier expects WebView2 to be a system component. If a tester's machine is missing WebView2, the app shows a "missing runtime" error — the certifier might surface this as a fail on some Windows 10 builds. Consider checking for WebView2 and showing a friendly "install WebView2" message.

### 9.9 Native dependencies

Your `Cargo.toml` uses `tauri`, `tauri-plugin-opener`, `tauri-plugin-dialog`, `tauri-plugin-fs`, `reqwest`, `filetime`. None of these are flagged by the Store, but verify the compiled MSIX is fully self-contained — no external DLL dependencies that aren't in system32.

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

You can wrap your PWA in a TWA (Trusted Web Activity) for Play Store, and similarly submit it as a PWA to the Microsoft Store via the **PWA app type** in Partner Center. If you ever do this, use the [PWA visibility options](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/pwa/visibility-options) page instead of the MSIX one.

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

1. Remove `google_drive_client_secret` from the desktop app entirely (§3.1).
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
- [ ] App icon at 300×300 PNG (Store listing) + full icon set in MSIX
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
- [ ] Side-load MSIX installs cleanly
- [ ] Side-load MSIX uninstalls cleanly

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

→ The certifier runs your MSIX in a clean Windows VM. Most common cause: a missing `localStorage` check, a `await` on something that doesn't exist on first run, or a feature flag assuming user data exists. Test your **side-loaded** MSIX on a clean Windows VM (or just a freshly-created local user account) before submitting.

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

# Stage 2 — local MSIX
pnpm release
Add-AppxPackage -Path ".\src-tauri\target\release\bundle\msix\Campfire_0.1.0_x64.msix"

# Stage 2 — uninstall
Get-AppxPackage -Name "Campfire" | Remove-AppxPackage

# Stage 3 — Store-ready bundle (x64)
pnpm tauri build -- --target x86_64-pc-windows-msvc

# Stage 3 — Store-ready bundle (ARM64)
rustup target add aarch64-pc-windows-msvc
pnpm tauri build -- --target aarch64-pc-windows-msvc

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
| **MSIX** | Windows app package format (modern replacement for MSI) |
| **MSIX bundle** (`.msixbundle`) | Multi-architecture MSIX (x64 + ARM64 in one file) |
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
- MSIX visibility options: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/visibility-options
- PWA visibility options: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/pwa/visibility-options
- Beta testing & targeted distribution: https://learn.microsoft.com/en-us/windows/apps/publish/beta-testing-and-targeted-distribution
- Pricing and availability: https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/price-and-availability
- App submissions overview: https://learn.microsoft.com/en-us/windows/apps/publish/app-submissions
- Microsoft Store policies: https://learn.microsoft.com/en-us/windows/apps/publish/store-policies
- Tauri 2 MSIX guide: https://v2.tauri.app/distribute/sign/windows/

---

*End of guide. Saved at `docs/microsoft_store_publishing_guide_2026.md`.*
