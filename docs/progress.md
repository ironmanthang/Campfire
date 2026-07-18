# Project Roadmap & Progress

## Completed Tasks (Always keep this under 5 tasks)
- [x] Rename app to **Campfire** and update AI system instructions to the subtle "Voice of the Campfire/Narrator" persona.
- [x] Set custom desktop app logo: generated Tauri multi-size assets from my_logo.png and added my_logo_small.png to the sidebar UI with fallback.
- [x] Add customizable system instructions: support default, append, and override modes inside Chat Settings modal.

---

## Pending Objectives

## product backlog

### logic


when i tried to edit md files in drive and open it in gg docs, it can create multiple files with the same data, then i open app and click sync now, i got error: `Failed to download file (status ${response.status}). If this file was created by another client, ensure both Client IDs are configured under the SAME Google Cloud Project.`

brainstorm with me: how to add an import button? i was thing replace the text Legacy Data Management with "export/Import" and add the import button, the parse from a valid json/md (from the export button)? for when conflict happen, append the new import entried right below the original entry, afterimport success, show report of what files is appended?

if i set auto sync do the the delete in the timeline browse and the keyword search trigger auto sync? , you should reference how the journal editor handle when the file is deleted/empty, then apply here. 

check out how to prevent other deb steal my code, maybe check out "licensed under Apache-2.




right when i click in an entry on mobile, the cursor move to the front or the end of the text??



Error

Sync done. 1 entry need conflict resolution: 2026-07-18

Close

### UI/UX



## Future Plans & Monetization Setup
- [ ] **International Payments (Ko-fi + PayPal)** — Set up a Ko-fi profile connected to a PayPal Vietnam personal account to accept credit cards, Apple Pay, Google Pay, and PayPal from international users.
  - *Fee strategy:* Set a minimum donation threshold of $3.00 or $5.00 ("Buy me a Boba") to avoid high PayPal microtransaction fees ($0.30 fixed fee per transaction makes $1.00 tips highly inefficient).
  - *Integration:* Add an "International Tip" button link next to the VietQR option in the About modal once the profile is created.
- [ ] **Mobile Journal Entry Sync** — Implement a way to input journals from a phone.
  - *Challenge:* Store fees ($25 one-time for Android, $99/year for iOS) make native app publishing expensive.
  - *Alternative:* Explore WebDAV, git sync, or a simple self-hosted PWA (Progressive Web App) to save logs directly into the user's flat-file journal directory.

allow user to byok api

right now the donate message is "donate past you" and user can not edit it, what if i want to add to the support me somethign like "and hey, i you want to notify me, the quickest way is to donate to me along with your messages, i guanrantee to read it immediately : ) " suggest me. is the "messeage the dev the fastes by send them money along with the message" a good way to monitize the app? of couse they dont have to send money to feedback, i have the [FeedbackModal.tsx](file;file:///d%3A/program/past%20you/src/components/FeedbackModal.tsx) report bug here. so: user can feedback freely here, and if they want to notify me something, they can just put it the the message when send my mone, how is that?


in the configuration page, add a toggle something like toggle the appering of the heart donate icon, when people toggle, app will somehow check if they have ever donate. user can only toggle this icon only if they had donate at least once. and when they try to toggle before donate, show a pop up window with sinsere message something like "please thong cam, you can toggle the icon if you donate at least once"
