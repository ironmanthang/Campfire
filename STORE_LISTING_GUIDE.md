# Microsoft Store Listing Copy-Paste Guide for Campfire Journal

Use this guide to fill in the **Store listing** and **Submission options / Restricted capabilities** fields in Microsoft Partner Center.

---

## 0. Restricted Capabilities (`runFullTrust`) - IMPORTANT
Copy and paste this into the **"Why do you need the runFullTrust capability, and how will it be used in your product?"** text box:

```text
Campfire Journal is a native Windows desktop application built with the Tauri framework (Rust backend + WebView2 frontend). It requires the runFullTrust capability to execute as a Win32 desktop application, specifically to read and write user journal entries to local disk storage for local-first offline operation, and to perform HTTPS requests for background Google Drive backup. No elevated administrator rights are requested or used.
```

---

## 1. Description (REQUIRED)
Copy and paste this entire block into the **Description** field:

```text
Campfire Journal is a sleek, local-first digital journal designed for thoughtful writing, reflection, and memory keeping with zero privacy compromise.

Key Highlights:
• Local-First Privacy: Your personal thoughts and journal entries are stored directly on your local device. No third-party servers, no accounts, no tracking.
• Automatic Google Drive Sync: Seamlessly back up and synchronize your journal entries to your own private Google Drive storage so your data remains yours forever.
• Modern & Cozy Interface: Enjoy a beautifully crafted dark-themed interface built for distraction-free writing.
• Rich Text & Media: Express your thoughts with flexible formatting options, code blocks, lists, and visual assets.
• Flexible Tagging & Instant Search: Organize entries using custom tags and find past memories instantly with fast local search.

Whether you are daily journaling, logging personal progress, or capturing sudden sparks of inspiration, Campfire Journal offers a safe and serene space by the digital fire.
```

---

## 2. What's new in this version (OPTIONAL)
*Leave blank for your initial release, or paste:*

```text
Initial release of Campfire Journal on Microsoft Store. Features local-first journal storage, custom tagging, dark mode UI, and automatic Google Drive backup.
```

---

## 3. Product Features (Click "+ Add more" to add each feature bullet)

* **Feature 1:** `Local-First Privacy: Entries are saved securely on your local device.`
* **Feature 2:** `Google Drive Sync: Automatic background backup to your personal Google Drive.`
* **Feature 3:** `Distraction-Free UI: Sleek dark-mode interface tailored for cozy writing.`
* **Feature 4:** `Tags & Fast Search: Easily organize memories and search entries instantly.`
* **Feature 5:** `Rich Text Formatting: Support for markdown, headings, lists, and rich media.`

---

## 4. Screenshots (REQUIRED - At least 1 desktop screenshot)

Upload images from your project's `store-assets` folder under the **Desktop** tab:

📁 **Location on your PC:** `D:\program\Campfire\store-assets\screenshots\`

* Upload: `1.png`
* Upload: `2.png`
* Upload: `3.png`
* Upload: `4.png`

---

## 5. Store Logos (RECOMMENDED)

📁 **Location on your PC:** `D:\program\Campfire\store-assets\`

* **9:16 Poster art (720 x 1080):** Upload `StoreLogo-2x3-720x1080.png`
* **1:1 Box art (1080 x 1080):** Upload `StoreLogo-1x1-1080.png`

---

## 6. Store Display Images (RECOMMENDED)

📁 **Location on your PC:** `D:\program\Campfire\store-assets\` and `desktop\src-tauri\icons\`

* **1:1 App tile icon (300 x 300):** Upload `D:\program\Campfire\store-assets\AppIcon-300.png`
* **1:1 Icon (150 x 150):** Upload `D:\program\Campfire\desktop\src-tauri\icons\Square150x150Logo.png`
* **1:1 Icon (71 x 71):** Upload `D:\program\Campfire\desktop\src-tauri\icons\Square71x71Logo.png`

---

## 7. Trailers & Hero Art (OPTIONAL)
* ⏩ **SKIP** - You do not need trailers or 16:9 Super hero art for a regular store listing.

---

## 8. Supplemental Fields (OPTIONAL)

* **Short title:** `Campfire`
* **Voice title:** *(Leave blank)*
* **Short description:**
```text
A sleek, local-first personal journal with automatic Google Drive sync, dark mode, and complete privacy.
```

---

## 9. Additional Information

* **Keywords (Press Enter after adding each keyword):**
  1. `journal`
  2. `diary`
  3. `notes`
  4. `google drive sync`
  5. `local first`
  6. `privacy`
  7. `writing`

* **Copyright and trademark info:**
```text
Copyright © 2026 happyKnight. All rights reserved.
```

* **Additional license terms:** *(Leave blank)*

* **Developed by:**
```text
happyKnight
```

---

## Final Step for English (United States)
Click **Save** at the bottom of the page!
