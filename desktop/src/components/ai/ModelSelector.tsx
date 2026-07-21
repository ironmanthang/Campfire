import { useState, useEffect, useRef } from "react";
import { Pin, ChevronDown, Search } from "lucide-react";
import { OllamaModelInfo } from "../../services/ollama";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (name: string) => void;
  models: OllamaModelInfo[];
  pinnedModels: string[];
  onTogglePin: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  models,
  pinnedModels,
  onTogglePin,
  placeholder = "Select a model...",
  className = ""
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter models based on search query
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filteredModels.filter((m) => pinnedModels.includes(m.name));
  const unpinned = filteredModels.filter((m) => !pinnedModels.includes(m.name));

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-bg-input border border-border-brand/60 px-3 py-1.5 rounded-lg text-text-primary text-xs font-semibold focus:outline-none focus:border-accent-brand cursor-pointer transition-all min-w-[200px]"
      >
        <span className="truncate">{selectedModel || placeholder}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-border-brand bg-bg-surface shadow-lg z-50 overflow-hidden flex flex-col max-h-80">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-border-brand/40 bg-bg-input/50 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-text-secondary shrink-0" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-text-primary text-xs focus:outline-none placeholder-text-secondary/60"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto p-1.5 space-y-1 select-none scrollbar-thin max-h-56">
            {pinned.length === 0 && unpinned.length === 0 ? (
              <div className="text-center py-4 text-xs text-text-secondary italic">No models found</div>
            ) : (
              <>
                {/* Pinned Models */}
                {pinned.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-2 py-1 text-[9px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                      <span>📌 Pinned Models</span>
                    </div>
                    {pinned.map((m) => (
                      <div
                        key={m.name}
                        onClick={() => {
                          onSelectModel(m.name);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                          selectedModel === m.name
                            ? "bg-accent-brand/15 text-accent-brand font-semibold"
                            : "hover:bg-bg-app text-text-primary"
                        }`}
                      >
                        <div className="flex flex-col truncate pr-1">
                          <span className="truncate">{m.name}</span>
                          <span className="text-[9px] text-text-secondary">
                            {(m.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(m.name);
                          }}
                          className="p-1.5 rounded-md hover:bg-bg-input text-accent-brand transition-colors shrink-0"
                          title="Unpin Model"
                        >
                          <Pin className="h-3.5 w-3.5 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Other Models */}
                {unpinned.length > 0 && (
                  <div className="space-y-0.5 pt-1">
                    <div className="px-2 py-1 text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                      {pinned.length > 0 ? "Others" : "All Models"}
                    </div>
                    {unpinned.map((m) => (
                      <div
                        key={m.name}
                        onClick={() => {
                          onSelectModel(m.name);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                          selectedModel === m.name
                            ? "bg-accent-brand/15 text-accent-brand font-semibold"
                            : "hover:bg-bg-app text-text-primary"
                        }`}
                      >
                        <div className="flex flex-col truncate pr-1">
                          <span className="truncate">{m.name}</span>
                          <span className="text-[9px] text-text-secondary">
                            {(m.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(m.name);
                          }}
                          className="p-1.5 rounded-md hover:bg-bg-input text-text-secondary hover:text-text-primary transition-colors shrink-0"
                          title="Pin Model"
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
