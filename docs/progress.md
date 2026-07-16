# Project Roadmap & Progress

## Completed Tasks (Always keep this under 5 tasks)
- [x] Rename app to **Campfire** and update AI system instructions to the subtle "Voice of the Campfire/Narrator" persona.
- [x] Set custom desktop app logo: generated Tauri multi-size assets from my_logo.png and added my_logo_small.png to the sidebar UI with fallback.
- [x] Add customizable system instructions: support default, append, and override modes inside Chat Settings modal.

---

## Pending Objectives

## product backlog


the delete in the timeline browse doesnt sync, you should reference how the journal editor handle when the file is deleted/empty, then apply here. also check if the keyword search also sync when delete entries


on desktop journal editor, if i type rapidly, for example "11111111111" fast, so when i press "1" i see the auto save icon one letter it said "auto-saving" and then i imadiately i press another new letter "11" i see it said "saved to disk", then press another letter right after that "111" it said "auto-saving" i press the fourth "1111" it said "saved to disk"?? is this behaviour expected?

why after i just input a single letter, the icon goes from "synced" to "connecting" to "syncing" "to "synced" twice? so "synced" to "connecting" to "syncing" "to "synced" and then another "synced" to "connecting" to "syncing" "to "synced" ? isnt it suppose to go just once?

check out how to prevent other deb steal my code, maybe check out "licensed under Apache-2.0"

add toggle "tick/untick all" in the Tools & Diagnostics and the Chat Interface of the Chat Settings & Tools

on mobile if i delete all letter of an entry, when click the back button, i see it "empty entry" even thought it synced  the moment i click back, only if i click manually the sync icon do the file disappear.

in the configuration page, add a toggle something like toggle the appering of the heart donate icon, when people toggle, app will somehow check if they have ever donate. user can only toggle this icon only if they had donate at least once. and when they try to toggle before donate, show a pop up window with sinsere message something like "please thong cam, you can toggle the icon if you donate at least once"

## Future Plans & Monetization Setup
- [ ] **International Payments (Ko-fi + PayPal)** — Set up a Ko-fi profile connected to a PayPal Vietnam personal account to accept credit cards, Apple Pay, Google Pay, and PayPal from international users.
  - *Fee strategy:* Set a minimum donation threshold of $3.00 or $5.00 ("Buy me a Boba") to avoid high PayPal microtransaction fees ($0.30 fixed fee per transaction makes $1.00 tips highly inefficient).
  - *Integration:* Add an "International Tip" button link next to the VietQR option in the About modal once the profile is created.
- [ ] **Mobile Journal Entry Sync** — Implement a way to input journals from a phone.
  - *Challenge:* Store fees ($25 one-time for Android, $99/year for iOS) make native app publishing expensive.
  - *Alternative:* Explore WebDAV, git sync, or a simple self-hosted PWA (Progressive Web App) to save logs directly into the user's flat-file journal directory.

allow user to byok api

right now the donate message is "donate past you" and user can not edit it, what if i want to add to the support me somethign like "and hey, i you want to notify me, the quickest way is to donate to me along with your messages, i guanrantee to read it immediately : ) " suggest me. is the "messeage the dev the fastes by send them money along with the message" a good way to monitize the app? of couse they dont have to send money to feedback, i have the [FeedbackModal.tsx](file;file:///d%3A/program/past%20you/src/components/FeedbackModal.tsx) report bug here. so: user can feedback freely here, and if they want to notify me something, they can just put it the the message when send my mone, how is that?