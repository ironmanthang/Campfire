import { useState, useEffect, useRef } from "react";

import { useResizer } from "../../hooks/useResizer";

import {
  X,
  BookOpen,
  History,
  Search,
  MessageSquare,
  Sparkles,
  Settings,
  Copy,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Save,
  Cloud,
  FileText,
  Database,
  AlertTriangle,
  GitMerge,
  FolderSync,
  Clock,
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpModalPersistedState = {
  activeTab: string;
  openCategories: Record<string, boolean>;
};

const HELP_MODAL_STORAGE_KEY = "campfire_help_modal_state";

function getDefaultOpenCategories(): Record<string, boolean> {
  return {
    "auto-save": true,
    "auto-sync": true,
  };
}

function readHelpModalPersistedState(): HelpModalPersistedState {
  if (typeof window === "undefined") {
    return {
      activeTab: "journal",
      openCategories: getDefaultOpenCategories(),
    };
  }

  try {
    const raw = window.localStorage.getItem(HELP_MODAL_STORAGE_KEY);
    if (!raw) {
      return {
        activeTab: "journal",
        openCategories: getDefaultOpenCategories(),
      };
    }

    const parsed = JSON.parse(raw) as Partial<HelpModalPersistedState>;
    return {
      activeTab: typeof parsed.activeTab === "string" ? parsed.activeTab : "journal",
      openCategories: {
        ...getDefaultOpenCategories(),
        ...(parsed.openCategories && typeof parsed.openCategories === "object"
          ? parsed.openCategories
          : {}),
      },
    };
  } catch {
    return {
      activeTab: "journal",
      openCategories: getDefaultOpenCategories(),
    };
  }
}

function writeHelpModalPersistedState(state: HelpModalPersistedState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HELP_MODAL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to persist help modal state:", err);
  }
}

const GUIDE_MARKDOWN = `# Campfire User Guide

Welcome to Campfire. Here is a guide to the hidden tips, shortcuts, and capabilities across all sections of the app:

## 📝 Journal Editor
This is your private spot by the fire. Each day gets its own page — a quiet place to write down what happened, how you felt, or simply what you'd like to remember.

- **Just start writing**: The moment you open today's page, the cursor is already waiting for you. No buttons to click, no menus to open — just type.
- **Make the text comfortable for your eyes**: Hold \`Ctrl\` and scroll your mouse wheel up to make the words bigger, or down to make them smaller — anywhere in the app. You can also use \`Ctrl + =\` to zoom in, \`Ctrl + -\` to zoom out, and \`Ctrl + 0\` to go back to normal size.
- **Skip past quiet days**: Use the little arrows on either side of the date to move one day at a time. Want to jump straight to the last day you actually wrote something? Hold \`Shift\` while clicking an arrow and we'll fly past the empty days for you.
- **We save as you go**: You never have to remember to save. Campfire quietly tucks every word away as you type, and the moment you switch to another day or another view, your writing is already safe.

_Take your time. No one's reading over your shoulder._

## 📅 Timeline Browse
This is where you look back over your life. Every day you wrote something is laid out in order, newest first, with the month gently labeled in the background as you scroll. It's a quiet way to see your story unfold.

- **Each card is a day in your life**: You'll see the date, a small preview of what you wrote, and any \`#tags\` you used that day. Tags you already follow are highlighted so you know which threads are active.
- **Follow a thread, not just a day**: See a tag like \`#gym\` on a card? Click it. Campfire will jump you straight to **Keyword Search** with every entry about that topic already filtered for you — past, present, and future entries that mention it.
- **Choose what a click does**: At the top of the page there's a small switch.
  - **Click to Open** — click a day to open it in the editor, ready to read or add to.
  - **Click to Select** — click days like checkboxes, then export them as a single file or delete them in one go. Great for clearing out old entries or saving a chapter of your life.
- **Zoom in on a stretch of time**: Don't want to see everything? Use the date picker in the header to choose a window. There are friendly shortcuts like _Last 7 days_, _Last 30 days_, _This year_, or you can pick any two dates yourself. Your choice is remembered next time.
- **Keep scrolling, more is on the way**: We only load the most recent 50 entries to start, so opening the timeline feels instant. When you reach the bottom, a small button offers to load the next 50. The list keeps going as long as your journal does.

_A tip: try opening the timeline the first time you use Campfire, just to see the shape of your days. You'll be surprised how much you've written._

## 🔍 Keyword Search
Search is how you find that one thing you wrote — even when you can't remember when, or which day, or which exact words you used. Think of it as the index to your whole life in Campfire.

- **Two ways to look for something**: At the top of the page, you can switch between two search modes.
  - **Keyword** — the everyday one. Type a word or phrase and we find every line in your journal that contains it. Fast, private, works the moment you type. Think of it like Ctrl+F, but for your whole life.
  - **Semantic** — the magic one. Describe what you mean in plain words, even if you never used those exact words. Search for _"days I felt stuck at work"_ and we'll find entries that _talk about_ that, not just ones that literally use those words. This one needs a small helper called Ollama running on your computer; the small **?** next to the title explains how to set it up.
- **Search by tag**: Type a tag like \`#work\` into the box and we'll find every entry you ever tagged that way. Want entries that mention _both_ \`#work\` and \`#anxiety\`? Type them with a space between — the **AND** / **OR** toggle at the top lets you pick. (Default is AND, so just listing tags narrows the search.)
- **Reading a result**: Each result card shows the date, a small snippet of the actual line that matched (so you can see the context), and any \`#tags\` from that day. With semantic search you'll also see a small percentage that tells you how confident the match is — closer to 100% means a stronger match.
- **From a result, into the journal**: Want to keep reading around the match? Click a result and it opens that day in the editor, right where you left off. Want to grab a whole set of results? Switch the top toggle to **Click to Select** and pick the days you want — then export them together as one file, or clean them up if you no longer need them.
- **Narrow the time window**: Searching everything can feel like too much. Use the date range at the top to limit results to one chapter of your life — _last 30 days_, _this year_, or pick any two dates yourself. Your last choice is remembered next time.
- **Browse your tags**: On the side you'll find a small cloud of every \`#tag\` you've ever used, sorted alphabetically. It's a quick way to see the themes of your life, and clicking any tag is the same as typing it into the search box.

_A gentle reminder: nothing leaves your computer. Keyword search is instant and offline; semantic search runs on your own machine, never on a server somewhere else._

## 💬 Campfire Chat
This is the heart of Campfire. The other views help you _write_, _find_, and _remember_. This one helps you _understand_. You're talking to a small AI companion called the **Narrator** — and unlike most AI, the Narrator has actually _read your journal_ before it says a word.

- **Who you're talking to**: The Narrator is a calm, perceptive voice that sits across from you by the fire. It knows your name, the dates you've been writing, and everything you've written in the chosen window. It doesn't pretend to know more than that — and it will only talk about what's actually in your entries.
- **What the Narrator is good at**: Three things, in this order.
  - **Spotting patterns over time.** "You mentioned feeling stuck at work on five separate days this month — and four of them were Mondays." That's more useful than a long summary.
  - **Spotting what's missing.** If you wrote about a plan or a worry and then went quiet, the Narrator will gently name the silence — without inventing reasons. "You said on the 5th you'd start Spanish every morning. I don't see it come up again. What changed?"
  - **Noticing the gap between what you said and what you did.** Compare your stated intentions to your lived entries, side by side. This is the Narrator's most useful move.
- **How to start a useful conversation**: You don't have to use a special prompt. The Narrator will work with whatever you say. Some gentle openers to try:
  - _"What should i this month?"_
  - _"What have I been avoiding?"_
  - _"What did I get right this week?"_
  - _"I feel stuck. Can you look at the last 30 days and tell me what you see?"_

  A small _sparkle chip_ above the input suggests a fresh question whenever the chat is empty — click it to fill the box, or click the little ↻ to swap it for another.
- **You stay in control of the conversation**: Every word you or the Narrator said can be revisited. Hover over any of your own messages and a small pencil appears — click it to edit what you asked, and the Narrator will regenerate the conversation from that point onward as if you'd said the new thing all along. If a reply is going in the wrong direction, hit the stop button to pause it mid-sentence. If you want a clean slate, the refresh icon in the header starts the conversation over.
- **Show, don't just tell**: You can drag, paste, or attach an image to your message — a photo, a screenshot, a sketch. If you've picked a vision-capable model, the Narrator can read it and talk about what it sees alongside the rest of your journal.
- **Your words stay close to home**: By default, the Narrator runs on a small AI model _on your own computer_, through a free helper called Ollama. Your journal entries never leave your machine — they aren't sent to a server to be read. If your computer is older or doesn't have a strong graphics card and the local models feel slow, you can switch to a **Cloud model** in the model picker at the top of the page. The trade-off: a Cloud model is faster and more capable, but it does send your chat to that provider, so only use it if you trust it with your reflections. You can switch back to local any time.

_The Narrator isn't a therapist and won't pretend to be. But it is honest, brief, and actually paying attention. That's rarer than it sounds._

## ✨ Reflection Reports
Chat is for back-and-forth. This view is for the _summary letter from your past self_ — pick a stretch of time, and your local AI will read everything you wrote in that window and write you one structured report.

- **What you get, every time**: The report is always split into the same five sections, so once you know the shape you can skim straight to the part you care about.
  - **Recurring Themes** — the same people, activities, or thoughts that keep coming up.
  - **Emotional Temperature** — the overall mood of the window, and how it shifts.
  - **Notable Progress** — wins, breakthroughs, and small things that quietly got better.
  - **Key Challenges** — the active struggles, worries, or blockages you're still carrying.
  - **Growth Recommendations** — a few small, concrete next steps the AI suggests, grounded in what you actually wrote.
- **How to run one**: At the top of the page, choose a **date range** — there's a calendar picker plus friendly presets like _Last 7 days_, _Last 30 days_, _This year_, or pick any two dates yourself. Then click the **Generate Report** button (the lightning bolt) and watch the report stream in word by word. If you change your mind mid-way, the small **refresh** button stops it and clears the page.
- **Your last report stays on the page**: Reports are saved inside the app. Close Campfire, come back tomorrow, reopen this view — your last report is still there, ready to read. Generate a new one any time to replace it.
- **Same model, same privacy as Chat**: The report uses the same AI model you picked in **Campfire Chat** — local by default, on your own computer, no internet needed. If you switched to a Cloud model there for extra power, the same model is used here. Switch back to local any time and the next report will be generated privately.

_A good first run: try _Last 30 days_. It usually has enough material for a meaningful report without being overwhelming._

## ⚙️ Configuration
This is where Campfire gets shaped to fit you. The Settings view is split into a handful of sections, each focused on one part of the app. You can drag the section handle to reorder them, or collapse a section you're not actively using.

- **Identity — your name, your folder, your pace**: The first section is the one you'll visit most.
  - **Your name** — used by the AI when it talks to you in Chat. Leave it blank to stay anonymous.
  - **Storage folder** — the folder on your computer where your journal lives. It's a normal folder of plain \`.md\` files; you can open it in Finder or Explorer any time. Click **Browse** to point Campfire at a different folder.
  - **Autosave** — how long Campfire waits after you stop typing before writing to disk. Default is 1 second; you can also pick 10 seconds, 1 minute, or _off_ if you want to save only on date change.
  - **Language** — switch the interface between English and Vietnamese without restarting the app.
- **Heart — make the screen yours**: The little floating heart in the corner is draggable: pick it up, drop it anywhere on the screen, and Campfire remembers where you put it. There's also a small lock so a curious finger (yours or a pet's) can't accidentally move it.
- **Ollama — your local AI**: This section is where you check whether Campfire can talk to your local AI (the small helper that powers Chat, Reflection, and Semantic Search). If Ollama isn't installed yet, the section shows a one-click download. If it is, you'll see the list of models you have available and a guide to downloading more.
- **Google Drive Sync — optional backup**: Connect your own Google Drive so your journal can sync across the devices you use Campfire on. Connecting is one button; the section shows the account you're signed in as, a toggle for auto-sync, and (on desktop) a button to create a manual backup and a list of recent ones you can roll back to. Nothing is shared with anyone else — it's your Drive, your files.
- **Mobile App Setup (PWA)**: Want Campfire on your phone or tablet too? This section walks you through installing the mobile web app to your home screen in a couple of taps, so it behaves like a regular app — full screen, its own icon, offline-capable.
- **Legacy Export (when shown)**: This section only appears once you've set a storage folder. It lets you bundle your whole journal into a single Markdown or JSON file — useful for moving your writing somewhere else, or for keeping a personal archive outside the app.

_A note on the sidebar: the logo and the words under it ("Campfire" and the short tagline) can be edited by clicking them directly in the sidebar — you don't need to come here for that._

## 💾 Auto-Save & Auto-Sync (The Safety Net)
Campfire's promise is simple: **you never have to remember to save, and your work is always on more than one device if you want it to be.** The pieces below explain how that promise is kept.

### Auto-Save
- **Desktop — quiet saves on a short pause**: Every time you stop typing for a moment, the desktop app writes your entry to disk. The pause length is the **Autosave** setting in **Settings → Identity** (default **1 second**, with 10 seconds, 1 minute, and _off_ as alternatives). If you keep typing, the timer resets — so you'll never save mid-word.
- **Desktop — what gets written, and where**: Each day's entry becomes one plain text file named \`YYYY-MM-DD.md\` in the storage folder you chose in Settings. No database, no proprietary format. You can open the folder in Finder or Windows Explorer and read every entry with any text editor.
- **Desktop — turning autosave off is fine, for a reason**: Setting Autosave to _off_ doesn't put your work at risk. Two other moments still write to disk automatically: when you switch to a different day, and when you leave the editor or quit the app.
- **Mobile — saves very quickly, on purpose**: On a phone you can lose the page with a single accidental swipe, so the mobile app saves about four times a second of inactivity (~400ms). The editor's footer shows a small green "Saved" label so you can see at a glance your words are safe.
- **Mobile — stored locally in your browser**: Mobile entries are kept in a small private database inside your browser (called IndexedDB). It's tucked away on your device — no one else can see it, not even us.
- **On-Navigate Flush — why there's no "Save changes?" dialog**: When you click the arrows to change days, or jump to a date from the Timeline, the editor first writes the entry you're on, then loads the new one. The same protection kicks in when you switch to a different view or close the window — anything you typed but hadn't waited for the autosave timer to fire gets saved on the way out, instantly.

### Auto-Sync (Google Drive)
- **Sync is off by default**: You turn it on in **Settings → Google Drive Sync** by connecting your Drive account and flipping the auto-sync switch.
- **⚠️ One important rule**: Campfire is the **only writer** of the journal files in your Drive folder. If you open one in the Drive website, the Drive desktop app, or any other editor, the next sync will see your manual edit as the new "cloud" version — and may overwrite what you have locally, or surface a confusing conflict. **Always make journal edits from inside Campfire** on a device that has the app open, and avoid having the app open on two devices at the same time.
- **When sync runs (desktop)**: When you open the app (a startup sync so the device is up-to-date), after every successful save (a quiet background sync), or on demand via the cloud icon in the editor's top bar.
- **When sync runs (mobile)**: When you open the app (if auto-sync is on and your Drive connection is still valid), and when you leave the editor (a push of any pending edits).
- **The 3-Way Merge engine**: For each day, Campfire remembers the last version that both sides agreed on (the _base_). When a new sync runs, it compares the current _local_ file and the current _cloud_ file against that base. With three inputs, the engine can usually tell what changed where and combine the changes without losing either side.
  - **Nothing changed anywhere** — nothing to do, sync finishes quickly.
  - **Only your device changed** — your local edit is uploaded to Drive.
  - **Only the cloud changed** — the newer cloud version is downloaded to your device.
  - **Both sides changed differently** — neither side is "right", so you get a conflict to resolve.
  - **A small time-saving trick**: if your local and cloud files were saved within a few seconds of each other and your local still matches the recorded base, sync skips downloading the cloud copy at all. This is purely a speed optimization; the actual decision always comes from comparing the content, not the timestamp.
- **Conflicts — both versions are kept, side by side**: When both sides changed differently, Campfire writes a special "conflict" version of the file into your local copy, with both your version and the cloud version clearly labeled inside (the _Desktop_ section and the _Cloud_ section, each with the date and time it was saved). The cloud copy is left exactly as it was, so you can pick either side without losing anything.
- **Conflicts — that file is frozen until you fix it**: While a file contains conflict markers, sync refuses to touch it on either side, so you don't accidentally clobber either version. You'll see a small "needs conflict resolution" notification listing the affected days, and the entry's card in the editor shows a warning banner until you clean it up.
- **Conflicts — how to resolve**: Open the conflicted day in the Journal Editor. You'll see three choices in a small banner at the top: keep your local version, keep the cloud version, or keep both as one merged entry. Pick the one you want, and the conflict markers are removed automatically.
- **Sync Backups (desktop only)**: Just before a sync starts, the desktop app quietly copies your whole journal folder into a timestamped subfolder next to it (a hidden \`.backups\` folder inside your storage folder). If anything goes wrong during the merge, your previous state is preserved exactly as it was.
- **Sync Backups — five at a time, newest first**: Campfire keeps only the most recent five snapshots; older ones are automatically cleaned up.
- **Sync Backups — rolling back**: Open **Settings → Google Drive Sync** (or the Backups section in the sidebar) to see the list of available backups. Pick a timestamp, confirm, and Campfire will replace the current entries with the snapshot.
- **Sync Backups — on demand**: The same Settings section has a **Create Backup** button you can press any time — handy before trying something experimental with your journal.
- **On mobile there's no equivalent snapshot system** — your entries live in the browser's local database. If you keep both the desktop and mobile apps on auto-sync, your desktop backups act as the safety net for both.

## ⚙️ System
- **Data Sovereignty**: All journal files are stored as plain markdown \`.md\` files in your local \`journal_dir\` (desktop) or IndexedDB (mobile). You can back them up by simply copying the folder.
- **Sync Backups**: Every desktop sync first calls \`create_journal_backup\`, which snapshots the current state into a hidden \`.backups\` folder inside your storage folder. The most recent five snapshots are kept; older ones are cleaned up automatically. Roll back from **Settings → Google Drive Sync → Backups** (or the Restore modal in the sidebar).

## 🧠 AI & Intelligence
- **Model Guide**: Small local models (e.g. \`llama3.2:3b\`) are great for chat/narration. Mid-size (e.g. \`mistral\`, \`qwen2.5:7b\`) are better at reflection. Vision-capable models (e.g. \`llava\`, \`llama3.2-vision\`) are required for image attachments.
- **Semantic Search**: Powered by local Ollama embedding models. You must click **Index** first — there is no magic background indexing. Once indexed, the embeddings live next to your journal folder.
- **The Narrator**: Campfire's chat persona is a calm, perceptive guide. It reads your recent entries, but it will never invent dates or events that aren't in your corpus.

## 🚀 Power User
- **Global Keyboard Cheat Sheet**:
  - \`Ctrl + Wheel\` (anywhere) — zoom the entire UI.
  - \`Ctrl + 0\` — reset zoom to 100%.
  - \`Shift + Click\` (date arrows) — skip empty days.
  - \`Esc\` — close any open modal.
- **Markdown Power-Ups**:
  - Tags: any \`#word\` in your entry is auto-extracted and becomes a clickable filter in Timeline & Search.
  - Checklists: \`- [ ]\` and \`- [x]\` are rendered natively.
  - Images: paste/drop images directly into the editor; they are embedded as base64 inside the markdown file.
- **Advanced Search Operators**: Use quotes for exact phrases (\`"morning routine\"\`) and chain tags with spaces to AND them together.

## 🛠️ Under the Hood
- **3-Way Merge**: When local and cloud disagree, Campfire never silently picks a side. It uses an LCS-based diff to find hunks, then writes a \`<<<<<<< Local / ======= / Remote >>>>>>>\` block into the local file. Resolve manually in the editor.
- **Sync Logs**: The mobile app keeps the last 100 sync events in \`localStorage\` under the key \`past_you_sync_logs\` for quick debugging.
- **Conflict Skipping**: While a file contains conflict markers, sync will refuse to touch it on either side until you remove the markers.`;

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const persistedState = readHelpModalPersistedState();

  const [activeTab, setActiveTab] = useState<string>(persistedState.activeTab);
  const [copied, setCopied] = useState<boolean>(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(persistedState.openCategories);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const [modalWidth, startResize, resetModalWidth] = useResizer({
    key: "help-modal-width",
    defaultVal: 768,
    mode: "px",
    min: 640,
    max: 1400,
    multiplier: 1,
  });

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    writeHelpModalPersistedState({ activeTab, openCategories });
  }, [activeTab, openCategories]);

  if (!isOpen) return null;

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(GUIDE_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy guide text:", err);
    }
  };

  const mainTabs = [
    { id: "journal", label: "Journal Editor", icon: BookOpen },
    { id: "timeline", label: "Timeline Browse", icon: History },
    { id: "search", label: "Keyword Search", icon: Search },
    { id: "chat", label: "Campfire Chat", icon: MessageSquare },
    { id: "reflection", label: "Reflection Reports", icon: Sparkles },
    { id: "config", label: "Configuration", icon: Settings },
  ];

  type SubTab = { id: string; label: string; icon: any };
  const expandableSections: Array<{
    id: string;
    label: string;
    icon: any;
    subTabs: SubTab[];
  }> = [
    {
      id: "auto-save",
      label: "Auto Save",
      icon: Save,
      subTabs: [
        { id: "save-desktop", label: "Desktop", icon: FileText },
        { id: "save-mobile", label: "Mobile", icon: FileText },
        { id: "save-flush", label: "On-Navigate Flush", icon: Clock },
      ],
    },
    {
      id: "auto-sync",
      label: "Auto Sync",
      icon: Cloud,
      subTabs: [
        { id: "sync-trigger", label: "When It Runs", icon: FolderSync },
        { id: "sync-merge", label: "3-Way Merge", icon: GitMerge },
        { id: "sync-conflict", label: "Conflicts", icon: AlertTriangle },
        { id: "sync-backup", label: "Backups", icon: Database },
      ],
    },
  ];

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSubTabActive = (subId: string) => activeTab === subId;

  return (
    <div
      onPointerDown={(e) => {
        const target = e.target as Node;
        pointerStartedInsideRef.current = modalRef.current?.contains(target) ?? false;
        pointerMovedRef.current = false;
        activePointerIdRef.current = e.pointerId;
        startPosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        const start = startPosRef.current;
        if (!start) return;
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) pointerMovedRef.current = true;
      }}
      onPointerUp={(e) => {
        if (activePointerIdRef.current !== e.pointerId) return;
        if (pointerStartedInsideRef.current) {
          pointerStartedInsideRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        if (pointerMovedRef.current) {
          pointerMovedRef.current = false;
          activePointerIdRef.current = null;
          startPosRef.current = null;
          return;
        }
        activePointerIdRef.current = null;
        startPosRef.current = null;
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        style={{ width: modalWidth }}
        className="relative w-full max-w-[95vw] bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-brand/40 bg-bg-app/10">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-accent-brand" />
            <h2 className="text-lg font-bold tracking-tight text-text-primary">
              Campfire Feature & Tips Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-app/40 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-56 border-r border-border-brand/30 bg-bg-app/5 p-3 flex flex-col gap-1 overflow-y-auto shrink-0 select-none">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-accent-brand text-bg-app"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Divider between Feature Guide and System/Knowledge sections */}
            <div className="my-2 border-t border-border-brand/40" />

            {/* Expandable sections (Auto Save, Auto Sync, etc.) */}
            {expandableSections.map((section) => {
              const SectionIcon = section.icon;
              const isOpen = openCategories[section.id];
              const hasActiveSub = section.subTabs.some((s) => isSubTabActive(s.id));
              return (
                <div key={section.id} className="flex flex-col">
                  <button
                    onClick={() => toggleCategory(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      hasActiveSub
                        ? "text-accent-brand"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
                    }`}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <SectionIcon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{section.label}</span>
                  </button>
                  {isOpen && (
                    <div className="ml-3 pl-2 border-l border-border-brand/30 flex flex-col gap-0.5 mt-0.5 mb-1 animate-fade-in">
                      {section.subTabs.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = isSubTabActive(sub.id);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setActiveTab(sub.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                              subActive
                                ? "bg-accent-brand/15 text-accent-brand"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-app/40"
                            }`}
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Guide Details View */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-text-primary">
            {activeTab === "journal" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <BookOpen className="h-4.5 w-4.5" />
                  Journal Editor
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  This is your private spot by the fire. Each day gets its own page — a quiet place to write down what happened, how you felt, or simply what you'd like to remember.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Just start writing</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The moment you open today's page, the app is already waiting for you. No buttons to click, no menus to open — just type.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Make the text comfortable for your eyes</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Hold the <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-border-brand/50">Ctrl</code> key and scroll your mouse wheel up to make the words bigger, or down to make them smaller — anywhere in the app. You can also use:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li>Zoom in: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-border-brand/50">Ctrl + =</code></li>
                        <li>Zoom out: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-brand/50">Ctrl + -</code></li>
                        <li>Back to normal size: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-brand/50">Ctrl + 0</code></li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Skip past quiet days</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Use the little arrows on either side of the date to move one day at a time. Want to jump straight to the last day you actually wrote something? Hold <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-brand/50">Shift</code> while clicking an arrow and we'll fly past the empty days for you.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">We save as you go</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      You never have to remember to save. Campfire quietly tucks every word away as you type, and the moment you switch to another day or another view, your writing is already safe.
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
                  Take your time. No one's reading over your shoulder.
                </p>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <History className="h-4.5 w-4.5" />
                  Timeline Browse
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  This is where you look back over your life. Every day you wrote something is laid out in order. It's a quiet way to see your story unfold.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Each card is a day in your life</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      You'll see the date, a small preview of what you wrote, and any <span className="text-accent-brand font-mono">#tags</span> you used that day. Tags you already follow are highlighted so you know which threads are active.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Follow a thread, not just a day</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      See a tag like <span className="text-accent-brand font-mono">#gym</span> on a card? Click it. Campfire will jump you straight to <strong>Keyword Search</strong> with every entry about that topic already filtered for you — past, present, and future entries that mention it.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Choose what a click does</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Up at the top of the page there's a small switch:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Click to Open</strong> — click a day to open it in the editor, ready to read or add to.</li>
                        <li><strong>Click to Select</strong> — click days like checkboxes, then export them as a single file or delete them in one go. Great for clearing out old entries or saving a chapter of your life.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Zoom in on a stretch of time</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Don't want to see everything? Use the date picker in the header to choose a window. There are friendly shortcuts like <em>Last 7 days</em>, <em>Last 30 days</em>, <em>This year</em>, or you can pick any two dates yourself. Your choice is remembered next time.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Keep scrolling, more is on the way</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      We only load the most recent 50 entries to start, so opening the timeline feels instant. When you reach the bottom, a small button offers to load the next 50. The list keeps going as long as your journal does.
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
                  A tip: try opening the timeline the first time you use Campfire, just to see the shape of your days. You'll be surprised how much you've written.
                </p>
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Search className="h-4.5 w-4.5" />
                  Keyword Search
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Search is how you find that one thing you wrote — even when you can't remember when, or which day, or which exact words you used. Think of it as the index to your whole life in Campfire.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Two ways to look for something</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      At the top of the page, you can switch between two search modes:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Keyword</strong> — the everyday one. Type a word or phrase and we find every line in your journal that contains it. Fast, private, works the moment you type. Think of it like Ctrl+F, but for your whole life.</li>
                        <li><strong>Semantic</strong> — the magic one. Describe what you mean in plain words, even if you never used those exact words. Search for <em>"days I felt stuck at work"</em> and we'll find entries that <em>talk about</em> that, not just ones that literally use those words. This one needs a small helper called Ollama running on your computer; The small info icon next to the subtitle explains how to set it up.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Search by tag</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Type a tag like <span className="text-accent-brand font-mono">#work</span> into the box and we'll find every entry you ever tagged that way. Want entries that mention <em>both</em> <span className="text-accent-brand font-mono">#work</span> and <span className="text-accent-brand font-mono">#anxiety</span>? Type them with a space between — the <strong>AND</strong> / <strong>OR</strong> toggle at the top lets you pick. (Default is AND, so just listing tags narrows the search.)
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Reading a result</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Each result card shows the date, a small snippet of the actual line that matched (so you can see the context), and any <span className="text-accent-brand font-mono">#tags</span> from that day. With semantic search you'll also see a small percentage that tells you how confident the match is — closer to 100% means a stronger match.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">From a result, into the journal</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Want to keep reading around the match? Click a result and it opens that day in the editor, right where you left off. Want to grab a whole set of results? Switch the top toggle to <strong>Click to Select</strong> and pick the days you want — then export them together as one file, or clean them up if you no longer need them.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Narrow the time window</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Searching everything can feel like too much. Use the date range at the top to limit results to one chapter of your life — <em>last 30 days</em>, <em>this year</em>, or pick any two dates yourself. Your last choice is remembered next time.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Browse your tags</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      On the side you'll find a small cloud of every <span className="text-accent-brand font-mono">#tag</span> you've ever used, sorted alphabetically. It's a quick way to see the themes of your life, and clicking any tag is the same as typing it into the search box.
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
                  A gentle reminder: nothing leaves your computer. Keyword search is instant and offline; semantic search runs on your own machine, never on a server somewhere else.
                </p>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <MessageSquare className="h-4.5 w-4.5" />
                  Campfire Chat
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  This is the heart of Campfire. The other views help you <em>write</em>, <em>find</em>, and <em>remember</em>. This one helps you <em>understand</em>. You're talking to a small AI companion called the <strong>Narrator</strong> — and unlike most AI, the Narrator has actually <em>read your journal</em> before it says a word.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Who you're talking to</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The Narrator is a calm, perceptive voice that sits across from you by the fire. It knows your name, the dates you've been writing, and everything you've written in the chosen window. It doesn't pretend to know more than that — and it will only talk about what's actually in your entries.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">What the Narrator is good at</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Three things, in this order:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Spotting patterns over time.</strong> "You mentioned feeling stuck at work on five separate days this month — and four of them were Mondays." That's more useful than a long summary.</li>
                        <li><strong>Spotting what's missing.</strong> If you wrote about a plan or a worry and then went quiet, the Narrator will gently name the silence — without inventing reasons. "You said on the 5th you'd start Spanish every morning. I don't see it come up again. What changed?"</li>
                        <li><strong>Noticing the gap between what you said and what you did.</strong> Compare your stated intentions to your lived entries, side by side. This is the Narrator's most useful move.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">How to start a useful conversation</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      You don't have to use a special prompt. The Narrator will work with whatever you say. Some gentle openers to try:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><em>"How do you read this month?"</em></li>
                        <li><em>"What have I been avoiding?"</em></li>
                        <li><em>"What did I get right this week?"</em></li>
                        <li><em>"I feel stuck. Can you look at the last 30 days and tell me what you see?"</em></li>
                      </ul>
                      A small <em>sparkle chip</em> above the input suggests a fresh question whenever the chat is empty — click it to fill the box, or click the little ↻ to swap it for another.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">You stay in control of the conversation</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Every word you or the Narrator said can be revisited. Hover over any of your own messages and a small pencil appears — click it to edit what you asked, and the Narrator will regenerate the conversation from that point onward as if you'd said the new thing all along. If a reply is going in the wrong direction, hit the stop button to pause it mid-sentence. If you want a clean slate, the refresh icon in the header starts the conversation over.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Show, don't just tell</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      You can drag, paste, or attach an image to your message — a photo, a screenshot, a sketch. If you've picked a vision-capable model, the Narrator can read it and talk about what it sees alongside the rest of your journal.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Your words stay close to home</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      By default, the Narrator runs on a small AI model <em>on your own computer</em>, through a free helper called Ollama. Your journal entries never leave your machine — they aren't sent to a server to be read. If your computer is older or doesn't have a strong graphics card and the local models feel slow, you can switch to a <strong>Cloud model</strong> in the model picker at the top of the page. The trade-off: a Cloud model is faster and more capable, but it may send your chat's info to a third-party provider, so only use Cloud models if you trust it. You can switch back to local any time.
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
                  The Narrator isn't a therapist and won't pretend to be. But it is honest, brief, and actually paying attention. which is rarer than it sounds.
                </p>
              </div>
            )}

            {activeTab === "reflection" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Sparkles className="h-4.5 w-4.5" />
                  Reflection Reports
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Chat is for back-and-forth. This view is for the <em>summary letter from your past self</em> — pick a stretch of time, and your local AI will read everything you wrote in that window and write you one structured report.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">What you get, every time</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The report is always split into the same five sections, so once you know the shape you can skim straight to the part you care about:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Recurring Themes</strong> — the same people, activities, or thoughts that keep coming up.</li>
                        <li><strong>Emotional Temperature</strong> — the overall mood of the window, and how it shifts.</li>
                        <li><strong>Notable Progress</strong> — wins, breakthroughs, and small things that quietly got better.</li>
                        <li><strong>Key Challenges</strong> — the active struggles, worries, or blockages you're still carrying.</li>
                        <li><strong>Growth Recommendations</strong> — a few small, concrete next steps the AI suggests, grounded in what you actually wrote.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">How to run one</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      At the top of the page, choose a <strong>date range</strong> — there's a calendar picker plus friendly presets like <em>Last 7 days</em>, <em>Last 30 days</em>, <em>This year</em>, or pick any two dates yourself. Then click the <strong>Generate Report</strong> button (the lightning bolt) and watch the report stream in word by word. If you change your mind mid-way, the small <strong>refresh</strong> button stops it and clears the page.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Your last report stays on the page</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Reports are saved inside the app. Close Campfire, come back tomorrow, reopen this view — your last report is still there, ready to read. Generate a new one any time to replace it.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Same model, same privacy as Chat</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The report uses the same AI model you picked in <strong>Campfire Chat</strong> — local by default, on your own computer, no internet needed. If you switched to a Cloud model there for extra power, the same model is used here. Switch back to local any time and the next report will be generated privately.
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
                  A good first run: try <em>Last 30 days</em>. It usually has enough material for a meaningful report without being overwhelming.
                </p>
              </div>
            )}

            {activeTab === "config" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Settings className="h-4.5 w-4.5" />
                  Configuration
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  This is where Campfire gets shaped to fit you. The Settings view is split into sections that you can reorder, expand, or collapse to keep your space neat.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Identity & Storage — your name, folder, sync & backups</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Keep your personal profile and journal files safe and organized:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Your name</strong> — used by the AI helper when talking to you in Chat. Leave it blank if you prefer to stay anonymous.</li>
                        <li><strong>Storage folder</strong> — the folder on your computer where your journal entries are saved. Click <strong>Browse</strong> to pick a different folder.</li>
                        <li><strong>Autosave frequency</strong> — choose how long Campfire waits after you stop typing before saving your work (1 second, 10 seconds, 1 minute, or off).</li>
                        <li><strong>Language</strong> — switch the app interface between English and Vietnamese instantly.</li>
                        <li><strong>Google Drive Sync</strong> — connect your Google account so your journal stays in sync across all your devices.</li>
                        <li><strong>Local Backups</strong> — create a safe backup copy of your journal with one click, or restore a previous snapshot whenever you need.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Heart Settings — customize the floating heart</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Make the floating heart widget your own:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Show donation heart</strong> — show or hide the floating heart. You can drag and drop it anywhere on the screen, and Campfire will remember your favorite spot.</li>
                        <li><strong>Click behavior</strong> — choose whether clicking the heart showers your screen with falling hearts or opens the support window.</li>
                        <li><strong>Falling heart speed</strong> — adjust how fast or slow the hearts float down your screen.</li>
                        <li><strong>Heart size</strong> — make the floating heart icon larger or smaller.</li>
                        <li><strong>Keyboard shortcut</strong> — pick a key on your keyboard to trigger a shower of falling hearts anytime you press it.</li>
                        <li><strong>Custom heart image</strong> — upload your own picture or icon to replace the red heart, or remove it to return to default.</li>
                        <li><strong>Reset position and size</strong> — snap the heart back to its default location and size if it ever gets misplaced.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Ollama Local AI Link — your private local AI</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Check and manage your local AI helper that powers Chat, Reflection reports, and Search:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Connection status</strong> — see if your local AI is ready, or use the one-click download button if it's not installed yet.</li>
                        <li><strong>Guide & installed models</strong> — check which AI models are ready on your computer and view helpful setup tips.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Mobile App Setup (PWA) — Campfire on your phone</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Set up Campfire on your mobile phone or tablet so it works like a regular app:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Mobile Link & QR Code</strong> — copy the web address with one click or scan the QR code with your phone camera.</li>
                        <li><strong>Installation guide</strong> — follow simple step-by-step instructions for iPhone, iPad, or Android to add Campfire to your home screen.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Export / Import — keep or move your journal</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Appears once a storage folder is set:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Export journal</strong> — bundle your entire journal into a single file to keep a personal archive or move it somewhere else.</li>
                        <li><strong>Import journal</strong> — bring past journal files back into Campfire.</li>
                      </ul>
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
                  A note on the sidebar: the logo and the words under it ("Campfire" and the short tagline) can be edited by clicking them directly in the sidebar — you don't need to come here for that.
                </p>
              </div>
            )}

            {/* ===== Auto Save Sub-Tabs ===== */}
            {activeTab === "save-desktop" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Save className="h-4.5 w-4.5" />
                  Auto Save — Desktop
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  How the desktop app keeps what you wrote safe on disk.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Saves happen on a short pause, not on every keystroke</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Every time you stop typing for a moment, Campfire quietly writes the entry to disk. The pause length is the <strong>Autosave</strong> setting in <strong>Settings → Identity</strong> — by default <strong>1 second</strong>, with 10 seconds, 1 minute, and <em>off</em> as the other choices. If you keep typing, the timer resets, so you'll never lose a half-typed word to a save.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">What gets written, and where</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Each day's entry becomes one plain text file named <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-border-brand/50">YYYY-MM-DD.md</code> in the storage folder you picked in Settings. That's it — no database, no proprietary format, nothing hidden. You can open the folder in Finder or Windows Explorer and read every entry with any text editor.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Turning autosave off is fine — for a reason</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Setting Autosave to <em>off</em> doesn't mean your work is at risk. Two other moments still write to disk automatically: when you switch to a different day, and when you close the journal or quit the app. So you can disable the timer if you find it distracting, and still trust that nothing is lost.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">If you've turned on Google Drive sync</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Each successful save quietly kicks off a sync in the background, so the cloud copy catches up as you write. You don't have to do anything — the cloud icon at the top of the editor will show its progress, and you'll get a small notification when it finishes.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "save-mobile" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Save className="h-4.5 w-4.5" />
                  Auto Save — Mobile (PWA)
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  How the mobile web app keeps what you wrote safe, in your browser.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Saves very quickly, on purpose</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      On a phone you can lose the page with a single accidental swipe. So the mobile app saves about four times a second of inactivity (~400ms) — fast enough that even a sudden tab close can't lose more than the last half-second of typing. The editor's footer shows a small green "Saved" label so you can see at a glance that your words are safe.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Stored locally in your browser</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Mobile entries are kept in a small private database inside your browser (called IndexedDB). It's tucked away on your device — no one else can see it, not even us. If you sign in with the same browser again later, your entries are right where you left them.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "save-flush" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Clock className="h-4.5 w-4.5" />
                  On-Navigate Flush
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Why you never see a "Save changes?" dialog in Campfire — and why you can trust that the words you just wrote are still there.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Changing days saves the day you're leaving</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      When you click the left or right arrow to move from today to yesterday — or jump to a date from the Timeline — Campfire first writes the entry you're on, then loads the new one. You don't have to think about it; the switch is the save. This happens whether or not autosave is on, and it works even if you turn autosave off entirely.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Leaving the editor saves what's in flight</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The same protection kicks in when you switch to a different view (Search, Timeline, Chat, Settings) or close the window. Anything you typed but hadn't yet waited for the autosave timer to fire gets saved on the way out, instantly, before the page goes away.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">What this means for you</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      You can write freely and walk away at any moment. The worst-case loss is roughly whatever was on screen for less than a second — and even that's only possible if you somehow manage to crash the app between two keystrokes.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ===== Auto Sync Sub-Tabs ===== */}
            {activeTab === "sync-trigger" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <FolderSync className="h-4.5 w-4.5" />
                  When Sync Runs
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Sync is off by default. You turn it on in <strong>Settings → Google Drive Sync</strong> by connecting your Drive account and flipping the auto-sync switch.
                </p>

                {/* Warning: do not edit files directly in Drive */}
                <div className="rounded-xl p-3.5 border border-amber-500/50 bg-amber-500/10">
                  <span className="font-bold text-xs text-amber-500 block mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    One important rule
                  </span>
                  <span className="text-xs text-text-secondary leading-relaxed">
                    Campfire is the <strong>only writer</strong> of the journal files in your Drive folder. If you open one in the Drive website, the Drive desktop app, or any other editor, the next sync will see your manual edit as the new "cloud" version — and may overwrite what you have locally, or surface a confusing conflict. <strong>Always make journal edits from inside Campfire</strong> on a device that has the app open, and avoid having the app open on two devices at the same time.
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">On desktop</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      <ul className="list-disc pl-4.5 space-y-1">
                        <li><strong>When you open the app</strong> — a sync runs in the background so the device starts up-to-date.</li>
                        <li><strong>After every save</strong> — every entry that lands on disk triggers a quiet background sync if Drive is connected.</li>
                        <li><strong>On demand</strong> — click the small cloud icon in the editor's top bar if you want to force a sync right now.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">On mobile</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      <ul className="list-disc pl-4.5 space-y-1">
                        <li><strong>When you open the app</strong> — a sync runs if you've turned on auto-sync and your Drive connection is still valid.</li>
                        <li><strong>When you leave the editor</strong> — going back to the entry list pushes any pending edits to the cloud.</li>
                      </ul>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sync-merge" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <GitMerge className="h-4.5 w-4.5" />
                  3-Way Merge Engine
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  The same sync engine runs on desktop and mobile. It's deliberately cautious — it never silently throws away your work.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Comparing three versions, not two</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      For each day, Campfire keeps a small private note: the last version that both your computer and the cloud agreed on (the <em>base</em>). When a new sync runs, it compares the current <em>local</em> file and the current <em>cloud</em> file against that base. With three inputs, the engine can usually tell what changed where — and combine the changes without losing either side.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">The four cases the engine knows</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      <ul className="list-disc pl-4.5 space-y-1">
                        <li><strong>Nothing changed anywhere</strong> — nothing to do, sync finishes quickly.</li>
                        <li><strong>Only your device changed</strong> — your local edit is uploaded to Drive.</li>
                        <li><strong>Only the cloud changed</strong> — the newer cloud version is downloaded to your device.</li>
                        <li><strong>Both sides changed differently</strong> — neither side is "right", so you get a conflict to resolve. (See the Conflicts tab.)</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">A small time-saving trick</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      If your local and cloud files were saved within a few seconds of each other and your local still matches the recorded base, sync skips downloading the cloud copy at all — it knows the cloud can't have changed. This is purely a speed optimization; the actual decision always comes from comparing the content, not the timestamp.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sync-conflict" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  Conflict Resolution
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  What happens when both you (on one device) and the cloud (or another device) edited the same day, and neither side matches the previous shared version.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Both versions are kept, side by side</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Campfire writes a special "conflict" version of the file into your local copy, with both your version and the cloud version clearly labeled inside the file (the <em>Desktop</em> section and the <em>Cloud</em> section, each with the date and time it was saved). The cloud copy is left exactly as it was, so you can pick either side without losing anything.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">That file is frozen until you fix it</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      While a file contains conflict markers, sync will refuse to touch it — on either side — so you don't accidentally clobber either version. You'll see a small "needs conflict resolution" notification listing the affected days, and the entry's card in the editor shows a warning banner until you clean it up.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">How to resolve</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Open the conflicted day in the Journal Editor. You'll see three choices in a small banner at the top: keep your local version, keep the cloud version, or keep both as one merged entry. Pick the one you want, and the conflict markers are removed automatically. The next sync will then catch up cleanly.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sync-backup" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Database className="h-4.5 w-4.5" />
                  Sync Backups
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  On desktop, Campfire takes a snapshot of your journal folder before every sync, so a bad merge can always be undone.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">A frozen copy before each sync</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Just before a sync starts, the desktop app quietly copies your whole journal folder into a timestamped subfolder next to it (a hidden <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-xs border border-brand/50">.backups</code> folder inside your storage folder). If anything goes wrong during the merge, your previous state is preserved exactly as it was.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Five backups at a time, newest first</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Campfire keeps only the most recent five snapshots — older ones are automatically cleaned up so they don't pile up forever. The newest backup is always the one right before your most recent sync.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">Rolling back to a previous state</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Open <strong>Settings → Google Drive Sync</strong> (or the Backups section in the sidebar) to see the list of available backups. Pick a timestamp, confirm, and Campfire will replace the current entries with the snapshot — useful if a merge went wrong and you'd rather go back to where you were before.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">You can also back up any time</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Don't want to wait for a sync? The same Settings section has a <strong>Create Backup</strong> button you can press on demand — handy before trying something experimental with your journal.
                    </span>
                  </div>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed pt-2 italic">
                  On mobile there's no equivalent snapshot system — your entries live in the browser's local database. If you keep both the desktop and mobile apps on auto-sync, your desktop backups act as the safety net for both.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border-brand/40 bg-bg-app/10">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-brand bg-bg-surface hover:border-accent-brand text-xs font-semibold text-text-primary transition-all cursor-pointer shadow-sm select-none"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Copied as MD!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-accent-brand" />
                <span>Copy as MD</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg border border-border-brand hover:border-accent-brand bg-bg-surface text-text-primary text-sm font-medium transition-all duration-200 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Right-edge resize handle (double-click resets to default) */}
        <div
          onMouseDown={startResize}
          onDoubleClick={resetModalWidth}
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-accent-brand/5 z-30 group flex items-center justify-center select-none"
          title="Drag to resize · double-click to reset"
        >
          <div className="w-[2px] h-12 bg-border-brand/20 group-hover:bg-accent-brand/80 rounded transition-colors duration-150" />
        </div>
      </div>
    </div>
  );
}
