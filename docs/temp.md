
# request feature

find a ui place to put the pwa link

Build a clean, 1-page website using free static hosts (Vercel, Netlify, or GitHub Pages).

add a donate button on mobile

[progress.md#L9-11](textBlock;file:///d%3A/program/Campfire/docs/progress.md#L9-11) [brainstorming](recipe;file:///c%3A/Users/nguye/.gemini/config/global_workflows/brainstorming.md) we need to redesign the ux, right now my two main market  is international and vietnamese user. two method of donation: VietQR and International (Ko-fi).If the app is set to Vietnamese (vi): Open directly to the VietQR tab by default. If the app is set to English (en): Open directly to the Ko-fi tab by default. keep both tab buttons visible at all times. A Vietnamese developer who runs their app in English can still click the VietQR tab in one second.

a title could be:"support my poor soul on Ko-fi:"?
  
want to gently remind long-time users without being annoying, trigger a soft notification banner after a meaningful accomplishment—for example, when a user completes their 10th journal entry or reaches a 30-day streak:
"🎉 You've written 10 journal entries in Campfire! If this app brings value to your day, consider supporting its development." [Support Campfire] [Maybe Later]


When the Ko-fi tab is active, focus on building trust for users who might be hesitant to spend money inside a desktop app:

The Main Action Button: A prominent, friendly button that says "Buy me a Boba on Ko-fi 🧋".

Trust Badges: Directly under the button, display small, recognizable icons for Apple Pay, Google Pay, VISA, Mastercard, and PayPal. Seeing these logos reassures international non-tech users that their payment is handled securely.

Browser Handoff: When they click the button, trigger the OS to open your Ko-fi link in their default system browser (like Chrome or Safari) rather than inside the app. Users feel much safer entering credit card info in their familiar browser window.

## Future Plans & Monetization Setup
- [ ] **International Payments (Ko-fi + PayPal)** — Set up a Ko-fi profile connected to a PayPal Vietnam personal account to accept credit cards, Apple Pay, Google Pay, and PayPal from international users.
  - *Fee strategy:* Set a minimum donation threshold of $2.00 ("Buy me a Boba") to avoid high PayPal microtransaction fees ($0.30 fixed fee per transaction makes $1.00 tips highly inefficient).
  - *Integration:* Add an "International Tip" button link next to the VietQR option in the About modal once the profile is created.
- [ ] **Mobile Journal Entry Sync** — Implement a way to input journals from a phone.
  - *Challenge:* Store fees ($25 one-time for Android, $99/year for iOS) make native app publishing expensive.
  - *Alternative:* Explore WebDAV, git sync, or a simple self-hosted PWA (Progressive Web App) to save logs directly into the user's flat-file journal directory.

allow user to byok api

right now the donate message is "donate past you" and user can not edit it, what if i want to add to the support me somethign like "and hey, i you want to notify me, the quickest way is to donate to me along with your messages, i guanrantee to read it immediately : ) " suggest me. is the "messeage the dev the fastes by send them money along with the message" a good way to monitize the app? of couse they dont have to send money to feedback, i have the [FeedbackModal.tsx](file;file:///d%3A/program/past%20you/src/components/FeedbackModal.tsx) report bug here. so: user can feedback freely here, and if they want to notify me something, they can just put it the the message when send my mone, how is that?


in the configuration page, add a toggle something like toggle the appering of the heart donate icon, when people toggle, app will somehow check if they have ever donate. user can only toggle this icon only if they had donate at least once. and when they try to toggle before donate, show a pop up window with sinsere message something like "please thong cam, you can toggle the icon if you donate at least once"

# questions


# errors




