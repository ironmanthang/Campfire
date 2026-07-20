# Project Roadmap & Progress

## Completed Tasks (Always keep this under 5 tasks)


---

## Pending Objectives

## product backlog

### logic
there are four errors i want you to verify before fixing, dont just trust my words.

the first error i see is about conflict handling. assume all cloud desktop mobile are in sync, desktop have autosave and autosync enabled, i open on brand new date on desktop, i type, at first it did sync and entry appear on cloud drive, but then it show 


"Error

Sync done. 1 entry need conflict resolution: 2026-07-20

Close"

(you can read D:\program\Campfire\desktop\src\store\domains\syncSlice.ts and storage\2026-07-20.md and more files for more context).

.there is a pattern i see: it always show error on the third sync. so on a brand new entry (all synced i repeat), type "a" it sync, the cloud update with "a". i then press b, cloud show "ab". but the moment i type "c", it show the error. read storage\2026-07-20.md to check.

my goal is: Platform Agnostic, prefer to keep shared logic in the core folder, the only time it show the error is when the local device (mobile/desktop) and the cloud is diverged from the base im i right? (i believe there is a base-compare-logic in this app?). 
(you can read more files for more context).

i use devtool and this is the result when i type in the third letter "c":
[handleSync] Invoked {isManual: false, isStartupSync: false, status: 'completed', pending: 'none'}
sync.ts:33 [Sync] Starting sync (conflict label: Desktop)
sync.ts:39 [Sync] Google Drive folder ID resolved: 1m8t1ZST_ghkCIq648OKNXt1Ljt9PJ0PX
sync.ts:46 [Sync] Fetched lists. Local: 15 entries, Remote: 15 files
sync.ts:212 [Sync] Entry 2026-06-20: Local = 2026-07-16T10:21:46.681Z, Remote = 2026-07-16T10:21:46.681Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-06-20: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-06-29: Local = 2026-07-15T06:22:29.588Z, Remote = 2026-07-15T06:22:29.588Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-06-29: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-01: Local = 2026-07-15T06:22:32.484Z, Remote = 2026-07-15T06:22:32.484Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-01: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-02: Local = 2026-07-17T17:52:18.194Z, Remote = 2026-07-17T17:52:18.194Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-02: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-03: Local = 2026-07-15T06:22:38.333Z, Remote = 2026-07-15T06:22:38.333Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-03: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-04: Local = 2026-07-15T06:22:40.500Z, Remote = 2026-07-15T06:22:40.500Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-04: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-06: Local = 2026-07-16T13:44:35.545Z, Remote = 2026-07-16T13:44:35.545Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-06: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-07: Local = 2026-07-15T06:22:52.684Z, Remote = 2026-07-15T06:22:52.684Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-07: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-08: Local = 2026-07-16T10:25:25.337Z, Remote = 2026-07-16T10:25:25.337Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-08: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-09: Local = 2026-07-16T03:25:36.510Z, Remote = 2026-07-16T03:25:36.510Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-09: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-10: Local = 2026-07-18T17:28:48.365Z, Remote = 2026-07-18T17:28:48.365Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-10: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-16: Local = 2026-07-18T13:40:09.714Z, Remote = 2026-07-18T13:40:09.714Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-16: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-17: Local = 2026-07-18T16:20:26.080Z, Remote = 2026-07-18T16:20:26.080Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-17: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-18: Local = 2026-07-19T13:52:32.518Z, Remote = 2026-07-19T13:52:32.518Z, diff = 0ms
sync.ts:236 [Sync] Entry 2026-07-18: In sync (mtime matches, local matches base).
sync.ts:212 [Sync] Entry 2026-07-20: Local = 2026-07-20T01:46:06.115Z, Remote = 2026-07-20T01:46:01.368Z, diff = 4747ms
sync.ts:288 [Sync] Entry 2026-07-20: CONFLICT - local and cloud disagree. Writing conflict block to local.
sync.ts:305 [Sync] Entry 2026-07-20: Conflict written. Cloud preserved.
sync.ts:330 [Sync] Sync completed. Downloaded dates: [], Conflicted dates: [2026-07-20]
---

second error is when i purposely try to be a bad user, i purposely create a conflict by editing the md straight in google drive (click on "open with google docs"). at that moment, for some reasons google will make multiple docs with diff link, after that and there will be multiple files with the same date (So same name). to describe this docs logic: everytime i click on the "open with google docs" button, a new copy with the same date will be created, so the original md that were created by the app (doesnt matter desktop or mobile created) remain untouched, and one more thing, if i click on the download button on the original file (or any files that were created by our app) it will download md format, but for those files that were created by google docs, it will download as docx format (eg. 2026-07-19.md.docx). now there are two case user can do from here, first case is after that user open dekstop, autosync jump in, desktop is resilience and will show the ogirinal file, and at the same time delete all those copy docx file thing. good.

in the second case is i test the same, but the user open in mobile. the moment i try to open the app, files are indeed being deleted to only one file of those duplicate files, but the problem is that that one file is not the original file, instead it is the copy file that when i click download it will add the docx extension, and then the sync button on mobile will show A red alert sign with an exclamation mark. from that moment on, there is no way to sync again even when i click the sync button multiple times, only if i go to that file and delete it, then the sync will work again (but for real user, they wouldnt even know what files is broken to delete, which will ruin the mobile ux). so for this error, the desktop handles it well, but the mobile app does not handle it well, and one more importane thing: i see when i use the mobileapp and the auto sync or whatever code handle the deleting, its actually keep the newest copy, and delete older files (of course with the original file being the oldest one). now i dont care about what google do, but i think the logic for handle this should be Platform Agnostic? i mean i even try to keep it a ssot by prefer to put shared logic in core folder. 
---

this is also the third error: when first turn on desktop, the editor is still editable so user can input text before the auto sync does its work which could cause all kind of troubles, should we make a "loading/syncing" screen to make user wait for the auto sync to do its work (if they turn off the autosync, they will not see it on startup)? and when there is conflict, like in the first error, after i close the pop up, i still see old text "abc", i have to move to another date, then return back to the conflicted date, only then the editor show the new conflicted marker text. this is not a good user experience, we should make the editor show the new conflicted text marker immediately after the error pop up closed or something. one more thing: i dont want the error to collapse after a few seconds, i want it to stay there until user close it.
---

the last unrelated error is ui error in mobile, after delete an entry, when i click on the back button, the entry show "empty entry" after the auto sync that are called everytime user click on the back button does its work, the "empty entry" still there, i have to click on the sync button again to make the empty entry gone, granted it does sync and delete the cloud file. now even if i click on sync button before click the back button, it still show the "empty entry" for a split second before the auto sync do its work. how to improve this ui/ux? also while we are here, fix the above ui error and add new things: click on the date to pick the date, if its an empty date, just show the placeholder={`Write your diary for ${formatDate(date)}...\nUse #tags to categorize your thoughts.`} (you can reference the date picker ui in desktop, click to open the date picker, click again to collapse). and also add two arrow button to go back and forth to the previous and next date.
---

the above 4 errors, even if we fix it, later in the future when add new features, it may cause these errors back, so should we make test cases? how do we make test cases for those situations?

# error:

remember this could also happen in mobile, in mobile shouldnt it be easier?be cause the auto sync dont trigger everytime text is save, and user dont click on back until they delete all teh marker, but right now when i click on the sync button after delete all marker, it still said conflict (the local part in the conflict is the new text i expect to sovle the conflict)
The DatePicker opens above the button

[JournalEditor.tsx#L176-181](textBlock;file:///d%3A/program/Campfire/mobile/src/components/JournalEditor.tsx#L176-181) get rid of the autosaved text. 


a major error: when i go back, while the sync icon is rotaing (syncing) i immidiately click on a random date, it

when i click on the left/right arrow, it will flash the Journal     
List home screen really fast before move to the next date

right now on Journal List home screen, if i hold and drag my finger, it can chose the text to copy: i dont want that, prevent user from able to do that, they can only copy/interact with the entry when they click to go to editor.

## feature:

how fast can the sync algorithm work when there are 200+ entries?

i want when user is in editor mode, clicking the return on their phone will also like when click on the back button, right now, it just lead them to their home screen. 

i want to switch the position of the top (the banner with back, preview and date picker) and the bottom (that show words count). the "back, date picker, date arrow, preview" will be on 

i want to add filter button on mobile (maybe a pop up window to chose from to All 30d 3m This yr?). allow user to ratate the app, right now its just portrait, even if i set my phone setting to auto rotate, when i rotate the phone, the app still set portrait.


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
