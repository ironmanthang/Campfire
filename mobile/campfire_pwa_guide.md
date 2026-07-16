# Guide: Google Auth Platform Setup & Cloudflare Pages Deployment

This guide outlines the exact, step-by-step instructions to configure Google Drive Sync for **Campfire** and host the mobile PWA on Cloudflare Pages for free.

---

## 🔑 Part 1: Setting up Google Auth Platform (OAuth Client ID)

Since you are in the new **Google Auth Platform** interface, follow these steps in order:

### 1. Enable the Google Drive API
You must enable Google Drive integrations in your project first, otherwise synchronization requests will be blocked.
1. In the top search bar of the Google Cloud Console, search for **`Google Drive API`**.
2. Click on the **Google Drive API** result under APIs & Services.
3. Click the blue **Enable** button. Wait a moment for it to complete.

### 2. Configure branding
1. In the left sidebar, click on **Branding**.
2. **App name:** Enter `Campfire`.
3. **User support email:** Select your Google email address from the dropdown.
4. **App logo:** Upload your newly resized `my_logo_small.png` (27 KB).
5. **Developer contact information:** Type in your email address.
6. Click **Save** at the bottom.

### 3. Configure Audience (Very Important)
Because the app is in development, Google requires you to explicitly whitelist who can log in.
1. Click on the **Audience** tab in the left sidebar.
2. Under **User type**, select **External**.
3. Under **Test users**, click **Add Users**.
4. Type in your own Google email address (and any other emails you want to test on). 
5. Click **Save**.

### 4. Configure Data access (Scopes)
1. Click on the **Data access** tab in the left sidebar.
2. Click **Add or remove scopes** on the dashboard.
3. In the right panel search bar, search for `drive`.
4. Check the box for **`.../auth/drive.file`** (Google Drive API - View and manage Google Drive files and folders that you have opened or created with this app).
5. Scroll down to the bottom of the panel and click **Save/Update**.
6. Verify `.../auth/drive.file` appears under the "Your sensitive scopes" list. Click **Save** on the main page.

### 5. Create the Web Client ID
1. Click on the **Clients** tab in the left sidebar.
2. Click **Create Client** $\rightarrow$ select **Web application**.
3. **Name:** `Campfire PWA`.
4. **Authorized JavaScript origins:** Click **+ Add URI** and type:
   - `http://localhost:5173` (for testing the app locally)
   - *Note: Leave "Authorized redirect URIs" completely empty.*
5. Click **Create** at the bottom.
6. A pop-up will show your **Client ID** (a long string ending in `.apps.googleusercontent.com`). Copy it.

---

## 📲 Part 2: Connect the PWA and Run Locally

1. Open your terminal in the `/mobile` project folder:
   ```bash
   cd mobile
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.
3. Click the **Settings Gear Icon** in the top right.
4. Paste your copied **Client ID** into the text input.
5. Click **Save**.
6. Click **Sign in with Google** and complete the popup authorization.
7. Click the **Sync** button in the header. The app will create a `CampfireJournal` folder in your Google Drive and upload/download your entries.

---

## ⚡ Part 3: Deploying to Cloudflare Pages (Free)

Cloudflare Pages compiles your React PWA and hosts it on their global edge network.

### 1. Push your code to GitHub
Make sure all your changes are committed and pushed to your remote GitHub repository:
```bash
git commit -m "feat: added mobile campfire PWA with google drive sync"
git push origin master
```

### 2. Connect repository to Cloudflare Pages
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
3. Select your GitHub account and select your repository. Click **Begin setup**.

### 3. Build & Build Settings (Crucial)
Configure the deployment parameters exactly as follows:
* **Project Name:** `campfire` (this will yield the URL `https://campfire.pages.dev`)
* **Production branch:** `master` (or your default branch)
* **Framework preset:** Select **`Vite`**
* **Root directory (Advanced):** Enter **`mobile`** (this tells Cloudflare to build the PWA folder instead of the Tauri root folder)
* **Build command:** `npm run build`
* **Output directory:** `dist`

### 4. Deploy!
1. Click **Save and Deploy**.
2. Cloudflare will compile the code and build the PWA. Within 1-2 minutes, you will get a live link like `https://campfire.pages.dev`.
3. **Important update:** Copy this live link, go back to your Google Auth Platform Console $\rightarrow$ **Clients** tab $\rightarrow$ Edit your `Campfire PWA` client, and add `https://campfire.pages.dev` to the **Authorized JavaScript origins** list. (Google will reject login attempts if the website domain isn't whitelisted here!).

---

## 📱 Part 4: Install PWA on your Phone

1. Open Safari (iOS) or Chrome (Android) on your phone.
2. Go to your Cloudflare Pages URL (e.g., `https://campfire.pages.dev`).
3. Click the **Share** button (iOS) or **Menu** button (Android).
4. Click **Add to Home Screen**.
5. Open the installed **Campfire** app from your home screen. It will open as a fullscreen, offline-first app. Log in once with Google in Settings to keep your diaries synced!
