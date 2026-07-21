# Guide: Google OAuth Verification & Production Launch

This guide details the step-by-step process required to verify your Google OAuth client IDs and launch the Google Drive sync feature to the public (Microsoft Store & Cloudflare Pages) so that normal users can log in with a single click.

---

## 📋 Why Verification is Required
When your Google Cloud project is in the **Testing** status:
1. Only manually added "Test Users" (up to 100 maximum) are allowed to authorize the app.
2. All other users will see a hard block screen ("Access Blocked: Project has not completed Google verification").
3. Users who are added as testers will still see a scary "This app is not verified" safety warning.

By transitioning your project to **In Production** and obtaining **Google OAuth Verification**, you remove all user caps, remove safety warning dialogs, and allow any user to sign in and sync automatically.

---

## 🔒 Step 1: Secure Code Scopes
We have successfully reduced the OAuth scopes requested by both the **PWA** and **Tauri Desktop** clients from the broad `drive` scope to the compliance-friendly `drive.file` scope:
- **Scope Used**: `https://www.googleapis.com/auth/drive.file`
- **Why this matters**: This scope only grants Campfire access to files/folders it created itself. Because it is classified by Google as a **Non-Sensitive** scope rather than a **Restricted** scope, verification is **100% free** and **does not require** an expensive, complex annual third-party CASA security assessment.

---

## ⚙️ Step 2: Prepare Consent Screen Branding & Assets
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and select your project.
2. Navigate to **APIs & Services** > **OAuth consent screen** (or **Branding**).
3. Fill out the application details:
   * **App name**: `Campfire`
   * **User support email**: Your support email address.
   * **App logo**: Upload your branding image (e.g., `my_logo_small.png`).
   * **Application home page**: `https://app-campfire.pages.dev` (or your custom domain).
   * **Application privacy policy link**: `https://app-campfire.pages.dev/privacy/` (Matches the static page deployed in PWA).
   * **Application terms of service link**: `https://app-campfire.pages.dev/terms/` (Matches the static page deployed in PWA).
   * **Authorized domains**: Add your specific subdomain (e.g., `app-campfire.pages.dev`) rather than the root `pages.dev` (as Google blocks registering public suffixes directly).

---

## 🛡️ Step 3: Configure Scopes & User Audience
1. Go to the **Audience** (or Publishing status) tab:
   * Set **User type** to **External**.
   * Change status from **Testing** to **In Production** (by clicking the **Publish App** button).
2. Go to the **Data access** (Scopes) tab:
   * Click **Add or remove scopes**.
   * Add the scope: `.../auth/drive.file` (Google Drive API - View and manage Google Drive files and folders that you have opened or created with this app).
   * Verify it appears under the "Your non-sensitive scopes" list.

---

## 📝 Step 4: Submit for Verification
Once your consent screen status is set to "In Production":
1. Click **Submit for verification** on the OAuth Consent Screen dashboard page.
2. Google will ask you to justify why you need the `drive.file` scope. Write a simple, clear explanation:
   > "Campfire is an offline-first diary and journal application. We use the `drive.file` permission to let users sync their journal entries securely to their personal Google Drive folder (`CampfireJournal`). The app only reads and writes files created by itself, maintaining user privacy."
3. Google requires a **demo video** to check that your sync implementation behaves exactly as described:
   * Record a short (1-2 minute) screencast showing:
     * Open your live PWA link (`https://app-campfire.pages.dev`) in a browser window.
     * Click **Settings** and then click **Sign in with Google**.
     * The Google Login consent screen must appear. **IMPORTANT**: Highlight or point out the address bar URL, which shows your Google Cloud Project's Client ID (e.g., `client_id=xxxxxx.apps.googleusercontent.com`), showing that it matches the console.
     * Log in and show the consent prompt for the `drive.file` scope.
     * Complete the sign-in, save a journal entry, click **Sync**, and open your Google Drive to show that a folder named `CampfireJournal` was created with the journal markdown files inside it.
   * Upload the video to YouTube as **Unlisted** (or to Google Drive as public link) and provide the URL in the verification form.

---

## ⏳ Step 5: Approval & Go-Live
* Google's Trust & Safety team will review your submission. The review usually takes **3-7 days**.
* If they email you asking for clarifications, reply promptly explaining that all operations happen purely client-side to safeguard user privacy.
* Once approved, the safety warning block will disappear, and any user will be able to sync their diaries using Google Sign-In with a single click.
