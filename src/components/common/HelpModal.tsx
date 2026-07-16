import { useState, useEffect } from "react";

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
  HelpCircle
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

## ⚙️ Configuration
- **Visual Branding**: Click the logo icon to load a custom image, and hover-click to edit the Title and Subtitle at the top of the Sidebar.
- **Custom Integrations**: Configure Ollama connection URLs, API keys for Tavily/Google, or use the free keyless Brave search.`;

export function HelpModal({ isOpen, onClose }: HelpModalProps) {

  const [activeTab, setActiveTab] = useState<string>("journal");
  const [copied, setCopied] = useState<boolean>(false);

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

  const tabs = [
    { id: "journal", label: "Journal Editor", icon: BookOpen },
    { id: "timeline", label: "Timeline Browse", icon: History },
    { id: "search", label: "Keyword Search", icon: Search },
    { id: "chat", label: "Campfire Chat", icon: MessageSquare },
    { id: "reflection", label: "Reflection Reports", icon: Sparkles },
    { id: "config", label: "Configuration", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
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
          <div className="w-48 border-r border-border-brand/30 bg-bg-app/5 p-3 flex flex-col gap-1 overflow-y-auto shrink-0 select-none">
            {tabs.map((tab) => {
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
