# Project Roadmap & Progress

## Completed Tasks (Always keep this under 5 tasks)
- [x] Rename app to **Campfire** and update AI system instructions to the subtle "Voice of the Campfire/Narrator" persona.
- [x] Set custom desktop app logo: generated Tauri multi-size assets from my_logo.png and added my_logo_small.png to the sidebar UI with fallback.
- [x] Add customizable system instructions: support default, append, and override modes inside Chat Settings modal.

---

## Pending Objectives

## product backlog

right now if all the cloud, mobile desktop are all sunced, the moment i input a letter on desktop journal view, the auto sync will do what? toast?pop up? nothing?  if the local didnt get any update we should just do nothing?

the delete in the timeline browse doesnt sync, you should reference how the journal editor handle when the file is deleted/empty, then apply here. also check if the keyword search also sync when delete entries

the delete in the timeline browse doesnt sync, you should reference how the journal editor handle when the file is deleted/empty, then apply here. also check if the keyword search also sync when delete entries

on desktop journal editor, if i type rapidly, for example "11111111111" fast, so when i press "1" i see the auto save icon one letter it said "auto-saving" and then i imadiately i press another new letter "11" i see it said "saved to disk", then press another letter right after that "111" it said "auto-saving" i press the fourth "1111" it said "saved to disk"?? is this behaviour expected?

on desktop journal editor, if i type rapidly, for example "11111111111" fast, so when i press "1" i see the auto save icon one letter it said "auto-saving" and then i imadiately i press another new letter "11" i see it said "saved to disk", then press another letter right after that "111" it said "auto-saving" i press the fourth "1111" it said "saved to disk"?? is this behaviour expected?

why after i just input a single letter, the icon goes from "synced" to "connecting" to "syncing" "to "synced" twice? so "synced" to "connecting" to "syncing" "to "synced" and then another "synced" to "connecting" to "syncing" "to "synced" ? isnt it suppose to go just once?

check out how to prevent other deb steal my code, maybe check out "licensed under Apache-2.

why i delete entry on mobile, syncto cloud, i check indeed the cloud entry also gone, but when i open the local desktop, it overwrite the local with the old existing entry? now the cloud has it. the local is older so it should not overwrite the cloud


right when i click in an entry on mobile, the cursor move to the front of the text??it should be at the bottom text instead.

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


test:
Test 1: Only Desktop edits
(Desktop) Edit 2026-07-13.md → "alpha"
(Desktop) Wait 30s
(Desktop) Sync Now
   expect: local="alpha", cloud="alpha", base="alpha", no conflict
(Mobile) Wait 30s
(Mobile) Sync Now
   expect: mobile shows "alpha", no conflict
Test 2: Only Mobile edits
(Mobile) Edit 2026-07-13 → "beta"
(Mobile) Wait 30s
(Mobile) Sync Now
   expect: mobile="beta", cloud="beta", no conflict
(Desktop) Wait 30s
(Desktop) Sync Now
   expect: local="beta", cloud="beta", no conflict
Test 3: Cloud-only edit (browser or phone's Google Drive app)
(Cloud, via drive.google.com) Edit 2026-07-13 → "gamma"
(Desktop) Wait 30s
(Desktop) Sync Now
   expect: local="gamma", cloud="gamma", base="gamma", no conflict
Test 4: Sequential edits, no conflict (different lines)
Desktop and Mobile edit different parts of a long entry. Both sync. Should merge cleanly.
(Setup) Make 2026-07-13 contain 5 lines: "line1\nline2\nline3\nline4\nline5"
(Setup) Sync both devices so all agree

(Desktop) Edit to: "line1\nline2 DESK\nline3\nline4\nline5"
(Desktop) Wait 30s, Sync Now
   expect: cloud="line1\nline2 DESK\nline3\nline4\nline5", base=same

(Mobile) Edit to: "line1\nline2\nline3\nline4\nline5 MOB"
(Mobile) Wait 30s, Sync Now
   expect: mobile content = "line1\nline2 DESK\nline3\nline4\nline5 MOB"
            (lines 2 and 5 both changed, no conflict)

(Desktop) Wait 30s, Sync Now
   expect: local matches mobile

Test 5: Sequential edits, same line → CONFLICT
(Setup) 2026-07-13 = "line1\nline2\nline3", all devices agree

(Desktop) Edit to "line1\nline2 DESK\nline3"
(Desktop) Wait 30s, Sync Now
   expect: cloud="line1\nline2 DESK\nline3", base=same

(Mobile) Edit to "line1\nline2 MOB\nline3"  (don't sync yet)
(Mobile) Wait 30s, Sync Now
   expect: mobile detects conflict
            local file written with markers:
            <<<<<<< Local (Mobile - ...)
            line1
            line2 MOB
            line3
            =======
            Remote (Cloud - ...)
            line1
            line2 DESK
            line3
            >>>>>>>
            cloud UNCHANGED (still "line1\nline2 DESK\nline3")
            toast: "1 entry needs conflict resolution: 2026-07-13"
Test 6: User resolves conflict (edit one side)
Continuing from Test 5:

(Mobile) Open 2026-07-13 in editor, see the markers
(Mobile) Edit to "line1\nline2 MERGED\nline3" (delete markers, type a single value)
(Mobile) Wait 30s, Sync Now
   expect: no conflict, mobile="line1\nline2 MERGED\nline3"
            cloud now updated to "line1\nline2 MERGED\nline3"
            (the resolved value pushed to cloud)

(Desktop) Wait 30s, Sync Now
   expect: local = "line1\nline2 MERGED\nline3", no conflict
Test 7: User resolves conflict by deleting one side
Continuing from Test 5:
(Mobile) Open editor, delete the local side and the markers, leaving only:
         "line1\nline2 DESK\nline3"
(Mobile) Save
(Mobile) Wait 30s, Sync Now
   expect: mobile="line1\nline2 DESK\nline3" (matches cloud)
            cloud UNCHANGED (no upload needed, already the same)
            no conflict

(Desktop) Wait 30s, Sync Now
   expect: local = "line1\nline2 DESK\nline3"

Test 8: Three-way conflict (all three differ)
(Setup) 2026-07-13 = "shared base content", all agree
(Desktop) Edit to "desktop version"
(Desktop) Sync Now → cloud="desktop version", base="desktop version"
(Mobile) Wait 30s, Mobile Sync Now → mobile="desktop version"
(Mobile) Edit to "mobile version"
(Mobile) Wait 30s, Mobile Sync Now → cloud="mobile version", base="mobile version"
(Desktop) Wait 30s, Desktop Edit to "desktop v2"
(Desktop) Wait 30s, Desktop Sync Now
   expect: CONFLICT — local = "desktop v2", cloud = "mobile version", base = "mobile version"
            local file written with markers, cloud untouched
            toast: "1 entry needs conflict resolution: 2026-07-13"
Test 9: Mobile edits conflict file (should NOT overwrite markers)
(Setup) 2026-07-13 is a conflict block (from Test 5 or 8)
(Mobile) Open editor, see markers
(Mobile) Just click save without changing anything
   expect: nothing happens (or local mtime updates but content unchanged)
(Mobile) Wait 30s, Sync Now
   expect: mobile still has the conflict markers, no new markers added
            no auto-resolution attempted

(Desktop) Wait 30s, Desktop Sync Now
   expect: local still has the conflict block (desktop didn't touch it)
            cloud still has the older "DESK" or whatever the cloud was
            toast mentions 2026-07-13 as still in conflict
Test 10: Create date on Desktop, sync to Mobile
(Desktop) Create a new date 2026-07-20 with content "first time writing today"
(Desktop) Wait 30s, Sync Now
   expect: cloud now has 2026-07-20.md with that content, base=same

(Mobile) Wait 30s, Sync Now
   expect: mobile's Timeline shows 2026-07-20 with "first time writing today"
Test 11: Delete on Desktop, sync to Mobile
(Setup) Both have 2026-07-21.md with content "will be deleted"
(Desktop) Open editor, delete all text (leave empty), save
(Desktop) Wait 30s, Sync Now
   expect: local file deleted, cloud file deleted, base deleted

(Mobile) Wait 30s, Sync Now
   expect: 2026-07-21 no longer in mobile's timeline
Test 12: Edit during sync (race condition-ish)
(Desktop) Start sync (don't wait for it to finish)
(Desktop) While sync is running, edit 2026-07-13 → "during sync"
(Desktop) Wait 30s
   expect: either (a) the new edit gets picked up on the next sync, OR
            (b) the in-progress sync completed first and the local
                edit is then uploaded on the next sync
            In either case, eventually local=cloud="during sync", no conflict
Test 13: Time tolerance doesn't matter for actual conflicts
(Setup) Local and cloud differ on a line
(Desktop) Sync within 5 seconds of mobile syncing
   expect: still produces conflict if content differs
            (mtime equality should NOT cause silent overwrite anymore)
Test 14: Empty content edge case
(Setup) 2026-07-13 = ""
(Desktop) Wait 30s, Sync Now
   expect: cloud file deleted, local file deleted, base deleted

(Mobile) Edit 2026-07-13 to "now I have content"
(Mobile) Wait 30s, Sync Now
   expect: cloud has the content, base matches

(Desktop) Wait 30s, Sync Now
   expect: local has the content
How to verify each test passed
For each test, after the final action, check these three places agree on the content for the test date:

Desktop local file: 2026-07-13.md (open in any editor)
Mobile local DB: open the date in the mobile PWA's editor
Cloud: open https://drive.google.com → CampfireJournal folder → 2026-07-13.md
If all three say the same thing and there's no conflict block, the test passed. If a conflict block is in any of the three, the test revealed a case where conflict-resolution was needed — that's a legitimate outcome for Tests 5, 8, 9.

Reset between tests
Easiest way to reset before a test:

On both devices, sync to converge
Manually edit the cloud 2026-07-13.md to the agreed starting value (e.g., "RESET")
On both devices, click "Sync Now" to pull the reset value down
Both devices now show "RESET", cloud shows "RESET", base on both devices shows "RESET"
Then start the test.