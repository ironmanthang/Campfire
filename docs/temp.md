# request feature


add desktop link, to the mobile when later publish to microsoft store



  


i want to add "Feedback is always welcome via the Report Bug & Feedback form! But if you want to buy me a coffee and drop a note at the same time, donation alerts hit my phone instantly, so I'll see your message right away : D" to the support me section.


1. make a new centralize section in the "Configuration & Onboarding", call it "heart setting" or whatever you want.
2. in that section add a toggle that either show the heart icon or hide it. when people toggle, the app will pop up window something like: "This feature is meant for users who supported the app. If you've already donated - or plan to - feel free to turn it on!" [Yes, enable & don't ask again]    [Wait, let me donate first] (fyi some logic about hide icon is in the Show Donation Heart setting in desktop\src\components\settings\IdentitySection.tsx which you should bring it here)
3. add a toggle when click on the heart, instead of show the pop up donate window, hearts will fall down from the top of the screen (this is a fun feature, you can be creative all you want), if they click multiple times, more hearts will fall down, and they can adjust the speed of the falling hearts in the settings page.
4. add a toggle heart: make it dynamic user can drag it, right now the position of the heart is fixed, i want user to be able to move the heart any place on the app (which mean it overlay on top of all the ui), and they can adjust its size here.


# questions


# errors

