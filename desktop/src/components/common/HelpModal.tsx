import { useState, useEffect, useRef } from "react";

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

const GUIDE_MARKDOWN = `# Campfire User Guide

Welcome to Campfire. Here is a guide to the hidden tips, shortcuts, and capabilities across all sections of the app:

## 📝 Journal Editor
- **Focus**: The editor text area is focused automatically upon opening.
- **Shortcuts & Font Zoom**:
  - Press \`Ctrl + Mouse Wheel Up\` to zoom text in, and \`Ctrl + Mouse Wheel Down\` to zoom text out.
  - Press \`Ctrl + =\` or \`Ctrl + +\` to zoom in.
  - Press \`Ctrl + -\` to zoom out.
  - Press \`Ctrl + 0\` to reset font size to 100%.
- **Chronological Navigation**:
  - Click the Left/Right arrows on either side of the date selector to go backward/forward a day.
  - **Pro Tip**: Hold \`Shift\` while clicking the Left/Right date arrow to instantly skip empty days and jump directly to the next/previous written journal entry.
- **Auto-save**: Your journal is auto-saved as you write, or when navigating away to another view.

## 📅 Timeline Browse
- **Chronological Feed**: Lists all your entries grouped by month.
- **Interactive Tags**:
  - Click any tag (e.g. \`#fitness\`) on an entry card to instantly jump to the **Keyword Search** view filtered by that tag.
- **Click Mode Toggle**:
  - **Click to Open**: Clicking a card opens it directly in the editor.
  - **Click to Select**: Clicking a card selects it, opening a bulk action toolbar to export selected entries (as JSON or Text compilations) or delete them in bulk.
- **Date Presets**: Use pre-defined date ranges (7 days, 30 days, 3 months, this year, or all) to filter your timeline view.

## 🔍 Keyword Search
- **Search Modes**:
  - **Keyword**: High-speed pattern matching.
  - **Semantic**: Conceptual search powered by local Ollama embedding models (requires indexing/Ollama connection).
- **Interactive Tags**: Click any tag in the result snippet cards to narrow search query terms.
- **Click Mode Toggle**:
  - Toggle between **Click to Open** (editor preview) and **Click to Select** (bulk export/deletion) on search results cards.

## 💬 Campfire Chat
- **Narrator Persona**: You are talking to the Narrator at the Campfire — a calm, perceptive guide who observes your entries.
- **Past Message Editing**:
  - **Pro Tip**: Hover over any of your past messages and click the pencil icon to edit them and regenerate the conversation flow.
- **Vision Attachments**: You can drag and drop or attach images to your prompt; the AI has complete visual capabilities.
- **Tool Options**: The AI can execute tools for you (read journal entries, navigate dates in your editor, get system CPU/GPU usage, or scan for low-quality entries).
- **Settings**: Use the gear icon to toggle tools, select custom override models, and set web search keys.

## ✨ Reflection Reports
- **Contextual Awareness**: The reflection model reads entries within your selected date ranges.
- **Insights & Absences**: It is designed to notice patterns over time, name mood shifts, and point out stated intentions that went quiet (absences).

## 💾 Auto-Save & Auto-Sync (The Safety Net)
- **Auto-Save**:
  - **Desktop**: Your journal entry is automatically saved to your local folder after \`autosave_interval\` seconds of inactivity (default 1s, configurable in **Settings → Identity**). It also flushes any pending changes the moment you navigate away from the editor.
  - **Mobile**: A debounced 400ms timer persists every keystroke directly into the local IndexedDB (\`past_you_journal\`) database, so even an abrupt tab close won't lose your words.
- **Auto-Sync (Google Drive)**:
  - When **Google Drive Auto-Sync** is enabled in Settings, every successful save on desktop triggers \`handleSync()\` in the background. Mobile does the same on app start and when you leave the editor.
  - Sync is one-way-or-the-other per entry, using a **3-way merge** (base / local / cloud) with mtime tie-breaking. Conflicts are written into the file itself as \`<<<<<<< / ======= / >>>>>>>\` blocks for you to resolve.
- **⚠️ Important: Do Not Edit .md Files Directly in Google Drive**:
  - Campfire's sync engine assumes it is the **sole writer** of the \`YYYY-MM-DD.md\` files in your Drive folder. Opening and editing a file from the Drive web UI, the Drive desktop app, or any other device will cause the next sync to treat your manual edit as the new "cloud" state — which can silently overwrite your local entry or trigger a conflict block you didn't expect.
  - **Always make journal edits from inside Campfire** on a device that has the app open. Use Drive only as the backup/sync target, not as a manual editor.

## ⚙️ System
- **Data Sovereignty**: All journal files are stored as plain markdown \`.md\` files in your local \`journal_dir\` (desktop) or IndexedDB (mobile). You can back them up by simply copying the folder.
- **Sync Backups**: Every desktop sync first calls \`create_journal_backup\`, which snapshots the current state so you can roll back via the Restore modal if a merge goes wrong.

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

  const [activeTab, setActiveTab] = useState<string>("journal");
  const [copied, setCopied] = useState<boolean>(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "auto-save": true,
    "auto-sync": true,
  });

  const modalRef = useRef<HTMLDivElement | null>(null);
  const pointerStartedInsideRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

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
        className="w-full max-w-3xl bg-bg-surface border border-border-brand rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
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
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left cursor-pointer ${
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
                  Write, customize, and maintain your personal journals in markdown format. 
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🎯 Immediate Focus</span>
                    <span className="text-xs text-text-secondary">When you navigate to this page, the editor text area will automatically autofocus so you can start typing right away.</span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🔍 Font Zoom Shortcuts</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      You can adjust the display size of all text across the app dynamically:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li>Zoom in: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">Ctrl + Wheel Up</code> or <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">Ctrl + =</code></li>
                        <li>Zoom out: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">Ctrl + Wheel Down</code> or <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">Ctrl + -</code></li>
                        <li>Reset to 100%: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">Ctrl + 0</code></li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">⚡ Fast Written-Entry Jumps</span>
                    <span className="text-xs text-text-secondary">
                      Holding the <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">Shift</code> key while clicking the left or right date-navigator arrow will skip all empty days and take you directly to the next/previous written entry.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">💾 Save-on-Unmount</span>
                    <span className="text-xs text-text-secondary">No need to worry about saving. The app automatically saves your active entry as soon as you type or navigate to a different view.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <History className="h-4.5 w-4.5" />
                  Timeline Browse
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Browse your past journal entries chronologically.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🏷️ Tag Navigation</span>
                    <span className="text-xs text-text-secondary">
                      Click any tag (e.g. <span className="text-accent-brand hover:underline font-mono">#gym</span>) at the bottom of an entry card to instantly jump to the **Keyword Search** view filtered by that tag.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🖱️ Click Actions</span>
                    <span className="text-xs text-text-secondary">
                      Use the top toggle:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li><strong>Click to Open</strong>: Clicking anywhere on an entry card opens it in the editor.</li>
                        <li><strong>Click to Select</strong>: Clicking a card starts a bulk selection workflow, exposing a toolbar to export or delete entries.</li>
                      </ul>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Search className="h-4.5 w-4.5" />
                  Keyword Search
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Perform queries to filter or find specific lines in your logs.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🧠 Keyword vs Semantic Search</span>
                    <span className="text-xs text-text-secondary leading-relaxed font-normal">
                      <ul className="list-disc pl-4.5 space-y-1">
                        <li><strong>Keyword</strong>: Standard text pattern lookup.</li>
                        <li><strong>Semantic</strong>: Conceptual similarity lookup powered by your local Ollama embedding models. It recognizes synonyms and language intent.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🔀 Click-to-Select Toggle</span>
                    <span className="text-xs text-text-secondary">
                      Just like the timeline, you can toggle between <strong>Click to Open</strong> (preview journal) and <strong>Click to Select</strong> (bulk export or delete matches).
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <MessageSquare className="h-4.5 w-4.5" />
                  Campfire Chat
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Interact with the Narrator companion to gain deeper insight into your memories.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">✏️ Edit Past Prompts</span>
                    <span className="text-xs text-text-secondary">
                      Hover over any of your past chat messages and click the **Pencil icon** to edit your prompt. The conversation will fork and regenerate from that point onward.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🖼️ Vision Capabilities</span>
                    <span className="text-xs text-text-secondary">
                      Drag-and-drop or paste images directly into your prompt input. If using a vision-enabled model, the Narrator can analyze drawings, photos, or screenshots.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🛠️ Tool Integrations</span>
                    <span className="text-xs text-text-secondary">
                      The AI can call background tools to retrieve system diagnostics, change laptop brightness, read journal archives, or analyze garbage.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reflection" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Sparkles className="h-4.5 w-4.5" />
                  Reflection Reports
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Let the Narrator analyze your behavior and habits across a set time frame.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">📈 Identifying Patterns & Moods</span>
                    <span className="text-xs text-text-secondary">
                      The model is trained to count theme occurrences, highlight energy/mood drops, and anchor arguments to actual dates.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">📭 Tracking Absences</span>
                    <span className="text-xs text-text-secondary">
                      One of the key reflection jobs is identifying what you *did not* write about: e.g. checking if a plan or gym promise made on Monday went completely silent by Friday.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "config" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-accent-brand flex items-center gap-2 border-b border-border-brand/20 pb-2">
                  <Settings className="h-4.5 w-4.5" />
                  Configuration
                </h3>
                <p className="text-text-secondary text-xs leading-relaxed">
                  Personalize the campfire client details and Ollama connection parameters.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🎨 Visual Customization</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      You can personalize the sidebar headers directly:
                      <ul className="list-disc pl-4.5 mt-1.5 space-y-1">
                        <li>Click the logo to select any image file (which will be converted to base64).</li>
                        <li>Click/type inside the Sidebar Title and Subtitle inputs to edit them. Pressing enter or clicking away saves immediately.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🔗 API Keys & Models</span>
                    <span className="text-xs text-text-secondary">
                      Set up connection links to your local Ollama models. Provide credentials for Tavily/Google web search providers, or select keyless Brave search.
                    </span>
                  </div>
                </div>
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
                  How the desktop client (Tauri) keeps your journal safe on disk.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">⏱️ Debounced Save</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Every keystroke updates the editor state, but writing to disk is debounced by <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">config.autosave_interval</code> seconds (default <strong>1s</strong>). The timer resets with each new keystroke so you never save mid-word.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">💾 Storage Backend</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Files are written via the Tauri command <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">write_entry</code> directly into your configured <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">journal_dir</code> as plain <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">YYYY-MM-DD.md</code>. No database, no proprietary format.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🚫 Disable Auto-Save</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Set <strong>Settings → Identity → Autosave Interval</strong> to <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">0</code> to disable timed auto-saves entirely. You can still save manually by switching dates (which triggers an immediate flush) or by closing the app.
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
                  How the mobile PWA keeps your journal safe in the browser.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">⚡ 400ms Debounce</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The mobile editor pipes every change through a <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">setTimeout(saveLocalEntry, 400)</code> in <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">App.tsx</code>. This is intentionally much faster than desktop so an accidental tab close can't lose words.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🗄️ IndexedDB Storage</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Entries are persisted via the <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">saveLocalEntry</code> helper into the <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">past_you_journal</code> IndexedDB database (defined in <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">mobile/src/services/db.ts</code>). The editor's footer shows a green <strong>"Autosaved"</strong> label when the most recent write succeeded.
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
                  Why you never see a "Save changes?" dialog in Campfire.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">⏭️ Date-Switch Flush</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      In <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">useJournalSave.ts</code>, an effect watches <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">currentDate</code>: if the entry is dirty and the date changed, the previous date is flushed immediately via <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">saveEntryImmediate()</code> before the new entry loads.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🧹 Unmount Flush</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The hook also returns a cleanup that, on unmount, saves any in-flight dirty content. This is what protects you when switching views, closing tabs, or quitting the app.
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
                  Sync is opt-in. You must enable <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">google_drive_auto_sync</code> in Settings and have a valid OAuth token.
                </p>

                {/* Warning: do not edit files directly in Drive */}
                <div className="rounded-xl p-3.5 border border-amber-500/50 bg-amber-500/10">
                  <span className="font-bold text-xs text-amber-500 block mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    ⚠️ Do Not Edit .md Files Directly in Google Drive
                  </span>
                  <span className="text-xs text-text-secondary leading-relaxed">
                    Campfire's sync engine is designed to be the <strong>sole writer</strong> of the <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">YYYY-MM-DD.md</code> files in your Drive folder. If you open and edit a file from the Drive web UI, the Drive app, or another device, the next sync may treat your manual edit as the new "cloud" state and overwrite your local entry — or trigger a conflict block you didn't expect. <strong>Always make journal edits from inside Campfire</strong> on a device that has the app open.
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🖥️ Desktop Triggers</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      <ul className="list-disc pl-4.5 space-y-1">
                        <li><strong>On app start</strong>: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-border-brand/50">loadConfig()</code> calls <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">handleSync(false, true)</code> when the toggle is on.</li>
                        <li><strong>After every save</strong>: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">saveEntryImmediate()</code> fires <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">handleSync()</code> if Drive is connected.</li>
                        <li><strong>Manual</strong>: click the cloud icon in the editor header for an on-demand run.</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">📱 Mobile Triggers</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      <ul className="list-disc pl-4.5 space-y-1">
                        <li><strong>On app start</strong>: <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">useEffect</code> in <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">App.tsx</code> reads <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">localStorage['past_you_auto_sync']</code> and runs <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">handleSync()</code> if the token is still valid.</li>
                        <li><strong>On editor back</strong>: returning to the entry list also triggers a sync to push any pending edits.</li>
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
                  The same engine powers both desktop and mobile. It's deliberately cautious — it never silently overwrites.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🌿 LCS Diff (Longest Common Subsequence)</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">getHunks()</code> function in <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">merge.ts</code> computes the LCS of the base vs. local and base vs. cloud, then emits edit hunks. This avoids brittle line-by-line comparison and survives non-adjacent edits.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🤝 The Three Inputs</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      <ul className="list-disc pl-4.5 space-y-1">
                        <li><strong>Base</strong>: the last content both sides agreed on (stored in a per-date <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">sync_base</code> file on desktop, IndexedDB on mobile).</li>
                        <li><strong>Mine</strong>: your local file (and its mtime).</li>
                        <li><strong>Theirs</strong>: the cloud file (with its <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">modifiedTime</code>).</li>
                      </ul>
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">⏱️ mtime Optimization</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      If the local and remote mtimes are within 5 seconds of each other and local content matches the recorded base, sync skips downloading remote content entirely. This is a network optimization only — the real decision always uses content comparison, not time.
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
                  What happens when both sides changed the same day, and neither matches the base.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🚧 Conflict Block Written Locally</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The engine calls <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">buildConflictBlock()</code> to produce a standard merge-marker file and writes it into your local file. The cloud is left untouched so you can pick either side. The labels read <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">Desktop - 7/18/2026...</code> and <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">Cloud - 7/18/2026...</code>.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🛑 Skipped While In Conflict</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Sync refuses to touch any file where <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">hasConflictMarkers()</code> returns true. The date appears in the Sync Result modal as a <em>conflicted</em> entry until you delete the markers.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🧠 How to Resolve</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Open the file in the Journal Editor, keep the version you want, remove the <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> / <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">=======</code> / <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> lines, and save. The next sync will pick up cleanly.
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
                  Campfire snapshots your local folder before every desktop sync, so a bad merge can always be undone.
                </p>
                <div className="space-y-3">
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">📦 Pre-Sync Snapshot</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      At the start of <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">handleSync()</code>, the desktop client invokes the Tauri command <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">create_journal_backup</code>. A timestamped copy of the journal folder is written next to it.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🔄 Restore Workflow</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Open <strong>Settings → Backups</strong> (or the Restore modal from the sidebar) to browse the list of available backups returned by <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">listJournalBackups()</code>. Pick a timestamp and confirm to roll back.
                    </span>
                  </div>
                  <div className="bg-bg-app/40 rounded-xl p-3.5 border border-border-brand/40">
                    <span className="font-bold text-xs text-text-primary block mb-1">🧹 Mobile Tip</span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      The mobile PWA doesn't create a separate backup because IndexedDB revisions are co-located with the current data — but the last 100 sync events are kept under <code className="bg-bg-surface px-1.5 py-0.5 rounded font-mono text-[10px] border border-brand/50">past_you_sync_logs</code> for debugging.
                    </span>
                  </div>
                </div>
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
      </div>
    </div>
  );
}
